import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import marketplaceRouter from "./marketplace";
import stripeRouter from "./stripe";
import aiRouter from "./ai";
import reviewsRouter from "./reviews";
import onboardingRouter from "./onboarding";
import analyticsRouter from "./analytics";
import couponsRouter from "./coupons";
import waitlistRouter from "./waitlist";
import referralsRouter from "./referrals";
import audienceRouter from "./audience";
import purchasesRouter from "./purchases";
import creatorRouter from "./creator";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(marketplaceRouter);
router.use(stripeRouter);
router.use(aiRouter);
router.use(reviewsRouter);
router.use(onboardingRouter);
router.use(analyticsRouter);
router.use(couponsRouter);
router.use(waitlistRouter);
router.use(referralsRouter);
router.use(audienceRouter);
router.use(purchasesRouter);
router.use(creatorRouter);

export default router;
