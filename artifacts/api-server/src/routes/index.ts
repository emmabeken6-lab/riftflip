import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botRouter from "./bot";
import authRouter from "./auth";
import fairnessRouter from "./fairness";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(authRouter);
router.use(fairnessRouter);
router.use(paymentsRouter);
router.use(healthRouter);
router.use(botRouter);

export default router;
