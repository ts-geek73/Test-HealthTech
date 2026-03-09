import { Router } from "express";
import { SessionController } from "../db/session.controller";

const router = Router();
const controller = new SessionController();

router.get("/", (req, res) => controller.getAllSessions(req, res));
router.get("/:id", (req, res) => controller.getSessionById(req, res));
router.post("/", (req, res) => controller.createSession(req, res));
router.patch("/:id", (req, res) => controller.updateSession(req, res));

export default router;
