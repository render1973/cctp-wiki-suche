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
    throw new VaultGitError(`git ${args.join(" ")} fehlgeschlagen: ${message}`);
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
  await git(["clone", "--depth", "1", resolveVaultGitUrl(), vaultRoot], parent);
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
