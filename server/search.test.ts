import { test } from "node:test";
import assert from "node:assert/strict";
import { searchWiki, listWikiPages } from "./search.js";
import { PAGES } from "./corpus.js";

test("such_cctp_wiki: Treffer liefert Titel, Status, Pfad und Textausschnitt", () => {
  const hits = searchWiki("Roharchiv Wiki Governance");
  assert.ok(hits.length > 0, "erwartet mindestens einen Treffer");
  const hit = hits[0];
  assert.equal(typeof hit.titel, "string");
  assert.equal(typeof hit.status, "string");
  assert.equal(typeof hit.rohquellePfad, "string");
  assert.ok(hit.rohquellePfad.length > 0);
  assert.ok(hit.textauszug.length > 0);
});

test("such_cctp_wiki: kein Treffer bei bestandsfremdem Begriff", () => {
  const hits = searchWiki("xyzzyzzyzzy-quantumfrobnicator-nichtimbestand");
  assert.equal(hits.length, 0);
});

test("liste_cctp_wiki_seiten: gibt alle fünf freigegebenen Seiten zurück", () => {
  const list = listWikiPages();
  assert.equal(list.length, 5);
  assert.equal(list.length, PAGES.length);
  for (const item of list) {
    assert.equal(item.status, "freigegeben");
    assert.match(item.datei, /^server\/wiki\/[a-z]+\.md$/);
    assert.ok(item.titel.length > 0);
  }
});
