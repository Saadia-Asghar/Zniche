import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable, usersTable, reviewsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ─── Public Creator Profile ─────────────────────────────────────────────

router.get("/creator/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    // Get user info
    const [user] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "Creator not found" });
      return;
    }

    // Get their listed products
    const products = await db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.userId, userId),
          eq(productsTable.marketplaceListed, true)
        )
      )
      .orderBy(desc(productsTable.createdAt));

    // Aggregate stats
    const [stats] = await db
      .select({
        totalProducts: sql<number>`count(*)`,
        totalSales: sql<number>`coalesce(sum(${productsTable.totalSales}), 0)`,
        totalRevenue: sql<number>`coalesce(sum(${productsTable.totalRevenue}), 0)`,
        totalViews: sql<number>`coalesce(sum(${productsTable.viewCount}), 0)`,
      })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.userId, userId),
          eq(productsTable.marketplaceListed, true)
        )
      );

    // Check if any product is verified
    const isVerified = products.some(p => p.isVerifiedCreator);

    res.json({
      creator: {
        ...user,
        isVerified,
      },
      products,
      stats: {
        totalProducts: stats?.totalProducts || 0,
        totalSales: stats?.totalSales || 0,
        totalViews: stats?.totalViews || 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get creator profile");
    res.status(500).json({ error: "Failed to get creator profile" });
  }
});

export default router;
