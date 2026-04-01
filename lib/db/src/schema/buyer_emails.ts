import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const buyerEmailsTable = pgTable("buyer_emails", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  userId: text("user_id"),
  email: text("email").notNull(),
  firstName: text("first_name"),
  countryCode: text("country_code"),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
});

export const insertBuyerEmailSchema = createInsertSchema(buyerEmailsTable).omit({ purchaseDate: true });
export type InsertBuyerEmail = z.infer<typeof insertBuyerEmailSchema>;
export type BuyerEmail = typeof buyerEmailsTable.$inferSelect;
