import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { productsTable } from "./products";

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => productsTable.id),
  buyerEmail: text("buyer_email").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviewsTable.$inferSelect;
