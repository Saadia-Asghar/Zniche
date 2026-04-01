import { Router, type IRouter, type Request, type Response } from "express";
import { db, buyerEmailsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audience/:productId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { productId } = req.params;
  try {
    const buyers = await db
      .select({ id: buyerEmailsTable.id, email: buyerEmailsTable.email, firstName: buyerEmailsTable.firstName, countryCode: buyerEmailsTable.countryCode, purchaseDate: buyerEmailsTable.purchaseDate })
      .from(buyerEmailsTable)
      .where(eq(buyerEmailsTable.productId, productId));
    res.json(buyers);
  } catch (err) {
    req.log.error({ err }, "audience get error");
    res.json([]);
  }
});

router.post("/audience/send-email", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { productId, subject, body } = req.body;
  if (!productId || !subject || !body) { res.status(400).json({ error: "Missing fields" }); return; }
  try {
    const buyers = await db.select().from(buyerEmailsTable).where(eq(buyerEmailsTable.productId, productId));
    res.json({ ok: true, sent: buyers.length, message: `Would send to ${buyers.length} buyers (Resend not configured)` });
  } catch (err) {
    req.log.error({ err }, "send email error");
    res.status(500).json({ error: "Failed to send emails" });
  }
});

export default router;
