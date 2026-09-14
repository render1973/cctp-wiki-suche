# Praxisbeispiel: Rhino-Agent — Automatisierte Zonierung (Städtebau)

- Status: entwurf
- Autor: Thomas Heim
- Typ: praxisbeispiel
- Themencluster: KI-Agenten, Computational Design, Städtebau, Parametrik
- Quelle: https://www.linkedin.com/in/abhinavbhardwaj/ (LinkedIn-Post Abhinav Bhardwaj, 2026-09-13, Video-Demo 32 Sek.)
- Erfasst: 2026-09-14
- Tags: rhino, ki-agent, python, automatisierung, zonierung, masterplan

---

## Kurzübersicht

Abhinav Bhardwaj (Architect, Urban and Computational Designer, AI) zeigt in einem 32-sekündigen LinkedIn-Video einen agentischen Rhino-Workflow (`rhino-agent`), der aus einer JSON-Konfigurationsdatei vollautomatisch vier Zonierungs-/Masterplan-Varianten für ein Stadtentwicklungsareal generiert.

> *"Automated zoning, as per the requirements, tangible inputs and specific numbers and ratios. This analyses the overall context, restrictions and determines the possibilities — taking the zoning principles, accessibility, movement and placement of functions into account."*  
> — Abhinav Bhardwaj, LinkedIn, 2026-09-13

---

## Was passiert technisch

| Komponente | Beschreibung |
|---|---|
| **Tool** | `rhino-agent` (eigene Entwicklung) |
| **Input** | `alsafa_options.json` — Anforderungen, Verhältniszahlen, Zonierungs-parameter |
| **Umgebung** | Rhino 3D + Python-Scripting (`rhino.run_python`) |
| **Ablauf** | 32 Stages sequenziell: Kontext → Erschliessung → Analyse → Bewegung → Zonierung |
| **Output** | 4 Lageplantypologien: A Gradient / B Central Green / C Twin Bands / D Three Nodes |

### Typische Stage-Inhalte
- **Kontext:** Bäume, Puffer, Vegetationsflächen
- **Erschliessung/Edges:** Strasseninfrastruktur
- **Analyse:** Sonne, Wind, Lärm
- **Bewegung:** Promenaden, Velowege, öffentlicher Verkehr, Zugänge/Gates
- **Zonierung:** Lawn, Grove, Skate, Play, Quiet — flächen- und verhältnismässig berechnet

---

## Einordnung / Lesart

Das Beispiel zeigt, dass ein KI-gestützter agentenbasierter Workflow bereits heute **Masterplan-Dispositionen** aus Anforderungsdaten generieren kann — nicht nur Einzelzeichnungen.

**Wesentliche Merkmale:**
- Deterministisch-parametrisch, kein generatives Bildmodell
- Agent interpretiert semantische Anforderungen (z. B. *"calm band on the school"*) und übersetzt sie in geometrische Operationen
- Varianten entstehen durch verschiedene Zonierungs-Prinzipien, nicht durch Zufall
- Mensch bleibt als Anforderungsgeber und Variantenbewerter im Loop

**Bhardwaj's eigene Einschätzung:**  
> *"This makes me wonder where we're heading to. Use cases matter a lot though!"*

---

## Relevanz für CCTP

| Kontext | Bezug |
|---|---|
| **KI-Navigator** | Anwendungsfall: agentische Planung / parametrische Entwurfsautomatisierung |
| **ArgenKI** | Beleg für KI-Einsatz im Entwurfsprozess (städtebaulicher Massstab) |
| **KI-Planungstool / BIM2Brick** | Konzeptuell verwandt: Anforderungs-JSON → generiertes Modell — hier auf Zonierungs-/Masterplanebene statt Gebäude/IFC |
| **Lehre CAS DC** | Demos-Kategorie: was heute schon geht — reales Praxisbeispiel für KI-Agenten im Entwurf |

---

## Quelle

- LinkedIn-Post: [Abhinav Bhardwaj, ca. 2026-09-13](https://www.linkedin.com/in/abhinavbhardwaj/) — Video-Demo, 32 Sek.
- Ergänzend im Radar-Snapshot: [[radar-linkedin-2026-09]] (Bhardwaj-Einträge 1–3: OSM-Kontext-Abruf, Schnelle Automatisierung, Coera)
