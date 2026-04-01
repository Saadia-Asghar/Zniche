import { Router, type IRouter, type Request, type Response } from "express";
import { db, couponsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.post("/coupons/create", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { productId, code, discountType, discountValue, maxUses, expiresAt } = req.body;
  if (!productId || !code || !discountValue) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  try {
    const coupon = await db.insert(couponsTable).values({
      id: crypto.randomUUID(),
      productId,
      code: code.toUpperCase(),
      discountType: discountType || "percent",
      discountValue: discountValue.toString(),
      maxUses: maxUses || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    }).returning();
    res.json(coupon[0]);
  } catch (err) {
    req.log.error({ err }, "create coupon error");
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

router.post("/coupons/apply", async (req: Request, res: Response) => {
  const { productId, code } = req.body;
  if (!productId || !code) { res.status(400).json({ error: "Missing fields" }); return; }
  try {
    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(and(
        eq(couponsTable.productId, productId),
        eq(couponsTable.code, code.toUpperCase()),
        eq(couponsTable.isActive, true)
      ))
      .limit(1);

    if (!coupon) { res.json({ valid: false, message: "Coupon not found" }); return; }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.json({ valid: false, message: "Coupon expired" }); return;
    }
    if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
      res.json({ valid: false, message: "Coupon fully used" }); return;
    }

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) { res.json({ valid: false, message: "Product not found" }); return; }

    const originalPrice = parseFloat(product.price as string);
    let discountAmount = 0;
    if (coupon.discountType === "percent") {
      discountAmount = originalPrice * (parseFloat(coupon.discountValue as string) / 100);
    } else {
      discountAmount = parseFloat(coupon.discountValue as string);
    }
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    res.json({ valid: true, discountAmount: discountAmount.toFixed(2), finalPrice: finalPrice.toFixed(2), couponId: coupon.id });
  } catch (err) {
    req.log.error({ err }, "apply coupon error");
    res.status(500).json({ error: "Failed to apply coupon" });
  }
});

router.get("/coupons/:productId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { productId } = req.params;
  try {
    const coupons = await db.select().from(couponsTable).where(eq(couponsTable.productId, productId));
    res.json(coupons);
  } catch (err) {
    req.log.error({ err }, "get coupons error");
    res.json([]);
  }
});

export default router;
