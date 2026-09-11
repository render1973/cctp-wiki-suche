import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { schreibeWikiSeite } from "./write-wiki.js";

const execFileAsync = promisify(execFile);

// Jeder Test bekommt ein frisches, lokales Git-Repo in einem Temp-Verzeichnis.
// So committet/pusht schreibe_wiki_seite tatsächlich (wie im Betrieb), aber
// nie gegen das echte cctp-wiki-suche-Repo oder einen echten Remote.
async function tempRepo(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-write-test-"));
  await execFileAsync("git", ["-C", dir, "init", "--quiet"]);
  await execFileAsync("git", ["-C", dir, "config", "user.name", "Test Autor"]);
  await execFileAsync("git", ["-C", dir, "config", "user.email", "test@example.invalid"]);
  return dir;
}

test("schreibe_wiki_seite: legt neue Seite mit Status 'entwurf' an und committet sie", async () => {
  const repoRoot = await tempRepo();
  const result = await schreibeWikiSeite({
    bereich: "forschung",
    titel: "Testseite Eins",
    inhalt: "Erste Erkenntnis zu Testseite Eins.",
    autor: "Thomas Heim",
  }, { repoRoot });

  assert.equal(result.aktion, "erstellt");
  assert.equal(result.pfad, "wiki/forschung/testseite-eins.md");
  assert.ok(result.git.committed, "sollte lokal committet sein");

  const inhalt = await fs.readFile(path.join(repoRoot, result.pfad), "utf-8");
  assert.match(inhalt, /^# Testseite Eins/);
  assert.match(inhalt, /- Status: entwurf/);
  assert.match(inhalt, /- Autor:in: Thomas Heim/);
  assert.doesNotMatch(inhalt, /geprueft|freigegeben/);

  const log = await execFileAsync("git", ["-C", repoRoot, "log", "--oneline"]);
  assert.match(log.stdout, /neue Seite "Testseite Eins"/);
});

test("schreibe_wiki_seite: leitet Autor aus Git-Kontext ab, wenn nicht angegeben", async () => {
  const repoRoot = await tempRepo();
  const result = await schreibeWikiSeite({
    bereich: "forschung",
    titel: "Testseite Autor",
    inhalt: "Inhalt ohne expliziten Autor.",
  }, { repoRoot });

  const inhalt = await fs.readFile(path.join(repoRoot, result.pfad), "utf-8");
  assert.match(inhalt, /- Autor:in: Test Autor/);
});

test("schreibe_wiki_seite: ergänzt bestehende Seite bei Titel-Treffer, statt zu überschreiben", async () => {
  const repoRoot = await tempRepo();
  const erst = await schreibeWikiSeite({
    bereich: "forschung",
    titel: "Testseite Zwei",
    inhalt: "Ursprünglicher Befund: A ist der Fall.",
    autor: "Thomas Heim",
  }, { repoRoot });

  const update = await schreibeWikiSeite({
    bereich: "forschung",
    titel: "Testseite Zwei",
    inhalt: "Neuer Befund: A gilt nicht mehr, stattdessen B.",
    autor: "Thomas Heim",
  }, { repoRoot });

  assert.equal(update.aktion, "ergaenzt");
  assert.equal(update.pfad, erst.pfad, "muss dieselbe Datei treffen, nicht neu anlegen");

  const inhalt = await fs.readFile(path.join(repoRoot, update.pfad), "utf-8");
  assert.match(inhalt, /Ursprünglicher Befund: A ist der Fall\./, "alter Inhalt darf nicht verschwinden");
  assert.match(inhalt, /## Update \d{4}-\d{2}-\d{2} \(Thomas Heim\)/);
  assert.match(inhalt, /Neuer Befund: A gilt nicht mehr, stattdessen B\./);
  assert.match(inhalt, /Widerspruch|Weiterentwicklung/);

  const log = await execFileAsync("git", ["-C", repoRoot, "log", "--oneline"]);
  assert.match(log.stdout, /Update "Testseite Zwei"/);
});

test("schreibe_wiki_seite: verweigert Bereich, der aus dem Wiki-Ordner ausbricht", async () => {
  const repoRoot = await tempRepo();
  const result = await schreibeWikiSeite({
    bereich: "../../ausserhalb",
    titel: "Fluchtversuch",
    inhalt: "Sollte innerhalb von wiki/ landen.",
    autor: "Thomas Heim",
  }, { repoRoot });

  // sanitizeBereich entschärft ".." zu einem harmlosen Ordnernamen statt zu
  // scheitern — Ergebnis muss trotzdem unter wiki/ liegen.
  assert.ok(result.pfad.startsWith("wiki/"), `Pfad ${result.pfad} muss innerhalb von wiki/ bleiben`);
  assert.ok(!result.pfad.includes(".."));
});
