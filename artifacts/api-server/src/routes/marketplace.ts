import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/marketplace", async (req: Request, res: Response) => {
  try {
    const { category, sort } = req.query;
    const conditions = [
      eq(productsTable.marketplaceListed, true),
      eq(productsTable.status, "completed"),
    ];
    if (category && typeof category === "string") {
      conditions.push(eq(productsTable.category, category));
    }

    let orderBy;
    if (sort === "price_asc") {
      orderBy = asc(sql`CAST(${productsTable.price} AS numeric)`);
    } else if (sort === "price_desc") {
      orderBy = desc(sql`CAST(${productsTable.price} AS numeric)`);
    } else {
      orderBy = desc(productsTable.createdAt);
    }

    const listings = await db
      .select({
        id: productsTable.id,
        productName: productsTable.productName,
        category: productsTable.category,
        price: productsTable.price,
        creatorFirstName: productsTable.creatorFirstName,
        stripeCheckoutUrl: productsTable.stripeCheckoutUrl,
        productDescription: productsTable.productDescription,
        headline: productsTable.headline,
        productFormat: productsTable.productFormat,
        isFeatured: productsTable.isFeatured,
        viewCount: productsTable.viewCount,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .where(and(...conditions))
      .orderBy(orderBy);

    res.json(listings);
  } catch (err) {
    req.log.error({ err }, "Failed to get marketplace");
    res.status(500).json({ error: "Failed to get marketplace" });
  }
});

router.get("/marketplace/stats", async (req: Request, res: Response) => {
  try {
    const [stats] = await db
      .select({
        totalProducts: sql<number>`count(*)::int`,
        totalCreators: sql<number>`count(distinct ${productsTable.userId})::int`,
        avgPrice: sql<number>`avg(CAST(${productsTable.price} AS numeric))`,
      })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.marketplaceListed, true),
          eq(productsTable.status, "completed"),
        ),
      );

    const categoryRows = await db
      .select({
        category: productsTable.category,
        count: sql<number>`count(*)::int`,
      })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.marketplaceListed, true),
          eq(productsTable.status, "completed"),
        ),
      )
      .groupBy(productsTable.category)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    res.json({
      totalProducts: stats?.totalProducts ?? 0,
      totalCreators: stats?.totalCreators ?? 0,
      avgPrice: stats?.avgPrice ?? 0,
      topCategories: categoryRows
        .filter((r) => r.category)
        .map((r) => ({ category: r.category!, count: r.count })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get marketplace stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
