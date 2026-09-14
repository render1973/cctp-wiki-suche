import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

// Baut einen minimalen Fixture-Vault unter einem Temp-Verzeichnis auf und
// zeigt CCTP_VAULT_PATH testweise dorthin — der echte Vault
// (cctp-knowledge-lab) ist ein separates Repo und liegt nicht in diesem
// Checkout, kann also nicht als Testfixture eingebunden werden.
const fixtureRoot = path.join(os.tmpdir(), `cctp-vault-fixture-${Date.now()}`);

// relPath ist der Pfad relativ zu 10-wiki/, z. B. "forschung/projekte/ig-stwe.md".
function writeFixturePage(relPath: string, inhalt: string): void {
  const fullPath = path.join(fixtureRoot, "10-wiki", relPath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, inhalt, "utf-8");
}

test.before(() => {
  process.env.CCTP_VAULT_PATH = fixtureRoot;

  writeFixturePage(
    "forschung/reallabor-entlebuch.md",
    "# Reallabor Mobilität Entlebuch\n\nstatus: zu-pruefen\n\n" +
      "Ein Reallabor zur Mobilität in der Biosphäre Entlebuch, mit Fördermitteln vom Bund und mehreren beteiligten Abteilungen der Hochschule Luzern.\n",
  );
  // Verschachtelte Unterordner (wie forschung/projekte/ im echten Vault) müssen mit-durchsucht werden.
  writeFixturePage(
    "forschung/projekte/ig-stwe.md",
    "# IG STWE Information & Finanzierung\n\nstatus: entwurf\n\n" +
      "Rücklagenmängel und Sanierungsfinanzierung im Stockwerkeigentum, mit Fokus auf Transparenzdefizite bei Verwaltungen.\n",
  );
  writeFixturePage(
    "personen/beispiel-person.md",
    "---\nstatus: entwurf\nquelle: https://example.invalid/beispiel-person\n---\n\n# Beispiel, Person\n\n" +
      "Arbeitet seit mehreren Jahren zu Reallaboren und Mobilität in ländlichen Regionen der Schweiz.\n",
  );
});

test.after(() => {
  delete process.env.CCTP_VAULT_PATH;
  rmSync(fixtureRoot, { recursive: true, force: true });
});

test("such_cctp_vault: findet Treffer über verschachtelte Unterordner hinweg (nur Lesezugriff)", async () => {
  const { searchVault } = await import("./vault-search.js");
  const hits = searchVault("Reallabor Mobilität");
  assert.ok(hits.length >= 2, "erwartet Treffer aus forschung/ und personen/");
  assert.ok(hits.every((hit) => hit.rohquellePfad.startsWith("10-wiki/")));
});

test("such_cctp_vault: Treffer mit `quelle:`-Frontmatter liefert die Quell-URL im eigenen Feld", async () => {
  const { searchVault } = await import("./vault-search.js");
  const hits = searchVault("Reallabor Mobilität", "personen");
  assert.ok(hits.length > 0);
  assert.equal(hits[0].quelle, "https://example.invalid/beispiel-person");
});

test("such_cctp_vault: Bereich-Filter schränkt auf einen Vault-Ordner ein", async () => {
  const { searchVault } = await import("./vault-search.js");
  const hits = searchVault("Reallabor Mobilität", "personen");
  assert.ok(hits.length > 0);
  assert.ok(hits.every((hit) => hit.bereich === "personen"));
});

test("such_cctp_vault: liest 00-roharchiv und 99-admin nie mit", async () => {
  writeFileSync(
    (() => {
      const dir = path.join(fixtureRoot, "00-roharchiv");
      mkdirSync(dir, { recursive: true });
      return path.join(dir, "geheim.md");
    })(),
    "# Sollte nie auftauchen\n\nRoharchiv-Inhalt, nicht Teil von 10-wiki.\n",
    "utf-8",
  );
  const { searchVault } = await import("./vault-search.js");
  const hits = searchVault("Sollte nie auftauchen");
  assert.equal(hits.length, 0);
});

test("isVaultAvailable: false, wenn der konfigurierte Vault-Pfad kein 10-wiki enthält", async () => {
  const { isVaultAvailable } = await import("./vault-corpus.js");
  const previous = process.env.CCTP_VAULT_PATH;
  process.env.CCTP_VAULT_PATH = path.join(os.tmpdir(), "nicht-vorhandener-vault-pfad-xyz");
  try {
    assert.equal(isVaultAvailable(), false);
  } finally {
    process.env.CCTP_VAULT_PATH = previous;
  }
});
