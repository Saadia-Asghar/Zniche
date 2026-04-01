import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pageViewsTable = pgTable("page_views", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  viewerIpHash: text("viewer_ip_hash"),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  city: text("city"),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPageViewSchema = createInsertSchema(pageViewsTable).omit({ timestamp: true });
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViewsTable.$inferSelect;
