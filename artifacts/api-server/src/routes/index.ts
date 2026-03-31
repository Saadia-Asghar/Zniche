import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import marketplaceRouter from "./marketplace";
import stripeRouter from "./stripe";
import aiRouter from "./ai";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(marketplaceRouter);
router.use(stripeRouter);
router.use(aiRouter);
router.use(reviewsRouter);

export default router;
