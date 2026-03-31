import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/stripe/create-checkout", async (req: Request, res: Response) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: "productId is required" });
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

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      if (product.stripeCheckoutUrl) {
        res.json({ checkoutUrl: product.stripeCheckoutUrl });
        return;
      }
      res.status(400).json({ error: "Stripe not configured" });
      return;
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const priceInCents = Math.round(parseFloat(product.price) * 100);
    const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.productName ?? product.skill,
              description: product.productDescription ?? undefined,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/product/${product.id}?success=true`,
      cancel_url: `${origin}/product/${product.id}`,
    });

    await db
      .update(productsTable)
      .set({ stripeCheckoutUrl: session.url })
      .where(eq(productsTable.id, productId));

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create Stripe checkout");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
