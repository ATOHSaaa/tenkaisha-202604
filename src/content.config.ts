import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// ブログ（ink.tenkai.org から統合）
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string().default("転回社"),
    category: z.string().default("日々のこと"),
    cover: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

/** 日程（YYYY-MM-DD の配列）。トップ・一覧の判定もここだけ */
const performanceHistorySchema = z.array(z.date()).optional();

const eventCommon = {
  title: z.string(),
  cover: z.string().optional(),
  performanceHistory: performanceHistorySchema,
};

/** カードバッジ用の種別（フロントマターで指定） */
export const eventTypeSchema = z.enum(["long-run", "performance", "event"]);

/** チケットボタン（label + url、複数可） */
const ticketsSchema = z
  .array(
    z.object({
      label: z.string(),
      url: z.string().url(),
    }),
  )
  .optional();

// 公演・イベント（content/events）
const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("long-run"),
      ...eventCommon,
      tickets: ticketsSchema,
    }),
    z.object({
      type: z.literal("performance"),
      ...eventCommon,
      tickets: ticketsSchema,
    }),
    z.object({
      type: z.literal("event"),
      ...eventCommon,
      link: z.string().optional(),
    }),
  ]),
});

export const collections = { blog, events };
