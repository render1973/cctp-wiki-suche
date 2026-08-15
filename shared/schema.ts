import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

export const askRequestSchema = z.object({
  question: z.string().trim().min(2).max(2000),
  history: z.array(chatTurnSchema).max(8).optional(),
});

export type AskRequest = z.infer<typeof askRequestSchema>;

export const citationSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortTitle: z.string(),
  status: z.string(),
  section: z.string().optional(),
  source: z.string(),
  path: z.string(),
});

export type Citation = z.infer<typeof citationSchema>;

export type Coverage = "im-bestand" | "teilweise" | "nicht-im-bestand";

export type AskResponse = {
  answer: string;
  citations: Citation[];
  coverage: Coverage;
  mode: "wiki" | "auszug";
};
