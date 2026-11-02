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

/** 日程（`- 2026-11-05` または `{ date, time?, url? }`） */
const performanceHistoryEntrySchema = z.union([
  z.date(),
  z.object({
    date: z.coerce.date(),
    time: z.string().optional(),
    url: z.string().url().optional(),
  }),
]);
const performanceHistorySchema = z.array(performanceHistoryEntrySchema).optional();

/** 稽古クラス（一覧・詳細にバッジ） */
export const eventClassSchema = z.enum(["junior"]);

const eventCommon = {
  title: z.string(),
  cover: z.string().optional(),
  performanceHistory: performanceHistorySchema,
  class: eventClassSchema.optional(),
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

// 公演・イベント（content/stages）
const stages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/stages" }),
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

// お知らせ（content/news）
const news = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    link: z.string().url().optional(),
  }),
});

/** 開講クラス（content/classes） */
const classes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/classes" }),
  schema: z.object({
    title: z.string(),
    english: z.string(),
    tag: z.string().optional(),
    summary: z.string(),
    image: z.string(),
    schedule: z.string().optional(),
    target: z.string().optional(),
    fee: z.string().optional(),
    /** サイドバー画像の収め方（横長チラシは contain） */
    coverFit: z.enum(['cover', 'contain']).default('cover'),
    highlights: z.array(z.string()).optional(),
    instructors: z
      .array(
        z.object({
          name: z.string(),
          photo: z.string(),
          bio: z.string(),
        }),
      )
      .optional(),
    /** 一覧・トップに載せない追記ブロック（appendTo で親ページに結合） */
    appendTo: z.string().optional(),
    showInClassList: z.boolean().default(true),
    /** トップ「開講クラス」に表示 */
    showOnHome: z.boolean().default(true),
    /** 一覧の並び（昇順） */
    order: z.number().default(0),
  }),
});

export const collections = { blog, stages, news, classes };
