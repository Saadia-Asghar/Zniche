import { pgTable, text, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bundlesTable = pgTable("bundles", {
  id: text("id").primaryKey(),
  creatorUserId: text("creator_user_id").notNull(),
  bundleName: text("bundle_name").notNull(),
  productIds: jsonb("product_ids").notNull().default([]),
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }).notNull(),
  stripeCheckoutUrl: text("stripe_checkout_url"),
  pageSlug: text("page_slug"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBundleSchema = createInsertSchema(bundlesTable).omit({ createdAt: true });
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type Bundle = typeof bundlesTable.$inferSelect;
