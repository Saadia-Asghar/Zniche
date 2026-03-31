import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  skill: text("skill").notNull(),
  hoursPerWeek: integer("hours_per_week").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("building"),
  productName: text("product_name"),
  tagline: text("tagline"),
  productDescription: text("product_description"),
  productFormat: text("product_format"),
  category: text("category"),
  headline: text("headline"),
  salesCopy: text("sales_copy"),
  socialCaptions: text("social_captions"),
  stripeCheckoutUrl: text("stripe_checkout_url"),
  stripeProductId: text("stripe_product_id"),
  marketplaceListed: boolean("marketplace_listed").default(false),
  creatorFirstName: text("creator_first_name"),
  marketResearch: text("market_research"),
  pageSlug: text("page_slug"),
  viewCount: integer("view_count").default(0),
  totalSales: integer("total_sales").default(0),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).default("0"),
  isFeatured: boolean("is_featured").default(false),
  isVerifiedCreator: boolean("is_verified_creator").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
