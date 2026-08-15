#!/usr/bin/env python3
from pathlib import Path
import json

root = Path("/home/user/workspace/cctp-wiki-chat/server/wiki")
pages = [
    {
        "id": "entscheidung",
        "file": "entscheidung.md",
        "title": "Roharchiv plus Wiki statt nur Chat-Suche",
        "shortTitle": "Entscheidung",
        "type": "entscheidung",
        "area": "Entscheidungen",
        "status": "freigegeben",
        "author": "Thomas Heim",
        "reviewed": "Thomas Heim, 2026-08-15",
        "released": "Thomas Heim, 2026-08-15",
        "created": "2026-08-15",
        "driveId": "1O3mytNdvfcstk9SohTom6z02v_Ib7cGa",
        "path": "10-wiki/entscheidungen/roharchiv-plus-wiki.md",
        "sources": [
            "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
            "Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche",
        ],
    },
    {
        "id": "lektion",
        "file": "lektion.md",
        "title": "Wissensarchitekturen in Digital Construction",
        "shortTitle": "Lektion",
        "type": "unterrichtslektion",
        "area": "Lehre",
        "status": "freigegeben",
        "author": "Thomas Heim",
        "reviewed": "Thomas Heim, 2026-08-15",
        "released": "Thomas Heim, 2026-08-15",
        "created": "2026-08-15",
        "driveId": "1744Vk6l-PpTcR8dqMCK6jrCSuYmWToq9",
        "path": "10-wiki/lehre/wissensarchitekturen-digital-construction.md",
        "sources": [
            "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
            "HSLU Digital Construction — Programmlogik Lebenszyklus — externe Einordnung",
        ],
    },
    {
        "id": "forschungsfall",
        "file": "forschungsfall.md",
        "title": "Qualität, Auffindbarkeit und Wartbarkeit von Wissen",
        "shortTitle": "Forschungsfall",
        "type": "forschungsfall",
        "area": "Forschung",
        "status": "freigegeben",
        "author": "Thomas Heim",
        "reviewed": "Thomas Heim, 2026-08-15",
        "released": "Thomas Heim, 2026-08-15",
        "created": "2026-08-15",
        "driveId": "1mRuSgMOgYz73RvUfOXVVPHtMhKZH1IXY",
        "path": "10-wiki/forschung/qualitaet-auffindbarkeit-wissenslab.md",
        "sources": [
            "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
            "Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche",
        ],
    },
    {
        "id": "demo",
        "file": "demo.md",
        "title": "Demo 2026-08-15: Chat, Dateisuche, Wiki",
        "shortTitle": "Demo",
        "type": "forschungsfall",
        "area": "Forschung",
        "status": "freigegeben",
        "author": "Thomas Heim",
        "reviewed": "Thomas Heim, 2026-08-15",
        "released": "Thomas Heim, 2026-08-15",
        "created": "2026-08-15",
        "driveId": "1H5z9lcX7-ROE0HA5ZttuxJPmmpsa8poz",
        "path": "10-wiki/forschung/demo-2026-08-15-drei-schichten.md",
        "sources": [
            "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
            "Google-Drive-Dateisuche und Volltext — 2026-08-15 — Suche",
            "Wiki-Startseiten und 99-admin/konventionen.md — 2026-08-15 — Wiki",
        ],
    },
    {
        "id": "sprint",
        "file": "sprint.md",
        "title": "Knowledge Architecture Sprint",
        "shortTitle": "Sprint",
        "type": "dienstleistungsmodul",
        "area": "Dienstleistungen",
        "status": "freigegeben",
        "author": "Thomas Heim",
        "reviewed": "Thomas Heim, 2026-08-15",
        "released": "Thomas Heim, 2026-08-15",
        "created": "2026-08-15",
        "driveId": "12fucy4EL9T564IKL9newRu6ourohRyAu",
        "path": "10-wiki/dienstleistungen/knowledge-architecture-sprint.md",
        "sources": [
            "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
            "Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche",
        ],
    },
]

out = []
for p in pages:
    body = (root / p["file"]).read_text(encoding="utf-8")
    item = {k: v for k, v in p.items() if k != "file"}
    item["body"] = body
    out.append(item)

dest = Path("/home/user/workspace/cctp-wiki-chat/server/corpus.ts")
dest.write_text(
    "export type WikiPage = {\n"
    "  id: string;\n"
    "  title: string;\n"
    "  shortTitle: string;\n"
    "  type: string;\n"
    "  area: string;\n"
    "  status: string;\n"
    "  author: string;\n"
    "  reviewed: string;\n"
    "  released: string;\n"
    "  created: string;\n"
    "  driveId: string;\n"
    "  path: string;\n"
    "  sources: string[];\n"
    "  body: string;\n"
    "};\n\n"
    "export const PAGES: WikiPage[] = "
    + json.dumps(out, ensure_ascii=False, indent=2)
    + " as WikiPage[];\n\n"
    "export const PROMPTS = [\n"
    '  { id: "wiederfinden", label: "Wiederfinden", text: "Welche bisherigen CCTP-Erkenntnisse gibt es zu Wissensarchitekturen, Digital Construction und generativer KI?" },\n'
    '  { id: "verdichten", label: "Verdichten", text: "Was ist der konsolidierte Stand zu Roharchiv, Wiki, RAG und CDE?" },\n'
    '  { id: "transfer", label: "Transfer", text: "Wie wird aus demselben Wissen Lektion, Forschungsfall und Dienstleistung?" },\n'
    '  { id: "abgrenzung", label: "Abgrenzung", text: "Wann ist ein LLM-Wiki gegenüber Chat-Search oder RAG überlegen?" },\n'
    '  { id: "governance", label: "Governance", text: "Was bleibt im CDE oder DMS führend, und welche Regeln gelten für Status, Quelle und Freigabe?" },\n'
    "] as const;\n",
    encoding="utf-8",
)
print(f"wrote {dest} ({dest.stat().st_size} bytes)")
