import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ensureVaultCloned, pullVaultLatest, resolveVaultCloneUrl, VaultGitError } from "./vault-git.js";

// Läuft ausschliesslich gegen ein lokales temporäres bare Repo - kein
// Netzwerk, kein echtes GitHub. Prüft genau die Mechanik aus dem Briefing:
// Erst-Klon beim ersten Zugriff, danach nur noch Pull, nie Push.

function sh(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8" }).trim();
}

function initBareOrigin(): { base: string; origin: string; seed: string } {
  const base = mkdtempSync(path.join(tmpdir(), "cctp-vault-git-test-"));
  const origin = path.join(base, "vault-origin.git");
  sh(base, ["init", "--bare", "--initial-branch=main", origin]);

  const seed = path.join(base, "seed");
  sh(base, ["clone", origin, seed]);
  sh(seed, ["config", "user.name", "Seed"]);
  sh(seed, ["config", "user.email", "seed@example.invalid"]);
  mkdirSync(path.join(seed, "10-wiki", "forschung"), { recursive: true });
  writeFileSync(path.join(seed, "10-wiki", "forschung", "erste-seite.md"), "# Erste Seite\n");
  sh(seed, ["add", "."]);
  sh(seed, ["commit", "-m", "Initial"]);
  sh(seed, ["push", origin, "HEAD:main"]);

  return { base, origin, seed };
}

test("ensureVaultCloned: klont beim ersten Zugriff, falls der Zielordner noch fehlt", async () => {
  const { base, origin } = initBareOrigin();
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  process.env.CCTP_VAULT_GIT_URL = origin;
  try {
    const vaultRoot = path.join(base, "vault-checkout");
    assert.equal(existsSync(vaultRoot), false);

    await ensureVaultCloned(vaultRoot);

    assert.ok(existsSync(path.join(vaultRoot, ".git")));
    const content = readFileSync(path.join(vaultRoot, "10-wiki", "forschung", "erste-seite.md"), "utf-8");
    assert.match(content, /Erste Seite/);
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    rmSync(base, { recursive: true, force: true });
  }
});

test("ensureVaultCloned: klont kein zweites Mal, wenn schon ein Checkout existiert", async () => {
  const { base, origin } = initBareOrigin();
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  process.env.CCTP_VAULT_GIT_URL = origin;
  try {
    const vaultRoot = path.join(base, "vault-checkout");
    await ensureVaultCloned(vaultRoot);

    // Eigene, lokale Änderung im Checkout - würde ein erneuter Klon überschreiben.
    writeFileSync(path.join(vaultRoot, "10-wiki", "forschung", "lokale-markierung.md"), "# Lokal\n");

    await ensureVaultCloned(vaultRoot);

    assert.ok(existsSync(path.join(vaultRoot, "10-wiki", "forschung", "lokale-markierung.md")));
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    rmSync(base, { recursive: true, force: true });
  }
});

test("pullVaultLatest: holt neue Commits vom Origin nach, ohne selbst je zu pushen", async () => {
  const { base, origin, seed } = initBareOrigin();
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  process.env.CCTP_VAULT_GIT_URL = origin;
  try {
    const vaultRoot = path.join(base, "vault-checkout");
    await ensureVaultCloned(vaultRoot);

    // Simuliert eine externe Änderung am Vault-Repo (z. B. Thomas' Obsidian-Sync).
    writeFileSync(path.join(seed, "10-wiki", "forschung", "zweite-seite.md"), "# Zweite Seite\n");
    sh(seed, ["add", "."]);
    sh(seed, ["commit", "-m", "Zweite Seite"]);
    sh(seed, ["push", origin, "HEAD:main"]);

    await pullVaultLatest(vaultRoot);

    const content = readFileSync(path.join(vaultRoot, "10-wiki", "forschung", "zweite-seite.md"), "utf-8");
    assert.match(content, /Zweite Seite/);
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    rmSync(base, { recursive: true, force: true });
  }
});

test("pullVaultLatest: no-op, solange noch kein Checkout existiert", async () => {
  const base = mkdtempSync(path.join(tmpdir(), "cctp-vault-git-test-nopull-"));
  try {
    const vaultRoot = path.join(base, "nie-geklont");
    await assert.doesNotReject(() => pullVaultLatest(vaultRoot));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("ensureVaultCloned: räumt einen kaputten Checkout-Ordner nach Fehlschlag auf, statt dauerhaft hängen zu bleiben", async () => {
  const { base, origin } = initBareOrigin();
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  process.env.CCTP_VAULT_GIT_URL = origin;
  try {
    const vaultRoot = path.join(base, "vault-checkout");
    // Simuliert einen zuvor abgebrochenen Klon-Versuch: ein nicht-leerer
    // Zielordner ohne vollständiges .git - `git clone` weigert sich, dort
    // hineinzuklonen ("destination path already exists").
    mkdirSync(vaultRoot, { recursive: true });
    writeFileSync(path.join(vaultRoot, "halbfertig.txt"), "Rest eines abgebrochenen Klons\n");

    await assert.rejects(() => ensureVaultCloned(vaultRoot), VaultGitError);
    assert.equal(existsSync(vaultRoot), false, "kaputter Ordner sollte nach dem Fehlschlag entfernt sein");

    // Nächster Versuch startet sauber neu, statt am kaputten Zustand hängen zu bleiben.
    await ensureVaultCloned(vaultRoot);
    assert.ok(existsSync(path.join(vaultRoot, ".git")));
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    rmSync(base, { recursive: true, force: true });
  }
});

test("resolveVaultCloneUrl: setzt CCTP_VAULT_GIT_TOKEN in eine github.com-HTTPS-URL ein", () => {
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  const previousToken = process.env.CCTP_VAULT_GIT_TOKEN;
  process.env.CCTP_VAULT_GIT_URL = "https://github.com/render1973/cctp-knowledge-lab-vault.git";
  process.env.CCTP_VAULT_GIT_TOKEN = "geheimes-test-token";
  try {
    assert.equal(
      resolveVaultCloneUrl(),
      "https://x-access-token:geheimes-test-token@github.com/render1973/cctp-knowledge-lab-vault.git",
    );
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    if (previousToken === undefined) delete process.env.CCTP_VAULT_GIT_TOKEN;
    else process.env.CCTP_VAULT_GIT_TOKEN = previousToken;
  }
});

test("resolveVaultCloneUrl: lässt lokale Pfade (z. B. in Tests) unverändert, selbst mit gesetztem Token", () => {
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  const previousToken = process.env.CCTP_VAULT_GIT_TOKEN;
  const localPath = path.join(tmpdir(), "irgendein-lokales-bare-repo.git");
  process.env.CCTP_VAULT_GIT_URL = localPath;
  process.env.CCTP_VAULT_GIT_TOKEN = "geheimes-test-token";
  try {
    assert.equal(resolveVaultCloneUrl(), localPath);
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    if (previousToken === undefined) delete process.env.CCTP_VAULT_GIT_TOKEN;
    else process.env.CCTP_VAULT_GIT_TOKEN = previousToken;
  }
});

test("resolveVaultCloneUrl: ohne Token bleibt die Basis-URL unverändert", () => {
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  const previousToken = process.env.CCTP_VAULT_GIT_TOKEN;
  process.env.CCTP_VAULT_GIT_URL = "https://github.com/render1973/cctp-knowledge-lab-vault.git";
  delete process.env.CCTP_VAULT_GIT_TOKEN;
  try {
    assert.equal(resolveVaultCloneUrl(), "https://github.com/render1973/cctp-knowledge-lab-vault.git");
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    if (previousToken === undefined) delete process.env.CCTP_VAULT_GIT_TOKEN;
    else process.env.CCTP_VAULT_GIT_TOKEN = previousToken;
  }
});

test("ensureVaultCloned: wirft eine klare Fehlermeldung bei ungültiger Remote-URL", async () => {
  const base = mkdtempSync(path.join(tmpdir(), "cctp-vault-git-test-fail-"));
  const previousUrl = process.env.CCTP_VAULT_GIT_URL;
  process.env.CCTP_VAULT_GIT_URL = path.join(base, "existiert-nicht.git");
  try {
    const vaultRoot = path.join(base, "vault-checkout");
    await assert.rejects(() => ensureVaultCloned(vaultRoot), VaultGitError);
  } finally {
    if (previousUrl === undefined) delete process.env.CCTP_VAULT_GIT_URL;
    else process.env.CCTP_VAULT_GIT_URL = previousUrl;
    rmSync(base, { recursive: true, force: true });
  }
});
