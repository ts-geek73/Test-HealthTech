import { Router } from "express";
import { ContentController } from "../db/content.controller";

const router = Router();
const controller = new ContentController();

router.get("/", (req, res) => controller.getAllContent(req, res));
router.get("/:id", (req, res) => controller.getContentById(req, res));

export default router;
