import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, readFileSync } from "node:fs";
import path from "node:path";
import { searchWiki, listWikiPages } from "./search.js";
import { getPages, BEREICHE } from "./corpus.js";
import { schreibeWikiSeite } from "./write.js";

test("such_cctp_wiki: Treffer liefert Titel, Bereich, Status, Pfad und Textausschnitt", () => {
  const hits = searchWiki("Roharchiv Wiki Governance");
  assert.ok(hits.length > 0, "erwartet mindestens einen Treffer");
  const hit = hits[0];
  assert.equal(typeof hit.titel, "string");
  assert.equal(typeof hit.bereich, "string");
  assert.equal(typeof hit.status, "string");
  assert.equal(typeof hit.rohquellePfad, "string");
  assert.ok(hit.rohquellePfad.startsWith("wiki/"));
  assert.ok(hit.textauszug.length > 0);
});

test("such_cctp_wiki: Treffer mit `- Quelle:`-Zeile liefert die Quell-URL im eigenen Feld", () => {
  const hits = searchWiki("Bilhöfer Wissensmanagement KI Planungsbüro");
  assert.ok(hits.length > 0, "erwartet mindestens einen Treffer");
  const hit = hits.find((h) => h.rohquellePfad.includes("forschungsstand-bilhoefer"));
  assert.ok(hit, "erwartet den Bilhöfer-Treffer");
  assert.equal(hit?.quelle, "https://timo.bilhoefer.de (Abschnitt „Aktuelles\", abgerufen am 07.08.2026)");
});

test("such_cctp_wiki: kein Treffer bei bestandsfremdem Begriff", () => {
  const hits = searchWiki("xyzzyzzyzzy-quantumfrobnicator-nichtimbestand");
  assert.equal(hits.length, 0);
});

test("liste_cctp_wiki_seiten: gibt alle fünf bestehenden Seiten aus den sieben Bereichen zurück", () => {
  const list = listWikiPages();
  assert.equal(list.length, 5);
  assert.equal(list.length, getPages().length);
  for (const item of list) {
    assert.equal(item.status, "freigegeben");
    assert.ok(BEREICHE.includes(item.bereich as (typeof BEREICHE)[number]));
    assert.match(item.datei, /^wiki\/[a-z]+\/[a-z0-9-]+\.md$/);
    assert.ok(item.titel.length > 0);
  }
});

test("liste_cctp_wiki_seiten: Filter auf einen Bereich", () => {
  const list = listWikiPages("lehre");
  assert.equal(list.length, 1);
  assert.equal(list[0].bereich, "lehre");
});

test("schreibe_wiki_seite: lehnt unbekannten Bereich ab", () => {
  const result = schreibeWikiSeite({
    bereich: "unbekannt",
    dateiname: "test-seite",
    inhalt: "# Test\n\n- Status: entwurf\n",
  });
  assert.equal(result.ok, false);
});

test("schreibe_wiki_seite: lehnt Status 'freigegeben' ab (nur Thomas Heim vergibt ihn)", () => {
  const result = schreibeWikiSeite({
    bereich: "foerdergeber",
    dateiname: "test-sperrstatus",
    inhalt: "# Test\n\n- Status: freigegeben\n",
  });
  assert.equal(result.ok, false);
});

test("schreibe_wiki_seite -> such_cctp_wiki: neue Seite ist direkt nach dem Schreiben auffindbar", () => {
  const marker = `Testmarkerbegriff${Date.now()}`;
  const result = schreibeWikiSeite({
    bereich: "foerdergeber",
    dateiname: `test-roundtrip-${Date.now()}`,
    inhalt: `# Testförderstelle ${marker}\n\n- Status: entwurf\n\nDieser Absatz enthält den Suchbegriff ${marker} zur Verifikation des Rundlaufs von Schreiben zu Suche.\n`,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  try {
    const hits = searchWiki(marker);
    assert.ok(hits.length > 0, "neu geschriebene Seite muss auffindbar sein");
    assert.ok(hits.some((hit) => hit.rohquellePfad === result.pfad));
  } finally {
    rmSync(path.join(process.cwd(), result.pfad), { force: true });
  }
});

test("schreibe_wiki_seite: ohne autor-Parameter (stdio-Fall) bleibt Inhalt unverändert, keine Autor-Zeile", () => {
  const result = schreibeWikiSeite({
    bereich: "foerdergeber",
    dateiname: `test-ohne-autor-${Date.now()}`,
    inhalt: "# Test ohne Autor\n\n- Status: entwurf\n\nInhalt.\n",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  try {
    const geschrieben = readFileSync(path.join(process.cwd(), result.pfad), "utf-8");
    assert.doesNotMatch(geschrieben, /^-\s*Autor:/im);
  } finally {
    rmSync(path.join(process.cwd(), result.pfad), { force: true });
  }
});

test("schreibe_wiki_seite: mit autor-Parameter (HTTP-Fall) wird der aufgelöste Klarname als Autor eingesetzt", () => {
  const result = schreibeWikiSeite({
    bereich: "foerdergeber",
    dateiname: `test-mit-autor-${Date.now()}`,
    inhalt: "# Test mit Autor\n\n- Status: entwurf\n\nInhalt.\n",
    autor: { name: "Kollegin Beispiel", email: "kollegin@example.invalid" },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  try {
    const geschrieben = readFileSync(path.join(process.cwd(), result.pfad), "utf-8");
    assert.match(geschrieben, /^-\s*Autor:\s*Kollegin Beispiel$/im);
  } finally {
    rmSync(path.join(process.cwd(), result.pfad), { force: true });
  }
});

test("schreibe_wiki_seite: eine vom Client mitgelieferte Autor-Zeile wird verworfen und durch das Token-Mapping ersetzt", () => {
  const result = schreibeWikiSeite({
    bereich: "foerdergeber",
    dateiname: `test-autor-override-${Date.now()}`,
    inhalt: "# Test Autor-Override\n\n- Status: entwurf\n- Autor: Behauptete Fremdperson\n\nInhalt.\n",
    autor: { name: "Echte Person", email: "echt@example.invalid" },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  try {
    const geschrieben = readFileSync(path.join(process.cwd(), result.pfad), "utf-8");
    assert.doesNotMatch(geschrieben, /Behauptete Fremdperson/);
    assert.match(geschrieben, /^-\s*Autor:\s*Echte Person$/im);
    assert.equal(geschrieben.match(/^-\s*Autor:/gim)?.length, 1, "genau eine Autor-Zeile erwartet");
  } finally {
    rmSync(path.join(process.cwd(), result.pfad), { force: true });
  }
});
