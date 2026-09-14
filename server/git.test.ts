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

test("commitAndPushWikiChange: funktioniert trotz abweichendem Dateibesitzer am Push-Ziel (dubious ownership)", async (t) => {
  // Reproduziert genau den von Thomas unter Docker Desktop/WSL2 gemeldeten
  // Fehler: ein per Bind-Mount eingehängtes Push-Ziel gehört aus
  // Containersicht einem anderen Nutzer als dem Server-Prozess. git
  // verweigert dann standardmässig jede Operation darauf ("dubious
  // ownership") - dieser Test chownt das bare Repo bewusst auf einen fremden
  // Nutzer, um genau das zu erzwingen, und prüft, dass server/git.ts trotzdem
  // erfolgreich committet und pusht (per `-c safe.directory=...` pro Aufruf,
  // ohne die globale Gitconfig zu verändern).
  if (typeof process.getuid !== "function" || process.getuid() !== 0) {
    t.skip("Braucht Root-Rechte für chown auf einen fremden Nutzer.");
    return;
  }
  const { base, origin, cloneRepo } = initTestRepo();
  try {
    // Erst klonen (wie die im Image gebackene Arbeitskopie beim Docker-Build),
    // dann erst den Dateibesitzer am Ziel-Repo ändern (wie ein Bind-Mount mit
    // abweichender Ownership zur Laufzeit) - sonst würde schon der Test-Setup-
    // Clone selbst an derselben Prüfung scheitern, nicht die zu testende Logik.
    const cloneA = cloneRepo("cloneA");
    execFileSync("chown", ["-R", "65534:65534", origin]);

    const relPath = "wiki/foerdergeber/test-dubious-ownership.md";
    mkdirSync(path.dirname(path.join(cloneA, relPath)), { recursive: true });
    writeFileSync(path.join(cloneA, relPath), "# Test Dubious Ownership\n\n- Status: entwurf\n");

    const result = await commitAndPushWikiChange({
      relPath,
      author: { name: "Person A", email: "a@example.invalid" },
      message: "Wiki: dubious-ownership-Testfall",
      cwd: cloneA,
    });
    assert.equal(result.pushed, true, "Push muss trotz fremdem Dateibesitzer am Ziel gelingen");

    // Für die Verifikation per Plain-git zurück auf root chownen, damit die
    // Lesebefehle unten nicht selbst an derselben Prüfung scheitern.
    execFileSync("chown", ["-R", "0:0", origin]);
    const authorLine = sh(origin, ["log", "-1", "--format=%an <%ae>", "main"]);
    assert.equal(authorLine, "Person A <a@example.invalid>");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("commitAndPushWikiChange: überschreibt eine bestehende Seite trotz divergiertem origin (dirty tracked file blockiert Pull nicht)", async () => {
  // Reproduziert den vom Nutzer gemeldeten Fall: schreibe_wiki_seite schreibt
  // die überschriebene Seite VOR dem Commit/Push auf die Platte - das ist zum
  // Zeitpunkt von commitAndPushWikiChange bereits eine dirty getrackte Datei.
  // Hat origin zwischenzeitlich einen anderen Commit bekommen, verweigert
  // `git pull --rebase` sich dann grundsätzlich mit dirtiger Arbeitskopie.
  const { base, origin, cloneRepo } = initTestRepo();
  try {
    const cloneA = cloneRepo("cloneA");
    const relPath = "wiki/foerdergeber/bestehende-seite.md";
    mkdirSync(path.dirname(path.join(cloneA, relPath)), { recursive: true });
    writeFileSync(path.join(cloneA, relPath), "# Bestehende Seite\n\n- Status: entwurf\n- Autor: Person A\n");
    sh(cloneA, ["add", "."]);
    sh(cloneA, ["commit", "-m", "Erste Fassung"]);
    sh(cloneA, ["push", origin, "HEAD:main"]);

    // Andere Person pusht währenddessen eine unabhängige Änderung auf origin.
    const cloneOther = cloneRepo("cloneOther");
    writeFileSync(path.join(cloneOther, "wiki", "foerdergeber", "von-anderer-person.md"), "# Von anderer Person\n\n- Status: entwurf\n");
    sh(cloneOther, ["add", "."]);
    sh(cloneOther, ["commit", "-m", "Von anderer Person"]);
    sh(cloneOther, ["push", origin, "HEAD:main"]);

    // schreibe_wiki_seite überschreibt die bestehende, getrackte Datei lokal -
    // cloneA hat den fremden Commit oben noch nicht gesehen.
    writeFileSync(path.join(cloneA, relPath), "# Bestehende Seite\n\n- Status: entwurf\n- Autor: Person A\n\nÜberarbeitet.\n");

    const result = await commitAndPushWikiChange({
      relPath,
      author: { name: "Person A", email: "a@example.invalid" },
      message: `Wiki: ${relPath} (Person A)`,
      cwd: cloneA,
    });

    assert.equal(result.pushed, true);
    const log = sh(origin, ["log", "--oneline", "main"]);
    assert.match(log, /Von anderer Person/);
    assert.match(log, new RegExp(relPath.split("/").pop()!.replace(".md", "")));
    const content = sh(origin, ["show", `main:${relPath}`]);
    assert.match(content, /Überarbeitet\./);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("commitAndPushWikiChange: bricht ab statt zu stashen, wenn fremde uncommittete Änderungen in der Arbeitskopie liegen", async () => {
  const { base, cloneRepo } = initTestRepo();
  try {
    const cloneA = cloneRepo("cloneA");
    const relPath = "wiki/foerdergeber/test-happy-path.md";
    mkdirSync(path.dirname(path.join(cloneA, relPath)), { recursive: true });
    writeFileSync(path.join(cloneA, relPath), "# Test\n\n- Status: entwurf\n");

    // Fremde, unerwartete uncommittete Datei - z. B. Rest eines vorherigen
    // abgebrochenen Laufs. Darf nicht stillschweigend mitgestasht werden.
    writeFileSync(path.join(cloneA, "wiki", "foerdergeber", "fremder-rest.md"), "# Fremder Rest\n");

    await assert.rejects(
      () =>
        commitAndPushWikiChange({
          relPath,
          author: { name: "Person A", email: "a@example.invalid" },
          message: "Wiki: test",
          cwd: cloneA,
        }),
      GitWriteError,
    );

    const status = sh(cloneA, ["status", "--porcelain"]);
    assert.match(status, /fremder-rest\.md/, "fremde Änderung darf nicht verschwunden (gestasht) sein");
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
