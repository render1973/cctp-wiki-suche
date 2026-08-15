import type { Express } from "express";
import type { Server } from "node:http";
import { askRequestSchema } from "@shared/schema";
import { PAGES, PROMPTS } from "./corpus";
import { answerQuestion } from "./ask";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/pages", (_req, res) => {
    res.json(
      PAGES.map((page) => ({
        id: page.id,
        title: page.title,
        shortTitle: page.shortTitle,
        type: page.type,
        area: page.area,
        status: page.status,
        author: page.author,
        reviewed: page.reviewed,
        released: page.released,
        created: page.created,
        path: page.path,
        sources: page.sources,
        excerpt: page.body
          .split("\n")
          .find((line) => line.length > 80 && !line.startsWith("#") && !line.startsWith("- "))
          ?.slice(0, 220),
      })),
    );
  });

  app.get("/api/pages/:id", (req, res) => {
    const page = PAGES.find((item) => item.id === req.params.id);
    if (!page) {
      res.status(404).json({ error: "Seite nicht im freigegebenen Bestand." });
      return;
    }
    res.json(page);
  });

  app.get("/api/prompts", (_req, res) => {
    res.json(PROMPTS);
  });

  app.post("/api/ask", async (req, res) => {
    const parsed = askRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Die Frage ist zu kurz oder unvollständig." });
      return;
    }
    const result = await answerQuestion(parsed.data.question, parsed.data.history ?? []);
    res.json(result);
  });

  return httpServer;
}
