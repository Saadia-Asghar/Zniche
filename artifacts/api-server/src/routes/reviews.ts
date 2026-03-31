import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/reviews/:productId", async (req: Request, res: Response) => {
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, req.params.productId))
      .orderBy(desc(reviewsTable.createdAt));

    const masked = reviews.map(r => ({
      ...r,
      buyerEmail: r.buyerEmail.charAt(0) + "***@" + r.buyerEmail.split("@")[1],
    }));
    res.json(masked);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/reviews/:productId", async (req: Request, res: Response) => {
  const { buyerEmail, rating, reviewText } = req.body;

  if (!buyerEmail || !rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Invalid review data" });
    return;
  }

  try {
    const [review] = await db.insert(reviewsTable).values({
      id: randomUUID(),
      productId: req.params.productId,
      buyerEmail,
      rating,
      reviewText: reviewText || null,
      isVerifiedPurchase: false,
    }).returning();

    res.status(201).json(review);
  } catch (err) {
    req.log.error({ err }, "Failed to create review");
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;
