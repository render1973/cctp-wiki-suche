import Anthropic from "@anthropic-ai/sdk";
import { PAGES, type WikiPage } from "./corpus";
import type { AskResponse, Citation, Coverage } from "@shared/schema";

const SYSTEM = `Du bist der Such-Chat des CCTP Knowledge Lab.
Du antwortest ausschliesslich aus den fünf freigegebenen Wiki-Seiten, die im Benutzerprompt stehen.
Du erfindest nichts. Du ergänzt nichts aus Allgemeinwissen.

Regeln:
- Antworte auf Deutsch, knapp und klar. Kein Markdown, keine Sternchen, keine Überschriftenzeichen. Statuswerte darfst du in einfachen Anführungszeichen nennen.
- Nenne in jeder Antwort die verwendeten Seiten mit Titel und Status «freigegeben».
- Nenne die Rohquelle, wenn die Seite eine nennt.
- Wenn etwas nicht im Bestand steht, sage das ausdrücklich. Sage nicht, dass du es nicht weisst, wenn es auf einer der Seiten steht.
- CDE/DMS bleibt für verbindliche Projekt-, Rechts- und Normunterlagen führend.
- Status und fachliche Prüfung setzt allein Thomas Heim.
- Ablaufzahlen der Lektion (90 Minuten) und die Sprint-Dauer (2 halbe Tage) sind auf den Seiten als Entwurf markiert. Behandle sie so.
- Der Knowledge Architecture Sprint gilt momentan für Weiterbildung. Eine Dienstleistung für Büros oder Kommunen ist möglich, aber nicht beschlossen.
- Digital Construction ist nicht die Digitalisierung von Dateien, sondern ein verlässlicher Informationsfluss über den Lebenszyklus.

Antwortformat: NUR gültiges JSON, kein Markdown-Zaun.
{
  "answer": "Fliesstext, Absätze mit \\n\\n",
  "citations": [
    {
      "id": "entscheidung|lektion|forschungsfall|demo|sprint",
      "section": "optionaler Abschnitt",
      "source": "Rohquelle wie auf der Seite genannt"
    }
  ],
  "coverage": "im-bestand" | "teilweise" | "nicht-im-bestand"
}`;

function pageCatalog(): string {
  return PAGES.map((page) => {
    return [
      `### ${page.id}`,
      `Titel: ${page.title}`,
      `Kurz: ${page.shortTitle}`,
      `Typ: ${page.type}`,
      `Bereich: ${page.area}`,
      `Status: ${page.status}`,
      `Autor: ${page.author}`,
      `Geprüft: ${page.reviewed}`,
      `Freigegeben: ${page.released}`,
      `Pfad: ${page.path}`,
      `Quellen: ${page.sources.join(" | ")}`,
      "",
      page.body,
    ].join("\n");
  }).join("\n\n-----\n\n");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9äöüß]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function scorePage(question: string, page: WikiPage): number {
  const terms = tokenize(question);
  const hay = `${page.title} ${page.body}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term)) score += 2;
    const count = hay.split(term).length - 1;
    score += Math.min(count, 6);
  }
  return score;
}

function extractPassages(question: string, page: WikiPage, limit = 3): string[] {
  const terms = new Set(tokenize(question));
  const blocks = page.body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 40 && !block.startsWith("# "));
  return blocks
    .map((block) => {
      const tokens = tokenize(block);
      const hits = tokens.filter((token) => terms.has(token)).length;
      return { block, hits };
    })
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((item) => item.block.replace(/\s+/g, " ").slice(0, 420));
}

function extractiveAnswer(question: string): AskResponse {
  const ranked = PAGES.map((page) => ({ page, score: scorePage(question, page) }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0);

  if (ranked.length === 0) {
    return {
      answer:
        "Dazu steht in den fünf freigegebenen Wiki-Seiten nichts. Der Chat antwortet nur aus diesem Bestand. Verbindliche Projekt-, Rechts- und Normunterlagen bleiben im CDE oder DMS führend.",
      citations: [],
      coverage: "nicht-im-bestand",
      mode: "auszug",
    };
  }

  const used = ranked.slice(0, 3);
  const lines: string[] = [];
  const citations: Citation[] = [];

  for (const { page } of used) {
    const passages = extractPassages(question, page);
    if (passages.length === 0) continue;
    lines.push(`${page.title} (Status: freigegeben)`);
    for (const passage of passages) {
      lines.push(passage);
    }
    citations.push({
      id: page.id,
      title: page.title,
      shortTitle: page.shortTitle,
      status: page.status,
      source: page.sources[0] ?? page.path,
      path: page.path,
    });
  }

  if (citations.length === 0) {
    return {
      answer:
        "Die Frage trifft Wörter im Bestand, aber keine belastbare Stelle. Formuliere sie näher an einer der fünf Seiten.",
      citations: [],
      coverage: "nicht-im-bestand",
      mode: "auszug",
    };
  }

  return {
    answer: `${lines.join("\n\n")}\n\nAuszug aus dem freigegebenen Wiki. Sprachmodell nicht verfügbar, deshalb ohne Synthese.`,
    citations,
    coverage: used.length < PAGES.length ? "teilweise" : "im-bestand",
    mode: "auszug",
  };
}

function hydrateCitations(
  raw: Array<{ id?: string; section?: string; source?: string }>,
): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const item of raw) {
    const page = PAGES.find((candidate) => candidate.id === item.id);
    if (!page || seen.has(page.id)) continue;
    seen.add(page.id);
    citations.push({
      id: page.id,
      title: page.title,
      shortTitle: page.shortTitle,
      status: page.status,
      section: item.section,
      source: item.source || page.sources[0] || page.path,
      path: page.path,
    });
  }
  return citations;
}

function parseModelJson(text: string): {
  answer: string;
  citations: Citation[];
  coverage: Coverage;
} | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
      answer?: string;
      citations?: Array<{ id?: string; section?: string; source?: string }>;
      coverage?: Coverage;
    };
    if (!parsed.answer || typeof parsed.answer !== "string") return null;
    const coverage: Coverage =
      parsed.coverage === "nicht-im-bestand" || parsed.coverage === "teilweise"
        ? parsed.coverage
        : "im-bestand";
    return {
      answer: parsed.answer.trim(),
      citations: hydrateCitations(parsed.citations ?? []),
      coverage,
    };
  } catch {
    return null;
  }
}

export async function answerQuestion(
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<AskResponse> {
  try {
    const client = new Anthropic();
    const turns = history.slice(-6).map((turn) => ({
      role: turn.role,
      content: turn.content,
    }));
    const message = await client.messages.create({
      model: "claude_haiku_4_5",
      max_tokens: 1400,
      system: SYSTEM,
      messages: [
        ...turns,
        {
          role: "user",
          content: `Bestand der fünf freigegebenen Seiten:\n\n${pageCatalog()}\n\nFrage:\n${question}`,
        },
      ],
    });
    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    const parsed = parseModelJson(text);
    if (!parsed) {
      return extractiveAnswer(question);
    }
    return {
      ...parsed,
      mode: "wiki",
    };
  } catch (error) {
    console.error("wiki ask failed", error);
    return extractiveAnswer(question);
  }
}
