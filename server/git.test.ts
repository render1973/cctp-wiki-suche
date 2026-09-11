import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { commitAndPushWikiChange, pushWithRetry, getCurrentBranch, GitWriteError } from "./git.js";

// Diese Tests laufen ausschliesslich gegen lokale temporäre bare Repos - kein
// Netzwerk, kein echtes GitHub. Sie prüfen genau die Mechanik aus dem Briefing:
// Branch nie implizit annehmen, Push-Konflikt per Rebase+Retry auflösen,
// gleichzeitige Schreibvorgänge im selben Prozess sauber serialisieren.

function sh(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8" }).trim();
}

function initTestRepo(): { base: string; origin: string; cloneRepo: (name: string) => string } {
  const base = mkdtempSync(path.join(tmpdir(), "cctp-wiki-git-test-"));
  const origin = path.join(base, "origin.git");
  sh(base, ["init", "--bare", "--initial-branch=main", origin]);

  const seed = path.join(base, "seed");
  sh(base, ["clone", origin, seed]);
  sh(seed, ["config", "user.name", "Seed"]);
  sh(seed, ["config", "user.email", "seed@example.invalid"]);
  mkdirSync(path.join(seed, "wiki", "foerdergeber"), { recursive: true });
  writeFileSync(path.join(seed, "wiki", "foerdergeber", ".gitkeep"), "");
  sh(seed, ["add", "."]);
  sh(seed, ["commit", "-m", "Initial"]);
  sh(seed, ["push", origin, "HEAD:main"]);

  function cloneRepo(name: string): string {
    const dir = path.join(base, name);
    sh(base, ["clone", origin, dir]);
    sh(dir, ["config", "user.name", "Testautor"]);
    sh(dir, ["config", "user.email", "testautor@example.invalid"]);
    return dir;
  }

  return { base, origin, cloneRepo };
}

test("commitAndPushWikiChange: schreibt, committet mit aufgelöstem Autor und pusht nach origin", async () => {
  const { base, origin, cloneRepo } = initTestRepo();
  try {
    const cloneA = cloneRepo("cloneA");
    const relPath = "wiki/foerdergeber/test-happy-path.md";
    mkdirSync(path.dirname(path.join(cloneA, relPath)), { recursive: true });
    writeFileSync(path.join(cloneA, relPath), "# Testförderstelle\n\n- Status: entwurf\n- Autor: Person A\n");

    const result = await commitAndPushWikiChange({
      relPath,
      author: { name: "Person A", email: "a@example.invalid" },
      message: `Wiki: ${relPath} (Person A)`,
      cwd: cloneA,
    });

    assert.equal(result.pushed, true);
    assert.equal(result.branch, "main");

    const authorLine = sh(origin, ["log", "-1", "--format=%an <%ae>", "main"]);
    assert.equal(authorLine, "Person A <a@example.invalid>");

    const content = sh(origin, ["show", `main:${relPath}`]);
    assert.match(content, /Autor: Person A/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("commitAndPushWikiChange: identischer Inhalt beim Überschreiben erzeugt keinen leeren Commit", async () => {
  const { base, cloneRepo } = initTestRepo();
  try {
    const cloneA = cloneRepo("cloneA");
    const relPath = "wiki/foerdergeber/test-noop.md";
    mkdirSync(path.dirname(path.join(cloneA, relPath)), { recursive: true });
    writeFileSync(path.join(cloneA, relPath), "# Unverändert\n\n- Status: entwurf\n");

    const first = await commitAndPushWikiChange({
      relPath,
      author: { name: "Person A", email: "a@example.invalid" },
      message: "Wiki: erster Schreibvorgang",
      cwd: cloneA,
    });
    assert.equal(first.pushed, true);

    const second = await commitAndPushWikiChange({
      relPath,
      author: { name: "Person A", email: "a@example.invalid" },
      message: "Wiki: identischer Inhalt erneut",
      cwd: cloneA,
    });
    assert.equal(second.pushed, false, "kein neuer Commit bei unverändertem Inhalt erwartet");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("getCurrentBranch: wirft bei detached HEAD ohne WIKI_GIT_BRANCH-Fallback", async () => {
  const { base, cloneRepo } = initTestRepo();
  const previousFallback = process.env.WIKI_GIT_BRANCH;
  delete process.env.WIKI_GIT_BRANCH;
  try {
    const clone = cloneRepo("cloneDetached");
    sh(clone, ["checkout", "--detach", "HEAD"]);
    await assert.rejects(() => getCurrentBranch(clone), GitWriteError);

    process.env.WIKI_GIT_BRANCH = "main";
    const branch = await getCurrentBranch(clone);
    assert.equal(branch, "main", "Fallback aus WIKI_GIT_BRANCH muss greifen");
  } finally {
    if (previousFallback === undefined) delete process.env.WIKI_GIT_BRANCH;
    else process.env.WIKI_GIT_BRANCH = previousFallback;
    rmSync(base, { recursive: true, force: true });
  }
});

test("pushWithRetry: löst einen Push-Konflikt durch Rebase+Retry auf", async () => {
  const { base, origin, cloneRepo } = initTestRepo();
  try {
    // cloneC und cloneD starten vom selben origin-Stand.
    const cloneC = cloneRepo("cloneC");
    const cloneD = cloneRepo("cloneD");

    // cloneD pusht zuerst direkt (simuliert eine andere Person / einen anderen
    // Prozess, der zwischen cloneCs letztem Pull und Push geschrieben hat).
    writeFileSync(path.join(cloneD, "wiki", "foerdergeber", "von-d.md"), "# Von D\n\n- Status: entwurf\n");
    sh(cloneD, ["add", "."]);
    sh(cloneD, ["commit", "-m", "Von D"]);
    sh(cloneD, ["push", origin, "HEAD:main"]);

    // cloneC committet lokal auf Basis des alten (jetzt veralteten) origin-Stands.
    writeFileSync(path.join(cloneC, "wiki", "foerdergeber", "von-c.md"), "# Von C\n\n- Status: entwurf\n");
    sh(cloneC, ["add", "."]);
    sh(cloneC, ["commit", "-m", "Von C"]);

    // Ein naiver Push von cloneC würde jetzt zurückgewiesen (nicht Fast-Forward).
    await pushWithRetry({ cwd: cloneC, branch: "main" });

    const log = sh(origin, ["log", "--oneline", "main"]);
    assert.match(log, /Von C/);
    assert.match(log, /Von D/);
    assert.ok(sh(origin, ["show", "main:wiki/foerdergeber/von-c.md"]).length > 0);
    assert.ok(sh(origin, ["show", "main:wiki/foerdergeber/von-d.md"]).length > 0);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("commitAndPushWikiChange: zwei gleichzeitige Schreibvorgänge im selben Prozess werden serialisiert", async () => {
  const { base, origin, cloneRepo } = initTestRepo();
  try {
    const clone = cloneRepo("cloneParallel");
    const relPathA = "wiki/foerdergeber/parallel-a.md";
    const relPathB = "wiki/foerdergeber/parallel-b.md";
    mkdirSync(path.dirname(path.join(clone, relPathA)), { recursive: true });
    writeFileSync(path.join(clone, relPathA), "# Parallel A\n\n- Status: entwurf\n");
    writeFileSync(path.join(clone, relPathB), "# Parallel B\n\n- Status: entwurf\n");

    const [resultA, resultB] = await Promise.all([
      commitAndPushWikiChange({
        relPath: relPathA,
        author: { name: "Person A", email: "a@example.invalid" },
        message: "Wiki: parallel-a",
        cwd: clone,
      }),
      commitAndPushWikiChange({
        relPath: relPathB,
        author: { name: "Person B", email: "b@example.invalid" },
        message: "Wiki: parallel-b",
        cwd: clone,
      }),
    ]);

    assert.equal(resultA.pushed, true);
    assert.equal(resultB.pushed, true);

    const log = sh(origin, ["log", "--oneline", "main"]);
    assert.match(log, /parallel-a/);
    assert.match(log, /parallel-b/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
