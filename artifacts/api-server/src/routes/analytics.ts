import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable, pageViewsTable, buyerEmailsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

const ratesCache: { data: Record<string, number>; ts: number } = { data: {}, ts: 0 };

router.get("/currency/:from/:to", async (req: Request, res: Response) => {
  const { from, to } = req.params;
  const cacheAge = Date.now() - ratesCache.ts;
  if (cacheAge < 3600000 && ratesCache.data[`${from}_${to}`]) {
    res.json({ rate: ratesCache.data[`${from}_${to}`] });
    return;
  }
  try {
    const resp = await fetch(`https://api.frankfurter.dev/v2/latest?base=${from}&symbols=${to}`);
    const data = await resp.json() as { rates: Record<string, number> };
    const rate = data.rates?.[to] || 1;
    ratesCache.data[`${from}_${to}`] = rate;
    ratesCache.ts = Date.now();
    res.json({ rate });
  } catch {
    res.json({ rate: 1 });
  }
});

router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const results = await db
      .select({
        userId: productsTable.userId,
        creatorFirstName: productsTable.creatorFirstName,
        creatorCountry: productsTable.creatorCountry,
        totalRevenue: sql<number>`sum(${productsTable.totalRevenue})`,
        productCount: sql<number>`count(*)`,
      })
      .from(productsTable)
      .where(eq(productsTable.marketplaceListed, true))
      .groupBy(productsTable.userId, productsTable.creatorFirstName, productsTable.creatorCountry)
      .orderBy(desc(sql`sum(${productsTable.totalRevenue})`))
      .limit(10);
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "leaderboard error");
    res.json([]);
  }
});

router.get("/marketplace/countries", async (req: Request, res: Response) => {
  try {
    const results = await db
      .select({
        countryCode: productsTable.creatorCountry,
        count: sql<number>`count(*)`,
      })
      .from(productsTable)
      .where(eq(productsTable.marketplaceListed, true))
      .groupBy(productsTable.creatorCountry)
      .orderBy(desc(sql`count(*)`));
    res.json(results.filter(r => r.countryCode));
  } catch (err) {
    req.log.error({ err }, "marketplace countries error");
    res.json([]);
  }
});

router.get("/analytics/world-map", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.user as any)?.id;
  try {
    const products = await db
      .select({ id: productsTable.id, buyerCountries: productsTable.buyerCountries })
      .from(productsTable)
      .where(eq(productsTable.userId, userId));

    const countryMap: Record<string, number> = {};
    for (const p of products) {
      const countries = (p.buyerCountries as string[]) || [];
      for (const cc of countries) {
        countryMap[cc] = (countryMap[cc] || 0) + 1;
      }
    }
    res.json(countryMap);
  } catch (err) {
    req.log.error({ err }, "world-map error");
    res.json({});
  }
});

router.post("/page-view", async (req: Request, res: Response) => {
  const { productId, countryCode, countryName, city, lat, lng } = req.body;
  if (!productId) { res.status(400).json({ error: "Missing productId" }); return; }
  try {
    await db.insert(pageViewsTable).values({
      id: crypto.randomUUID(),
      productId,
      countryCode,
      countryName,
      city,
      lat,
      lng,
    });
    await db
      .update(productsTable)
      .set({ viewCount: sql`${productsTable.viewCount} + 1`, updatedAt: new Date() })
      .where(eq(productsTable.id, productId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "page-view error");
    res.json({ ok: false });
  }
});

export default router;
