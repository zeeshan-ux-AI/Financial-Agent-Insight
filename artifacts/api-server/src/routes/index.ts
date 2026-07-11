import { Router, type IRouter } from "express";
import healthRouter from "./health";
import providersRouter from "./providers";
import transactionsRouter from "./transactions";
import alertsRouter from "./alerts";
import auditRouter from "./audit";
import dashboardRouter from "./dashboard";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(providersRouter);
router.use(transactionsRouter);
router.use(alertsRouter);
router.use(auditRouter);
router.use(dashboardRouter);
router.use(seedRouter);

export default router;
