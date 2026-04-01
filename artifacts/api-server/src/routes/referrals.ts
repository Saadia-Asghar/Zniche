import { Router, type IRouter, type Request, type Response } from "express";
import { db, referralsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/referral/:userId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { userId } = req.params;
  try {
    const referrals = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referrerUserId, userId));
    const [totals] = await db
      .select({ total: sql<number>`sum(total_earned_usd)` })
      .from(referralsTable)
      .where(eq(referralsTable.referrerUserId, userId));
    res.json({ referrals, totalEarned: totals?.total || 0 });
  } catch (err) {
    req.log.error({ err }, "referral stats error");
    res.json({ referrals: [], totalEarned: 0 });
  }
});

router.post("/referral/track", async (req: Request, res: Response) => {
  const { referrerId, referredId } = req.body;
  if (!referrerId || !referredId) { res.status(400).json({ error: "Missing fields" }); return; }
  try {
    await db.insert(referralsTable).values({
      id: crypto.randomUUID(),
      referrerUserId: referrerId,
      referredUserId: referredId,
    }).onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "referral track error");
    res.status(500).json({ error: "Failed to track referral" });
  }
});

export default router;
