// Pro-Person-Tokens für den gehosteten HTTP-Modus. Bewusst minimal (kein SSO,
// kein OAuth) — die Wiki-Inhalte sind nach Projektkonvention nicht vertraulich.
// Token -> Klarname/E-Mail-Mapping kommt aus der Umgebungsvariable WIKI_TOKENS
// (JSON), nicht aus dem Code und nicht aus dem Repo. Wird bei jeder Anfrage neu
// gelesen, damit ein Redeploy nach Token-Änderung ohne Code-Änderung greift.

export type ResolvedUser = { name: string; email: string };

function isResolvedUser(value: unknown): value is ResolvedUser {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.name === "string" && record.name.trim().length > 0
    && typeof record.email === "string" && record.email.trim().length > 0;
}

export class TokenConfigError extends Error {}

function loadTokenMap(): Record<string, ResolvedUser> {
  const raw = process.env.WIKI_TOKENS;
  if (!raw || raw.trim().length === 0) {
    throw new TokenConfigError(
      "WIKI_TOKENS ist nicht gesetzt. Format: " +
        '{"<token>":{"name":"Vorname Nachname","email":"vorname.nachname@hslu.ch"}, ...}',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new TokenConfigError(`WIKI_TOKENS ist kein gültiges JSON: ${(error as Error).message}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new TokenConfigError("WIKI_TOKENS muss ein JSON-Objekt sein (Token -> {name, email}).");
  }
  const map: Record<string, ResolvedUser> = {};
  for (const [token, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isResolvedUser(value)) {
      throw new TokenConfigError(
        `WIKI_TOKENS: Eintrag für Token "${token.slice(0, 4)}…" braucht "name" und "email" als nichtleere Strings.`,
      );
    }
    map[token] = { name: value.name.trim(), email: value.email.trim() };
  }
  return map;
}

/**
 * Löst ein Bearer-Token zum Klarnamen/E-Mail auf. Gibt null zurück bei
 * fehlendem oder unbekanntem Token — der Aufrufer weist die Anfrage dann mit
 * 401 zurück.
 */
export function resolveToken(token: string | undefined): ResolvedUser | null {
  if (!token) return null;
  const map = loadTokenMap();
  return map[token] ?? null;
}

/** Wirft TokenConfigError, wenn WIKI_TOKENS beim Start fehlt oder kaputt ist. */
export function assertTokenConfigPresent(): void {
  loadTokenMap();
}
