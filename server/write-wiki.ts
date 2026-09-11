import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DEFAULT_REPO_ROOT, findMarkdownFiles, extractTitle, wikiRootFor } from "./wiki-fs.js";

const execFileAsync = promisify(execFile);

export type GitRunner = (
  repoRoot: string,
  args: string[],
) => Promise<{ stdout: string; stderr: string }>;

const defaultGitRunner: GitRunner = async (repoRoot, args) => {
  return execFileAsync("git", ["-C", repoRoot, ...args]);
};

export type SchreibeWikiSeiteParams = {
  bereich: string;
  titel: string;
  inhalt: string;
  autor?: string;
};

export type SchreibeWikiSeiteResult = {
  pfad: string;
  aktion: "erstellt" | "ergaenzt";
  bestaetigung: string;
  git: { committed: boolean; pushed: boolean; hinweis?: string };
};

export type SchreibeWikiSeiteOptions = {
  repoRoot?: string;
  git?: GitRunner;
};

function heute(): string {
  return new Date().toISOString().slice(0, 10);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message.trim().split("\n")[0];
  return String(err);
}

// Umlaute/ß bewusst nicht einfach droppen, sondern transliterieren, sonst
// werden "Büro" und "Buro" zum selben Dateinamen.
function slugify(text: string): string {
  const normalized = text
    .trim()
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
  return normalized
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "seite";
}

// Bereich kommt vom MCP-Client (letztlich von einem LLM) und landet in einem
// Dateipfad — deshalb strikt auf sichere Ordnernamen begrenzen, keine ".."
// und keine absoluten Pfade zulassen.
function sanitizeBereich(bereich: string): string {
  const segments = bereich
    .split("/")
    .map((segment) => slugify(segment))
    .filter((segment) => segment.length > 0 && segment !== "seite");
  if (segments.length === 0) {
    throw new Error("Bereich ist leer oder enthält keine gültigen Zeichen.");
  }
  return segments.join("/");
}

async function findExistingPage(
  wikiRoot: string,
  titel: string,
): Promise<{ pfad: string; inhalt: string } | undefined> {
  const target = titel.trim().toLowerCase();
  for (const file of await findMarkdownFiles(wikiRoot)) {
    const content = await fs.readFile(file, "utf-8");
    const found = extractTitle(content);
    if (found && found.toLowerCase() === target) {
      return { pfad: file, inhalt: content };
    }
  }
  return undefined;
}

// "Stand" für den Update-Vermerk: das letzte bereits dokumentierte Datum —
// entweder das jüngste "## Update <Datum>" oder, falls es noch keins gibt,
// das Erstellungsdatum.
function letzterStand(bestehenderInhalt: string): string {
  const updateDates = [...bestehenderInhalt.matchAll(/^## Update (\d{4}-\d{2}-\d{2})/gm)].map(
    (m) => m[1],
  );
  if (updateDates.length > 0) {
    return updateDates.sort().at(-1)!;
  }
  const erstellt = bestehenderInhalt.match(/^- Erstellt: (\d{4}-\d{2}-\d{2})/m);
  return erstellt?.[1] ?? "unbekannt";
}

function neueSeite(titel: string, autor: string, datum: string, inhalt: string): string {
  return [
    `# ${titel}`,
    "",
    "- Status: entwurf",
    `- Autor:in: ${autor}`,
    `- Erstellt: ${datum}`,
    "",
    inhalt.trim(),
    "",
  ].join("\n");
}

// Ergänzt statt überschreibt: bestehender Inhalt bleibt vollständig stehen,
// die Ergänzung landet als eigener, datierter Abschnitt darunter — inklusive
// explizitem Vermerk, falls sie dem bisherigen Stand widerspricht.
function ergaenzterInhalt(
  bestehenderInhalt: string,
  autor: string,
  datum: string,
  neuerAbschnitt: string,
): string {
  const stand = letzterStand(bestehenderInhalt);
  const block = [
    "",
    `## Update ${datum} (${autor})`,
    "",
    `Stand ${stand}: siehe Abschnitte oben. Update ${datum}: ${neuerAbschnitt.trim()} — bei Widerspruch zum bisherigen Stand gilt dies als ausgewiesene Weiterentwicklung, nicht als stillschweigende Korrektur.`,
    "",
  ].join("\n");
  return bestehenderInhalt.replace(/\s*$/, "\n") + block;
}

async function ermittleAutor(repoRoot: string, git: GitRunner): Promise<string> {
  try {
    const { stdout } = await git(repoRoot, ["config", "user.name"]);
    const name = stdout.trim();
    if (name) return name;
  } catch {
    // ignore, siehe Fallback unten
  }
  try {
    const { stdout } = await git(repoRoot, ["config", "user.email"]);
    const email = stdout.trim();
    if (email) return email;
  } catch {
    // ignore
  }
  return "Unbekannt";
}

export async function schreibeWikiSeite(
  params: SchreibeWikiSeiteParams,
  opts: SchreibeWikiSeiteOptions = {},
): Promise<SchreibeWikiSeiteResult> {
  const bereich = params.bereich?.trim();
  const titel = params.titel?.trim();
  const inhalt = params.inhalt?.trim();
  if (!bereich) throw new Error("bereich darf nicht leer sein.");
  if (!titel) throw new Error("titel darf nicht leer sein.");
  if (!inhalt) throw new Error("inhalt darf nicht leer sein.");

  const repoRoot = opts.repoRoot ?? DEFAULT_REPO_ROOT;
  const git = opts.git ?? defaultGitRunner;
  const wikiRoot = wikiRootFor(repoRoot);

  const autor = params.autor?.trim() || (await ermittleAutor(repoRoot, git));
  const datum = heute();

  const bestehend = await findExistingPage(wikiRoot, titel);

  let zielPfad: string;
  let aktion: SchreibeWikiSeiteResult["aktion"];
  let bestaetigung: string;

  if (bestehend) {
    zielPfad = bestehend.pfad;
    aktion = "ergaenzt";
    const neuerInhalt = ergaenzterInhalt(bestehend.inhalt, autor, datum, inhalt);
    await fs.writeFile(zielPfad, neuerInhalt, "utf-8");
    bestaetigung = `Seite "${titel}" ergänzt: neuer Abschnitt "Update ${datum}" von ${autor} hinzugefügt, bisheriger Inhalt unverändert stehen gelassen.`;
  } else {
    const bereichPfad = sanitizeBereich(bereich);
    const dateiname = `${slugify(titel)}.md`;
    const zielOrdner = path.join(wikiRoot, bereichPfad);
    zielPfad = path.join(zielOrdner, dateiname);

    const relCheck = path.relative(wikiRoot, zielPfad);
    if (relCheck.startsWith("..") || path.isAbsolute(relCheck)) {
      throw new Error("Ungültiger Bereich: Zielpfad liegt ausserhalb des Wikis.");
    }

    await fs.mkdir(zielOrdner, { recursive: true });
    const inhaltText = neueSeite(titel, autor, datum, inhalt);
    await fs.writeFile(zielPfad, inhaltText, "utf-8");
    aktion = "erstellt";
    bestaetigung = `Neue Seite "${titel}" angelegt unter ${path.relative(repoRoot, zielPfad)} (Status: entwurf, Autor:in: ${autor}).`;
  }

  const relPfad = path.relative(repoRoot, zielPfad);
  const gitResult = await commitUndPush(repoRoot, git, relPfad, titel, aktion);

  return {
    pfad: relPfad,
    aktion,
    bestaetigung,
    git: gitResult,
  };
}

async function commitUndPush(
  repoRoot: string,
  git: GitRunner,
  relPfad: string,
  titel: string,
  aktion: SchreibeWikiSeiteResult["aktion"],
): Promise<SchreibeWikiSeiteResult["git"]> {
  const commitMsg =
    aktion === "erstellt"
      ? `Wiki: neue Seite "${titel}"`
      : `Wiki: Update "${titel}"`;

  try {
    await git(repoRoot, ["add", "--", relPfad]);
    await git(repoRoot, ["commit", "-m", commitMsg, "--", relPfad]);
  } catch (err) {
    return { committed: false, pushed: false, hinweis: `Commit fehlgeschlagen: ${errorMessage(err)}` };
  }

  try {
    await git(repoRoot, ["push"]);
    return { committed: true, pushed: true };
  } catch {
    try {
      await git(repoRoot, ["push", "--set-upstream", "origin", "HEAD"]);
      return { committed: true, pushed: true };
    } catch (err2) {
      return {
        committed: true,
        pushed: false,
        hinweis: `Commit lokal erstellt, Push fehlgeschlagen: ${errorMessage(err2)}`,
      };
    }
  }
}
