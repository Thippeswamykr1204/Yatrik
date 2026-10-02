import { Router } from "express";
import authRoutes from "./auth.routes.js";
import tripsRoutes from "./trips.routes.js";
import aiRoutes from "./ai.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/trips", tripsRoutes);
router.use("/ai", aiRoutes);

export default router;
