import { Router, type IRouter, type Request, type Response } from "express";
import { db, waitlistTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/waitlist/join", async (req: Request, res: Response) => {
  const { productId, email, countryCode } = req.body;
  if (!productId || !email) { res.status(400).json({ error: "Missing fields" }); return; }
  try {
    await db.insert(waitlistTable).values({
      id: crypto.randomUUID(),
      productId,
      email,
      countryCode: countryCode || null,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "waitlist join error");
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

router.post("/waitlist/launch", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { productId } = req.body;
  if (!productId) { res.status(400).json({ error: "Missing productId" }); return; }
  try {
    const entries = await db.select().from(waitlistTable).where(eq(waitlistTable.productId, productId));
    await db.update(productsTable)
      .set({ waitlistMode: false, updatedAt: new Date() })
      .where(eq(productsTable.id, productId));
    res.json({ ok: true, notified: entries.length });
  } catch (err) {
    req.log.error({ err }, "waitlist launch error");
    res.status(500).json({ error: "Failed to launch" });
  }
});

router.get("/waitlist/:productId/count", async (req: Request, res: Response) => {
  const { productId } = req.params;
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(waitlistTable)
      .where(eq(waitlistTable.productId, productId));
    res.json({ count: Number(result?.count || 0) });
  } catch { res.json({ count: 0 }); }
});

export default router;
