import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { searchWiki, listWikiPages } from "./search.js";
import { schreibeWikiSeite } from "./write-wiki.js";
import { PAGES } from "./corpus.js";

const execFileAsync = promisify(execFile);

// Leeres Temp-Verzeichnis ohne wiki/-Ordner: alleSeiten() liefert dann nur
// die fünf festen Seiten aus corpus.ts, unabhängig davon, was gerade im
// echten Repo unter wiki/ liegt (das wächst mit jeder schreibe_wiki_seite-
// Nutzung und darf die folgenden Tests nicht mehr deterministisch machen).
async function leererRepoRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "wiki-search-test-"));
}

async function tempGitRepo(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-search-write-test-"));
  await execFileAsync("git", ["-C", dir, "init", "--quiet"]);
  await execFileAsync("git", ["-C", dir, "config", "user.name", "Test Autor"]);
  await execFileAsync("git", ["-C", dir, "config", "user.email", "test@example.invalid"]);
  return dir;
}

test("such_cctp_wiki: Treffer liefert Titel, Status, Pfad und Textausschnitt", async () => {
  const hits = await searchWiki("Roharchiv Wiki Governance", 3, { repoRoot: await leererRepoRoot() });
  assert.ok(hits.length > 0, "erwartet mindestens einen Treffer");
  const hit = hits[0];
  assert.equal(typeof hit.titel, "string");
  assert.equal(typeof hit.status, "string");
  assert.equal(typeof hit.rohquellePfad, "string");
  assert.ok(hit.rohquellePfad.length > 0);
  assert.match(
    hit.rohquellePfad,
    /^00-roharchiv\//,
    "Rohquelle-Pfad muss auf die Originalquelle im Roharchiv zeigen, nicht auf die Wiki-Seite",
  );
  assert.ok(hit.textauszug.length > 0);
});

test("such_cctp_wiki: kein Treffer bei bestandsfremdem Begriff", async () => {
  const hits = await searchWiki("xyzzyzzyzzy-quantumfrobnicator-nichtimbestand", 3, {
    repoRoot: await leererRepoRoot(),
  });
  assert.equal(hits.length, 0);
});

test("liste_cctp_wiki_seiten: gibt alle fünf freigegebenen Seiten zurück (ohne wiki/-Entwürfe)", async () => {
  const list = await listWikiPages({ repoRoot: await leererRepoRoot() });
  assert.equal(list.length, 5);
  assert.equal(list.length, PAGES.length);
  for (const item of list) {
    assert.equal(item.status, "freigegeben");
    assert.match(item.datei, /^server\/wiki\/[a-z]+\.md$/);
    assert.ok(item.titel.length > 0);
  }
});

test("schreibe_wiki_seite + such_cctp_wiki: neu angelegte Seite ist sofort auffindbar", async () => {
  const repoRoot = await tempGitRepo();

  const geschrieben = await schreibeWikiSeite(
    {
      bereich: "forschung",
      titel: "Integrationstest Quantenradieschen",
      inhalt: "Das Quantenradieschen ist ein Testbegriff, der sonst nirgends im Bestand vorkommt.",
      autor: "Integrationstest",
    },
    { repoRoot },
  );
  assert.equal(geschrieben.aktion, "erstellt");

  const treffer = await searchWiki("Quantenradieschen", 5, { repoRoot });
  assert.equal(treffer.length, 1, "die neue Seite muss genau einmal gefunden werden");
  assert.equal(treffer[0].titel, "Integrationstest Quantenradieschen");
  assert.equal(treffer[0].status, "entwurf", "wiki/-Seiten müssen als 'entwurf' erkennbar bleiben");
  assert.equal(
    treffer[0].rohquellePfad,
    geschrieben.pfad,
    "ohne separate Roharchiv-Quelle ist die Datei selbst die Belegstelle",
  );
  assert.match(treffer[0].textauszug, /Quantenradieschen/);

  const liste = await listWikiPages({ repoRoot });
  assert.equal(liste.length, 6, "fünf feste Seiten plus die eine neue");
  const neuerEintrag = liste.find((item) => item.titel === "Integrationstest Quantenradieschen");
  assert.ok(neuerEintrag, "neue Seite muss auch in liste_cctp_wiki_seiten auftauchen");
  assert.equal(neuerEintrag?.status, "entwurf");
  assert.equal(neuerEintrag?.datei, geschrieben.pfad);

  // Die fünf ursprünglichen Seiten müssen weiterhin "freigegeben" bleiben —
  // der neue Entwurf darf ihren Status nicht verfärben.
  const freigegeben = liste.filter((item) => item.status === "freigegeben");
  assert.equal(freigegeben.length, 5);
});
