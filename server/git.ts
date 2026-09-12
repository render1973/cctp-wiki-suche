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
import { existsSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./corpus.js";

const execFileAsync = promisify(execFile);

const DEFAULT_COMMITTER_NAME = "CCTP Wiki Bot";
const DEFAULT_COMMITTER_EMAIL = "wiki-bot@cctp-wiki-suche.noreply";
const MAX_PUSH_ATTEMPTS = 3;

export class GitWriteError extends Error {}

async function git(args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: options.cwd ?? repoRoot,
      env: options.env ?? process.env,
    });
    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    const message = stderr.trim() || (error as Error).message;
    throw new GitWriteError(`git ${args.join(" ")} fehlgeschlagen: ${message}`);
  }
}

/**
 * Railways Docker-Build liefert kein `.git` in den Build-Context: Railway
 * baut aus einem selbst erzeugten Quell-Archiv, nicht aus einem echten
 * `git clone` - das Dockerfile hier (`COPY . .`) geht implizit vom letzteren
 * aus. Ergebnis: `git`-Aufrufe im Container schlagen mit "not a git
 * repository" fehl, obwohl Docker lokal (echter `docker build` aus einem
 * Git-Klon) einwandfrei funktioniert.
 *
 * Fallback: fehlt `.git` beim ersten Zugriff, wird das Repo hier neu
 * initialisiert und von `origin` auf den Ziel-Branch gebracht. Remote/Branch
 * kommen aus Railways automatisch gesetzten `RAILWAY_GIT_*`-Variablen
 * (https://docs.railway.com/reference/variables#railway-provided-variables),
 * überschreibbar via `WIKI_GIT_REMOTE_URL`/`WIKI_GIT_BRANCH` für andere
 * Hosting-Umgebungen. Nur einmal pro Prozess nötig; ein Fehlschlag wird nicht
 * gecacht, damit ein späterer Aufruf (z. B. nach kurzzeitigem DNS-Problem)
 * es erneut versuchen kann.
 */
let repoBootstrap: Promise<void> | null = null;
function ensureRepoBootstrapped(cwd: string): Promise<void> {
  if (existsSync(path.join(cwd, ".git"))) return Promise.resolve();
  if (!repoBootstrap) {
    repoBootstrap = bootstrapRepo(cwd).catch((error) => {
      repoBootstrap = null;
      throw error;
    });
  }
  return repoBootstrap;
}

async function bootstrapRepo(cwd: string): Promise<void> {
  const remoteUrl = resolveBootstrapRemoteUrl();
  const branch = resolveBootstrapBranch();
  await git(["init"], { cwd });
  await git(["remote", "add", "origin", remoteUrl], { cwd });
  await git(["fetch", "--depth", "1", "origin", branch], { cwd });
  await git(["checkout", "--force", "-B", branch, "FETCH_HEAD"], { cwd });
}

function resolveBootstrapRemoteUrl(): string {
  const explicit = process.env.WIKI_GIT_REMOTE_URL?.trim();
  if (explicit) return explicit;
  const owner = process.env.RAILWAY_GIT_REPO_OWNER?.trim();
  const repo = process.env.RAILWAY_GIT_REPO_NAME?.trim();
  if (owner && repo) return `https://github.com/${owner}/${repo}.git`;
  throw new GitWriteError(
    "Kein .git im Container gefunden und keine Remote-URL bestimmbar - WIKI_GIT_REMOTE_URL setzen " +
      "oder sicherstellen, dass Railway RAILWAY_GIT_REPO_OWNER/RAILWAY_GIT_REPO_NAME liefert.",
  );
}

function resolveBootstrapBranch(): string {
  const explicit = process.env.WIKI_GIT_BRANCH?.trim();
  if (explicit) return explicit;
  const railway = process.env.RAILWAY_GIT_BRANCH?.trim();
  if (railway) return railway;
  throw new GitWriteError(
    "Kein .git im Container gefunden und kein Ziel-Branch bestimmbar - WIKI_GIT_BRANCH setzen " +
      "oder sicherstellen, dass Railway RAILWAY_GIT_BRANCH liefert.",
  );
}

/**
 * Ermittelt den aktuell ausgecheckten Branch. Bei detached HEAD (z. B. ein
 * flacher Checkout ohne expliziten Branch-Bezug) wird die Umgebungsvariable
 * WIKI_GIT_BRANCH als Fallback verlangt statt einen Branch zu erraten.
 */
export async function getCurrentBranch(cwd: string = repoRoot): Promise<string> {
  await ensureRepoBootstrapped(cwd);
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
 * lokales Testen von server/http.ts).
 */
async function resolvePushTarget(cwd: string): Promise<string> {
  const token = process.env.WIKI_GIT_TOKEN?.trim();
  if (!token) return "origin";
  const remoteUrl = await git(["remote", "get-url", "origin"], { cwd });
  const { owner, repo } = parseGithubOwnerRepo(remoteUrl);
  return `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
}

/**
 * Pusht HEAD auf branch; bei Zurückweisung (jemand anderes hat zwischenzeitlich
 * gepusht) wird auf den neuen Stand rebast und erneut versucht - bis zu
 * MAX_PUSH_ATTEMPTS Mal. Eigenständig exportiert, damit der Retry-Pfad gezielt
 * gegen einen echten Konflikt getestet werden kann.
 */
export async function pushWithRetry(params: { cwd: string; branch: string }): Promise<void> {
  const { cwd, branch } = params;
  const pushTarget = await resolvePushTarget(cwd);
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
    try {
      await git(["push", pushTarget, `HEAD:${branch}`], { cwd });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_PUSH_ATTEMPTS) break;
      await git(["pull", "--rebase", "origin", branch], { cwd });
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
    await git(["pull", "--rebase", "origin", branch], { cwd });

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
    await git(["pull", "--rebase", "origin", branch], { cwd });
  });
}
