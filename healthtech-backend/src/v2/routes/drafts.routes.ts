import { Router } from "express";
import multer from "multer";

import { VOICE_TO_TEXT_CONFIG } from "../../voice-to-text/config/voice-to-text.config";
import { AgentController } from "../db/agent.controller";

const router = Router();
const controller = new AgentController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: VOICE_TO_TEXT_CONFIG.maxFileSize,
  },
});

router.post("/prepare-draft", (req, res) => controller.prepareDraft(req, res));

router.get("/drafts/:sessionId", (req, res) =>
  controller.getDraft(req, res),
);

router.post("/drafts/:sessionId/commit", (req, res) =>
  controller.commit(req, res),
);

router.post("/drafts/:sessionId/rollback", (req, res) =>
  controller.rollback(req, res),
);

router.post("/drafts/:sessionId/checkout", (req, res) =>
  controller.checkout(req, res),
);

router.get("/drafts/:sessionId/history", (req, res) =>
  controller.history(req, res),
);

router.get("/drafts/:sessionId/versions/:version", (req, res) =>
  controller.getVersionSnapshot(req, res),
);

router.post("/invoke", (req, res) => controller.invoke(req, res));

router.post("/voice-command", upload.single("audio"), (req, res) =>
  controller.processVoiceCommand(req, res),
);

router.post("/drafts/:sessionId/discard", (req, res) =>
  controller.discard(req, res),
);

router.post("/drafts/:sessionId/save-inline", (req, res) =>
  controller.saveInline(req, res),
);

router.post("/drafts/:sessionId/sign", (req, res) =>
  controller.signDraft(req, res),
);

export default router;
