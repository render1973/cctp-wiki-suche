// Git-Commit/Push für den HTTP-Modus. Ersetzt den lokalen Ansatz
// (credential.helper store + PAT), der für die minimale Stdio-Umgebung auf
// Thomas' Rechner gebaut war: im Container wird der Push-Token nicht mehr auf
// Platte persistiert, sondern pro Push direkt in die Remote-URL eingesetzt.
//
// Bekannter Fallstrick: den Ziel-Branch nie implizit annehmen (z. B. hartcodiert
// "master"), sondern bei jedem Schreibvorgang frisch per
// `git rev-parse --abbrev-ref HEAD` ermitteln.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { repoRoot } from "./corpus.js";

const execFileAsync = promisify(execFile);

const DEFAULT_COMMITTER_NAME = "CCTP Wiki Bot";
const DEFAULT_COMMITTER_EMAIL = "wiki-bot@cctp-wiki-suche.noreply";
const MAX_PUSH_ATTEMPTS = 3;

export class GitWriteError extends Error {}

// git verweigert Operationen auf einem Verzeichnis, dessen Dateibesitzer nicht
// dem laufenden Prozess entspricht ("detected dubious ownership") - das greift
// für JEDEN lokalen Repo-Pfad, den git antastet, auch ein per Bind-Mount
// eingehängtes lokales Push-/Pull-Ziel (z. B. das Wegwerf-Repo von
// scripts/verify-docker-e2e.sh unter Docker Desktop/WSL2, wo der Mount aus
// Containersicht einem anderen Nutzer gehört).
//
// `-c safe.directory=...` auf der Kommandozeile reicht NICHT: git ignoriert
// diesen Override für ein Repo, das erst während der lokalen Transport-Phase
// eines pull/push zusätzlich geöffnet wird (empirisch geprüft, nicht nur
// vermutet - siehe git.test.ts). Nur eine tatsächliche Config-DATEI wirkt
// zuverlässig. Damit dafür nicht die echte globale Gitconfig der Maschine
// dauerhaft wächst, zeigt GIT_CONFIG_GLOBAL (eine Umgebungsvariable, die auch
// von git intern gestarteten Hilfsprozessen für den Transport geerbt wird) pro
// Aufruf auf eine frische temporäre Datei, die danach sofort wieder gelöscht
// wird - kein Zustand, keine Persistenz.
//
// Committer-Identität kommt deshalb NIE aus einer globalen Gitconfig (die
// wird pro Aufruf verdeckt), sondern immer explizit aus GIT_COMMITTER_NAME/
// _EMAIL (siehe commitAndPushWikiChange) bzw. `--author` für den Autor.
async function git(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; trust?: string[] } = {},
): Promise<string> {
  const cwd = options.cwd ?? repoRoot;
  const trust = [cwd, ...(options.trust ?? [])];
  const configDir = mkdtempSync(path.join(tmpdir(), "cctp-wiki-gitcfg-"));
  const configFile = path.join(configDir, "config");
  writeFileSync(configFile, trust.map((dir) => `[safe]\n\tdirectory = ${dir}\n`).join(""), "utf-8");
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      env: { ...(options.env ?? process.env), GIT_CONFIG_GLOBAL: configFile },
    });
    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    const message = stderr.trim() || (error as Error).message;
    throw new GitWriteError(`git ${args.join(" ")} fehlgeschlagen: ${message}`);
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
}

/** Liefert den lokalen Dateisystempfad von `remoteName`, falls es keine URL ist (sonst null). */
async function localPathOfRemote(cwd: string, remoteName: string): Promise<string | null> {
  const remoteUrl = await git(["remote", "get-url", remoteName], { cwd });
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(remoteUrl)) return null; // echtes URL-Schema (https://, ssh://, ...) - kein lokaler Pfad
  return path.isAbsolute(remoteUrl) ? remoteUrl : path.resolve(cwd, remoteUrl);
}

/** Zusätzliche Pfade, denen ein Aufruf vertrauen muss, der "origin" antastet. */
async function originTrustPaths(cwd: string): Promise<string[]> {
  const localPath = await localPathOfRemote(cwd, "origin");
  return localPath ? [localPath] : [];
}

/**
 * `git pull --rebase origin <branch>`, zentral an einer Stelle - damit der
 * safe.directory-Fix für ein lokales origin (Bind-Mount) garantiert überall
 * greift, wo gepullt wird, nicht nur beim Push. Genau das hat ein erster
 * Anlauf dieses Fixes übersehen: nur der Push-Aufruf hatte den Trust-Pfad,
 * der Pull direkt davor nicht - ein echter Testlauf mit abweichendem
 * Dateibesitzer hat das aufgedeckt (siehe git.test.ts).
 */
async function pullOrigin(cwd: string, branch: string): Promise<void> {
  const trust = await originTrustPaths(cwd);
  await git(["pull", "--rebase", "origin", branch], { cwd, trust });
}

/**
 * Ermittelt den aktuell ausgecheckten Branch. Bei detached HEAD (z. B. ein
 * flacher Checkout ohne expliziten Branch-Bezug) wird die Umgebungsvariable
 * WIKI_GIT_BRANCH als Fallback verlangt statt einen Branch zu erraten.
 */
export async function getCurrentBranch(cwd: string = repoRoot): Promise<string> {
  const branch = await git(["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  if (branch !== "HEAD") return branch;
  const fallback = process.env.WIKI_GIT_BRANCH?.trim();
  if (!fallback) {
    throw new GitWriteError(
      "HEAD ist detached und WIKI_GIT_BRANCH ist nicht gesetzt - Ziel-Branch kann nicht sicher bestimmt werden.",
    );
  }
  return fallback;
}

function parseGithubOwnerRepo(remoteUrl: string): { owner: string; repo: string } {
  const withoutCreds = remoteUrl.replace(/^https:\/\/[^@]*@/, "https://");
  const match = withoutCreds.match(/github\.com[/:]([^/]+)\/([^/]+?)(\.git)?\/?$/);
  if (!match) {
    throw new GitWriteError(`Remote-URL "${remoteUrl}" sieht nicht wie ein GitHub-Repo aus.`);
  }
  return { owner: match[1], repo: match[2] };
}

/**
 * Ziel für `git push`. Mit WIKI_GIT_TOKEN gesetzt: HTTPS-URL mit eingebettetem
 * Token (nicht auf Platte persistiert, kein `credential.helper store` wie
 * beim lokalen Subprozess). Ohne Token: schlicht "origin" - nutzt, was am
 * Rechner/Container bereits an Git-Credentials konfiguriert ist (praktisch für
 * lokales Testen von server/http.ts). `trustPaths` nennt zusätzliche lokale
 * Pfade, denen der nachfolgende Push-Aufruf vertrauen muss (z. B. ein
 * Bind-Mount als Push-Ziel) - siehe Kommentar bei `git()`.
 */
async function resolvePushTarget(cwd: string): Promise<{ target: string; trustPaths: string[] }> {
  const token = process.env.WIKI_GIT_TOKEN?.trim();
  if (!token) {
    return { target: "origin", trustPaths: await originTrustPaths(cwd) };
  }
  const remoteUrl = await git(["remote", "get-url", "origin"], { cwd });
  const { owner, repo } = parseGithubOwnerRepo(remoteUrl);
  return { target: `https://x-access-token:${token}@github.com/${owner}/${repo}.git`, trustPaths: [] };
}

/**
 * Pusht HEAD auf branch; bei Zurückweisung (jemand anderes hat zwischenzeitlich
 * gepusht) wird auf den neuen Stand rebast und erneut versucht - bis zu
 * MAX_PUSH_ATTEMPTS Mal. Eigenständig exportiert, damit der Retry-Pfad gezielt
 * gegen einen echten Konflikt getestet werden kann.
 */
export async function pushWithRetry(params: { cwd: string; branch: string }): Promise<void> {
  const { cwd, branch } = params;
  const { target: pushTarget, trustPaths } = await resolvePushTarget(cwd);
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
    try {
      await git(["push", pushTarget, `HEAD:${branch}`], { cwd, trust: trustPaths });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_PUSH_ATTEMPTS) break;
      await pullOrigin(cwd, branch);
    }
  }
  throw lastError instanceof Error ? lastError : new GitWriteError(String(lastError));
}

// Serialisiert alle Git-Operationen dieses Prozesses, damit zwei gleichzeitige
// schreibe_wiki_seite-Aufrufe nicht dieselbe lokale Arbeitskopie gleichzeitig
// verändern. Keine ausgefeilte Sperrlogik - eine einfache Warteschlange reicht,
// da hier höchstens ein paar Personen gleichzeitig schreiben.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export type GitAuthor = { name: string; email: string };

export type CommitAndPushResult = { pushed: boolean; branch: string };

/**
 * Fügt relPath zum Index hinzu, committet mit dem aufgelösten Klarnamen als
 * Autor (Committer bleibt der Bot) und pusht. Bei Push-Konflikt (jemand
 * anderes hat zwischenzeitlich gepusht): rebase auf den neuen Stand, erneut
 * pushen - bis zu MAX_PUSH_ATTEMPTS Versuche.
 */
export function commitAndPushWikiChange(params: {
  relPath: string;
  author: GitAuthor;
  message: string;
  cwd?: string;
}): Promise<CommitAndPushResult> {
  const cwd = params.cwd ?? repoRoot;
  return serialize(async () => {
    const branch = await getCurrentBranch(cwd);
    await pullOrigin(cwd, branch);

    const status = await git(["status", "--porcelain", "--", params.relPath], { cwd });
    if (status.trim().length === 0) {
      // Inhalt entspricht bereits dem letzten Commit (z. B. identisches Überschreiben) - nichts zu tun.
      return { pushed: false, branch };
    }

    await git(["add", "--", params.relPath], { cwd });
    await git(
      ["commit", "--author", `${params.author.name} <${params.author.email}>`, "-m", params.message],
      {
        cwd,
        env: {
          ...process.env,
          GIT_COMMITTER_NAME: process.env.WIKI_GIT_COMMITTER_NAME ?? DEFAULT_COMMITTER_NAME,
          GIT_COMMITTER_EMAIL: process.env.WIKI_GIT_COMMITTER_EMAIL ?? DEFAULT_COMMITTER_EMAIL,
        },
      },
    );

    await pushWithRetry({ cwd, branch });
    return { pushed: true, branch };
  });
}

/** Holt periodisch fremde Änderungen, damit Lesezugriffe nicht veralten. */
export function pullLatest(cwd: string = repoRoot): Promise<void> {
  return serialize(async () => {
    const branch = await getCurrentBranch(cwd);
    await pullOrigin(cwd, branch);
  });
}
