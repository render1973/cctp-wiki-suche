import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BEREICHE, wikiRoot } from "./corpus.js";

// Status, die nur Thomas Heim fachlich vergibt (siehe
// wiki/entscheidungen/roharchiv-plus-wiki.md). Das Schreib-Werkzeug lehnt sie ab.
const GESPERRTE_STATUS = ["geprueft", "freigegeben"];

export type SchreibeWikiSeiteResult =
  | { ok: true; pfad: string }
  | { ok: false; fehler: string };

function extractStatus(inhalt: string): string | null {
  const match = inhalt.match(/^-\s*Status:\s*(.+)$/im);
  return match ? match[1].trim().toLowerCase() : null;
}

/**
 * Entfernt eine vom Client mitgelieferte "- Autor:"-Zeile und setzt stattdessen
 * den serverseitig aus dem Token aufgelösten Klarnamen ein. Der Autor darf
 * nicht vom Aufrufer behauptet werden können (Authentizität des Token-Mappings).
 */
function injectAutor(inhalt: string, autorName: string): string {
  const ohneAutorZeile = inhalt.replace(/^-\s*Autor:.*$\n?/gim, "");
  const statusMatch = ohneAutorZeile.match(/^-\s*Status:.*$/im);
  const autorZeile = `- Autor: ${autorName}`;
  if (!statusMatch) {
    return `${ohneAutorZeile.trimEnd()}\n${autorZeile}\n`;
  }
  const insertAt = statusMatch.index! + statusMatch[0].length;
  return `${ohneAutorZeile.slice(0, insertAt)}\n${autorZeile}${ohneAutorZeile.slice(insertAt)}`;
}

export function schreibeWikiSeite(params: {
  bereich: string;
  dateiname: string;
  inhalt: string;
  ueberschreiben?: boolean;
  /** Nur im HTTP-Modus gesetzt: aus dem Bearer-Token aufgelöste Identität. */
  autor?: { name: string; email: string };
}): SchreibeWikiSeiteResult {
  const { bereich, dateiname, ueberschreiben = false, autor } = params;
  const inhalt = autor ? injectAutor(params.inhalt, autor.name) : params.inhalt;

  if (!(BEREICHE as readonly string[]).includes(bereich)) {
    return {
      ok: false,
      fehler: `Unbekannter Bereich "${bereich}". Erlaubt: ${BEREICHE.join(", ")}.`,
    };
  }

  const slug = dateiname.trim().replace(/\.md$/i, "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      fehler: `Dateiname "${dateiname}" ist kein gültiger Slug (nur a-z, 0-9, Bindestrich, z. B. "innosuisse-innocheck").`,
    };
  }

  const status = extractStatus(inhalt);
  if (status && GESPERRTE_STATUS.includes(status)) {
    return {
      ok: false,
      fehler: `Status "${status}" darf nicht automatisiert gesetzt werden — das entscheidet nur Thomas Heim. Seite mit Status "entwurf" oder "zu-pruefen" schreiben.`,
    };
  }

  const dir = path.join(wikiRoot, bereich);
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}.md`);

  if (existsSync(filePath) && !ueberschreiben) {
    return {
      ok: false,
      fehler: `Datei existiert bereits: wiki/${bereich}/${slug}.md. Zum Überschreiben "ueberschreiben: true" setzen.`,
    };
  }

  writeFileSync(filePath, inhalt.endsWith("\n") ? inhalt : `${inhalt}\n`, "utf-8");

  return { ok: true, pfad: `wiki/${bereich}/${slug}.md` };
}
