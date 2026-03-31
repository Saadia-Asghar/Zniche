import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/products", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.userId, req.user.id))
      .orderBy(productsTable.createdAt);
    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Failed to get products");
    res.status(500).json({ error: "Failed to get products" });
  }
});

router.post("/products", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { skill, hoursPerWeek, price } = req.body;
  if (!skill || !hoursPerWeek || !price) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const id = randomUUID();
    const [product] = await db
      .insert(productsTable)
      .values({
        id,
        userId: req.user.id,
        skill,
        hoursPerWeek: parseInt(hoursPerWeek),
        price: price.toString(),
        status: "building",
        creatorFirstName: req.user.firstName,
      })
      .returning();
    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.get("/products/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    res.status(500).json({ error: "Failed to get product" });
  }
});

router.patch("/products/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  try {
    const [existing] = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.userId, req.user.id)));
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    const allowed = [
      "productName",
      "productDescription",
      "productFormat",
      "category",
      "headline",
      "salesCopy",
      "socialCaptions",
      "stripeCheckoutUrl",
      "stripeProductId",
      "marketplaceListed",
      "status",
      "marketResearch",
    ];
    for (const key of allowed) {
      if (key in req.body) {
        updateFields[key] = req.body[key];
      }
    }
    const [updated] = await db
      .update(productsTable)
      .set(updateFields)
      .where(eq(productsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  try {
    await db
      .delete(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.userId, req.user.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
