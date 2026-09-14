// Lesender Git-Bootstrap für den zweiten Checkout im Container: den
// Obsidian-Vault (Repo `cctp-knowledge-lab-vault`). Analog zum bestehenden
// Bootstrap für das eigene Wiki-Repo (siehe git.ts), aber bewusst komplett
// unabhängig davon - zwei eigenständige Git-Historien im selben Container,
// kein Submodule-Trick. Dieses Modul committet und pusht NIE: nur
// `git clone --depth 1` beim ersten Zugriff und danach ein periodischer
// `git pull`.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

export class VaultGitError extends Error {}

const DEFAULT_VAULT_GIT_URL = "https://github.com/render1973/cctp-knowledge-lab-vault.git";

function resolveVaultGitUrl(): string {
  return process.env.CCTP_VAULT_GIT_URL?.trim() || DEFAULT_VAULT_GIT_URL;
}

function parseGithubOwnerRepo(url: string): { owner: string; repo: string } | null {
  const withoutCreds = url.replace(/^https:\/\/[^@]*@/, "https://");
  const match = withoutCreds.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?\/?$/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

/**
 * URL für `git clone`/den `origin`-Remote. Das Vault-Repo ist privat - ohne
 * Token schlägt der Klon in einem frischen Container (leeres Dateisystem,
 * kein bereits vorhandener Checkout) mit einem Authentifizierungsfehler fehl,
 * auch wenn ein älterer Container-Prozess mit bereits vorhandenem Checkout
 * weiterhin klaglos liest. Mit CCTP_VAULT_GIT_TOKEN gesetzt: analog zu
 * resolvePushTarget in git.ts wird das Token in die HTTPS-URL eingesetzt
 * (nicht auf Platte persistiert über einen credential.helper - landet aber,
 * anders als beim Push dort, als Teil der `origin`-Remote-URL in der
 * .git/config dieses Checkouts, weil `git clone` die übergebene URL als
 * Remote speichert; das bleibt aber lokal im - ohnehin flüchtigen -
 * Container, es wird nie gepusht oder sonst wie weitergereicht). Ohne Token:
 * unverändert die Basis-URL, nutzt was am Rechner/Container bereits an
 * Git-Credentials konfiguriert ist (praktisch fürs lokale Testen) oder
 * funktioniert, falls das Repo doch öffentlich ist/wird.
 */
export function resolveVaultCloneUrl(): string {
  const baseUrl = resolveVaultGitUrl();
  const token = process.env.CCTP_VAULT_GIT_TOKEN?.trim();
  if (!token) return baseUrl;
  const parsed = parseGithubOwnerRepo(baseUrl);
  if (!parsed) return baseUrl; // z. B. lokaler Pfad in Tests - kein GitHub-HTTPS-Ziel, Token passt nicht
  return `https://x-access-token:${token}@github.com/${parsed.owner}/${parsed.repo}.git`;
}

/** Ersetzt ein eingesetztes CCTP_VAULT_GIT_TOKEN in Fehlermeldungen durch "***", damit es nie in einer Tool-Antwort landet. */
function maskToken(message: string): string {
  const token = process.env.CCTP_VAULT_GIT_TOKEN?.trim();
  return token ? message.split(token).join("***") : message;
}

/**
 * Einmal beim Serverstart ins Log schreiben, ob CCTP_VAULT_GIT_TOKEN in
 * diesem laufenden Prozess überhaupt gesetzt ist - nie der Wert selbst, nur
 * ja/nein plus Länge. Grund: der Fehler "could not read Username for
 * 'https://github.com'" beim Klonen sieht nach einem Code-Bug aus, ist aber
 * meist schlicht ein fehlendes Token in genau DIESER Umgebung (z. B. weil
 * mehrere Railway-Services/-Deployments existieren und nicht überall
 * dieselben Variablen gesetzt sind). Diese Zeile macht das ohne einen
 * gezielten Testaufruf direkt im Railway-Log sichtbar.
 */
export function logVaultTokenStatus(): void {
  const token = process.env.CCTP_VAULT_GIT_TOKEN?.trim();
  const url = resolveVaultGitUrl();
  if (token) {
    console.log(`CCTP_VAULT_GIT_TOKEN gesetzt (${token.length} Zeichen), Vault-URL: ${url}`);
  } else {
    console.log(`CCTP_VAULT_GIT_TOKEN NICHT gesetzt, Vault-URL: ${url}`);
  }
}

// Gleicher "dubious ownership"-Fallstrick wie beim Wiki-Repo (siehe
// ausführlicher Kommentar in git.ts) kann grundsätzlich auch hier auftreten,
// falls der Vault-Checkout-Pfad je auf einen Bind-Mount zeigt - deshalb
// derselbe Schutz per temporärer GIT_CONFIG_GLOBAL statt globaler Gitconfig.
async function git(args: string[], cwd: string): Promise<string> {
  const configDir = mkdtempSync(path.join(tmpdir(), "cctp-vault-gitcfg-"));
  const configFile = path.join(configDir, "config");
  // git-config-Werte behandeln "\" als Escape-Zeichen - ein roher Windows-Pfad
  // (z. B. "C:\Users\...") sprengt damit die Datei ("bad config line"). Slashes
  // sind für Pfade auf Windows-Git ebenso gültig und escapen sich selbst nicht.
  const safeDir = cwd.replace(/\\/g, "/");
  // `GIT_CONFIG_GLOBAL` ersetzt die komplette globale Gitconfig für diesen
  // Aufruf, nicht nur das [safe]-Sektion - eine ggf. vom Nutzer gesetzte
  // globale core.autocrlf-Einstellung wird damit unsichtbar, und eine
  // systemweite Windows-Git-Installation setzt oft core.autocrlf=true auf
  // Systemebene. Ohne expliziten Override würde ein Checkout hier je nach
  // Maschine unterschiedliche Zeilenenden liefern (CRLF statt der im Vault
  // gespeicherten LF) - das zerlegt search-core.ts' Absatz-Erkennung
  // (`\n{2,}`) und macht Treffer im Textkörper unauffindbar. Deshalb hier
  // deterministisch auf "false" festgenagelt, unabhängig vom Wirtssystem.
  writeFileSync(configFile, `[safe]\n\tdirectory = ${safeDir}\n[core]\n\tautocrlf = false\n`, "utf-8");
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      env: { ...process.env, GIT_CONFIG_GLOBAL: configFile },
    });
    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    const message = stderr.trim() || (error as Error).message;
    throw new VaultGitError(maskToken(`git ${args.join(" ")} fehlgeschlagen: ${message}`));
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
}

// Nach vaultRoot statt global, da server/vault-git.test.ts mehrere
// Vault-Wurzeln im selben Prozess durchspielt - im laufenden Server gibt es
// ohnehin immer nur eine (CCTP_VAULT_PATH ändert sich nicht zur Laufzeit).
const bootstrapByRoot = new Map<string, Promise<void>>();

/**
 * Klont den Vault beim ersten Zugriff nach `vaultRoot`, falls dort noch kein
 * Checkout liegt. Ein Fehlschlag wird nicht gecacht, damit ein späterer
 * Aufruf (z. B. nach kurzzeitigem Netzwerkproblem) es erneut versuchen kann -
 * genau wie beim bestehenden Wiki-Bootstrap in git.ts.
 */
export function ensureVaultCloned(vaultRoot: string): Promise<void> {
  if (existsSync(path.join(vaultRoot, ".git"))) return Promise.resolve();
  let inFlight = bootstrapByRoot.get(vaultRoot);
  if (!inFlight) {
    inFlight = cloneVault(vaultRoot).catch((error) => {
      bootstrapByRoot.delete(vaultRoot);
      throw error;
    });
    bootstrapByRoot.set(vaultRoot, inFlight);
  }
  return inFlight;
}

async function cloneVault(vaultRoot: string): Promise<void> {
  const parent = path.dirname(vaultRoot);
  mkdirSync(parent, { recursive: true });
  try {
    await git(["clone", "--depth", "1", resolveVaultCloneUrl(), vaultRoot], parent);
  } catch (error) {
    // Ein abgebrochener/fehlgeschlagener Klon kann einen halb-fertigen
    // `.git`-Ordner hinterlassen. ensureVaultCloned prüft nur "existiert
    // .git" - ohne diesen Aufräumschritt würde jeder weitere Aufruf den
    // kaputten Zustand für "schon geklont" halten und nie neu versuchen.
    // Deshalb hier den Zielordner komplett entfernen, damit der nächste
    // Aufruf garantiert wieder bei null anfängt.
    rmSync(vaultRoot, { recursive: true, force: true });
    throw error;
  }
}

let pullQueue: Promise<unknown> = Promise.resolve();

/**
 * Holt periodisch fremde Änderungen für den Vault-Checkout - nie push. Läuft
 * still ins Leere, solange noch nichts geklont wurde (z. B. vor dem ersten
 * such_cctp_vault-Aufruf); serialisiert wie pullLatest in git.ts, damit sich
 * ein Hintergrund-Pull nicht mit einem gerade laufenden Erst-Klon beisst.
 */
export function pullVaultLatest(vaultRoot: string): Promise<void> {
  const task = async () => {
    if (!existsSync(path.join(vaultRoot, ".git"))) return;
    await git(["pull", "--ff-only", "origin"], vaultRoot);
  };
  const result = pullQueue.then(task, task);
  pullQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
