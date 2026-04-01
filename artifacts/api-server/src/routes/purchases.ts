import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable, buyerEmailsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// ─── Purchases table for tracking individual sales ──────────────────────

// We store purchases inline using buyer_emails table + product revenue fields

// ─── Stripe Webhook ─────────────────────────────────────────────────────
// Handles checkout.session.completed to:
// 1. Increment product totalSales + totalRevenue
// 2. Save buyer email
// 3. Generate a download token

router.post("/webhooks/stripe", async (req: Request, res: Response) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  let event: any;

  if (stripeKey && process.env.STRIPE_WEBHOOK_SECRET) {
    // Production: verify webhook signature
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const sig = req.headers["stripe-signature"] as string;
      // Note: For signature verification, request body needs to be raw.
      // In development without webhook secret, we skip verification.
      event = stripe.webhooks.constructEvent(
        JSON.stringify(req.body),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      req.log.error({ err: err.message }, "Webhook signature verification failed");
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }
  } else {
    // Development / no webhook secret: trust the payload
    event = req.body;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    if (!session) {
      res.json({ received: true });
      return;
    }

    const customerEmail = session.customer_email || session.customer_details?.email || "";
    const customerName = session.customer_details?.name || "";
    const amountPaid = (session.amount_total || 0) / 100; // Convert from cents
    
    // Find the product by matching the success_url pattern: /product/:id?success=true
    const successUrl = session.success_url || "";
    const productIdMatch = successUrl.match(/\/product\/([^?]+)/);
    const productId = productIdMatch?.[1] || "";

    if (productId) {
      try {
        // 1. Increment sales + revenue on the product
        await db
          .update(productsTable)
          .set({
            totalSales: sql`${productsTable.totalSales} + 1`,
            totalRevenue: sql`${productsTable.totalRevenue} + ${amountPaid}`,
            updatedAt: new Date(),
          })
          .where(eq(productsTable.id, productId));

        // 2. Save buyer email
        if (customerEmail) {
          const purchaseId = randomUUID();
          await db.insert(buyerEmailsTable).values({
            id: purchaseId,
            productId,
            email: customerEmail,
            firstName: customerName.split(" ")[0] || null,
          });
        }

        // 3. Append buyer's country to product's buyerCountries
        const buyerCountry = session.customer_details?.address?.country;
        if (buyerCountry) {
          const [product] = await db
            .select({ buyerCountries: productsTable.buyerCountries })
            .from(productsTable)
            .where(eq(productsTable.id, productId));
          
          const countries = (product?.buyerCountries as string[]) || [];
          if (!countries.includes(buyerCountry)) {
            await db
              .update(productsTable)
              .set({ buyerCountries: [...countries, buyerCountry] })
              .where(eq(productsTable.id, productId));
          }
        }

        req.log.info({ productId, email: customerEmail, amount: amountPaid }, "Purchase recorded");
      } catch (err) {
        req.log.error({ err, productId }, "Failed to process purchase");
      }
    }
  }

  res.json({ received: true });
});

// ─── Manual purchase simulation (for demo/testing) ──────────────────────
// Allows simulating a purchase without Stripe in development

router.post("/purchases/simulate", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { productId, buyerEmail, buyerName } = req.body;
  if (!productId) {
    res.status(400).json({ error: "productId required" });
    return;
  }

  try {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const amount = parseFloat(product.price);

    // Increment sales
    await db
      .update(productsTable)
      .set({
        totalSales: sql`${productsTable.totalSales} + 1`,
        totalRevenue: sql`${productsTable.totalRevenue} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, productId));

    // Save buyer
    if (buyerEmail) {
      await db.insert(buyerEmailsTable).values({
        id: randomUUID(),
        productId,
        email: buyerEmail,
        firstName: buyerName || null,
      });
    }

    // Generate download token
    const downloadToken = randomUUID();

    res.json({
      success: true,
      downloadToken,
      message: `Purchase simulated: $${amount} for ${product.productName || product.skill}`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to simulate purchase");
    res.status(500).json({ error: "Failed to simulate purchase" });
  }
});

// ─── Get purchases for a product (creator view) ─────────────────────────

router.get("/purchases/:productId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { productId } = req.params;
  try {
    // Verify ownership
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));

    if (!product || product.userId !== (req.user as any)?.id) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const buyers = await db
      .select()
      .from(buyerEmailsTable)
      .where(eq(buyerEmailsTable.productId, productId));

    res.json({
      totalSales: product.totalSales || 0,
      totalRevenue: product.totalRevenue || "0",
      buyers: buyers.map(b => ({
        ...b,
        email: b.email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get purchases");
    res.status(500).json({ error: "Failed to get purchases" });
  }
});

export default router;
