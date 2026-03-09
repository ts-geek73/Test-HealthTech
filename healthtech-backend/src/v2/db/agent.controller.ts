import { Request, Response } from "express";
import { z } from "zod";

import logger from "../../logger";
import { TranscriptionServiceFactory } from "../../voice-to-text/factories/transcription-service.factory";
import { AgentService, AgentIdentity } from "./agent.service";
import { dischargeSummaryService } from "./discharge-summary.service";
import { draftServiceProvider } from "./draft-service.provider";
import { DraftService } from "./draft.service";
import { saveSignature } from "./saveSignatures";

const PrepareSchema = z.object({
  sessionId: z.string().min(1),
  contentId: z.string().optional(),
});

const CommitSchema = z.object({
  createdBy: z.string().min(1),
});

const VersionSchema = z.object({
  targetVersion: z.string().regex(/^v\d+$/),
  createdBy: z.string().min(1),
});

export class AgentController {
  private agentService: AgentService;
  private draftService: DraftService;
  constructor() {
    this.draftService = draftServiceProvider.get();
    this.agentService = new AgentService();
  }

  async prepareDraft(req: Request, res: Response) {
    try {
      const parsed = PrepareSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.errors,
        });
      }

      const { sessionId } = parsed.data;
      const userId = (req as any).user?.id || "anonymous";

      // 1. Check if draft already exists for this session
      const existing = await this.draftService.getDraft(sessionId);
      if (existing?.id) {
        return res.json({
          success: true,
          data: existing!.toJSON(),
        });
      }

      // 2. Fetch the session and its sections
      const sessionService = new (require("./session.service").SessionService)();
      const session = await sessionService.getSessionById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      // 3. Prepare the sections for the draft
      // We convert content_sections to the format prepareDraft expects: Record<string, string>
      const draftSections: Record<string, string> = {};
      session.sections.forEach((s: any) => {
        draftSections[s.title] = s.content;
      });

      logger.info("Creating draft from session sections", {
        sessionId,
        sectionCount: session.sections.length,
      });

      // 4. Create the draft
      const draft = await this.draftService.prepareDraft({
        sessionId,
        createdBy: userId,
        draft: draftSections,
        // No references for now unless we add them to content_sections
      });

      logger.info("Draft created successfully", {
        sessionId,
        draftId: draft.id,
      });

      return res.json({
        success: true,
        data: {
          ...draft.toJSON(),
          // metadata: prepared.metadata,
        },
      });
    } catch (e: any) {
      logger.error("prepareDraft failed", {
        error: e.message,
        stack: e.stack,
        body: req.body,
      });

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async saveInline(req: Request, res: Response) {
    try {
      const { sessionId, sections } = req.body;

      const createdBy = (req as any).user?.id || "anonymous";

      if (!sessionId) {
        return res.status(400).json({
          message: "sessionId is required",
        });
      }

      if (!Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
          message: "sections must be a non-empty array",
        });
      }

      for (const s of sections) {
        if (!s.id || !s.title || typeof s.content !== "string") {
          return res.status(400).json({
            message: "Each section must have id, title and content",
          });
        }
      }

      const draft = await this.draftService.saveInlineVersion({
        sessionId,
        createdBy,
        sections,
      });

      return res.status(200).json({
        message: "Version saved successfully",
        draft: draft.toJSON(),
      });
    } catch (error) {
      logger.error("Error in saveInlineVersionController", {
        body: req.body,
        error,
      });

      return res.status(500).json({
        message: "Failed to save inline version",
      });
    }
  }
  async getDraft(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const draft = await this.draftService.getDraft(
        sessionId as string,
      );

      if (!draft) {
        return res.status(404).json({
          success: false,
          error: "Draft not found",
        });
      }

      return res.json({
        success: true,
        data: draft.toJSON(),
      });
    } catch (e: any) {
      logger.error("getDraft", e);

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async commit(req: Request, res: Response) {
    try {
      const parsed = CommitSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.errors,
        });
      }

      const { sessionId } = req.params;

      const version = await this.draftService.commitDraft({
        sessionId: sessionId as string,
        createdBy: parsed.data.createdBy,
      });

      return res.json({
        success: true,
        data: { version },
      });
    } catch (e: any) {
      logger.error("commit", e);

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async rollback(req: Request, res: Response) {
    try {
      const parsed = VersionSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.errors,
        });
      }

      const { sessionId } = req.params;

      const ok = await this.draftService.rollback({
        sessionId: sessionId as string,
        targetVersion: parsed.data.targetVersion,
        createdBy: parsed.data.createdBy,
      });

      if (!ok) {
        return res.status(404).json({
          success: false,
          error: "Version not found",
        });
      }

      return res.json({ success: true });
    } catch (e: any) {
      logger.error("rollback", e);

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async checkout(req: Request, res: Response) {
    try {
      const parsed = VersionSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.errors,
        });
      }

      const { sessionId } = req.params;

      const ok = await this.draftService.getSnapshotByVersion({
        sessionId: sessionId as string,
        version: 2, // Hardcoded version logic? Likely should be from params
      });

      if (!ok) {
        return res.status(404).json({
          success: false,
          error: "Version not found",
        });
      }

      return res.json({ success: true });
    } catch (e: any) {
      logger.error("checkout", e);

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async history(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const history = await this.draftService.getHistory(
        sessionId as string,
      );

      if (!history) {
        return res.status(404).json({
          success: false,
          error: "Draft not found",
        });
      }

      return res.json({
        success: true,
        data: history,
      });
    } catch (e: any) {
      logger.error("history", e);

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async getVersionSnapshot(req: Request, res: Response) {
    try {
      const { sessionId, version } = req.params;
      const versionNum = Number((version as string).replace("v", ""));

      if (Number.isNaN(versionNum)) {
        return res.status(400).json({
          success: false,
          error: "Invalid version format",
        });
      }

      const snapshot = await this.draftService.getSnapshotByVersion({
        sessionId: sessionId as string,
        version: versionNum,
      });

      if (!snapshot) {
        return res.status(404).json({
          success: false,
          error: "Version not found",
        });
      }

      return res.json({
        success: true,
        data: snapshot,
      });
    } catch (e: any) {
      logger.error("getVersionSnapshot", e);

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async invoke(req: Request, res: Response) {
    try {
      const { sessionId, sectionId, messages } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "sessionId required",
        });
      }

      const userId = (req as any).user?.id || "anonymous";

      const result = await this.agentService.invoke(messages, userId, {
        sessionId: sessionId as string,
        sectionId: sectionId as string
      } as AgentIdentity);

      return res.json({ success: true, data: result });
    } catch (e: any) {
      logger.error("invoke", e);

      return res.status(500).json({
        success: false,
        error: e.message,
      });
    }
  }

  async signDraft(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId } = req.params;
      const { signedBy, signatureImageData, timezoneOffset } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Missing sessionId parameter" });
      }

      if (!signedBy || !signatureImageData) {
        return res.status(400).json({
          message: "signedBy and signatureImageData are required",
        });
      }
      const cleanBase64 = signatureImageData.replace(
        /^data:image\/png;base64,/,
        "",
      );

      const fileName = `signature_${sessionId}_${Date.now()}.png`;

      const saved = await saveSignature({
        base64: cleanBase64,
        fileName,
      });

      const generatedPath = await this.draftService.signDraft({
        sessionId: sessionId as string,
        signedBy,
        signatureImagePath: saved.remotePath,
        timezoneOffset,
        base64: saved.base64,
      });


      return res.status(200).json({
        message: "Draft signed and document generated successfully",
        documentPath: generatedPath,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Failed to sign draft",
      });
    }
  }
  async discard(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const ok = await this.draftService.discardDraft({
        sessionId: sessionId as string,
      });

      if (!ok) {
        return res
          .status(404)
          .json({ success: false, error: "Draft not found" });
      }

      return res.json({ success: true });
    } catch (e: any) {
      logger.error("discard", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async processVoiceCommand(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || "anonymous";
      const { autoProcess } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No audio file provided",
        });
      }

      const transcriptionService = TranscriptionServiceFactory.getService();

      const transcribedText = await transcriptionService.transcribe(
        req.file.buffer,
        req.file.mimetype,
      );

      logger.info("Voice command transcribed", {
        userId,
        originalText: transcribedText,

        autoProcess,
      });

      return res.json({
        success: true,
        data: {
          transcription: transcribedText,
          autoProcessed: false,
        },
      });
    } catch (error: any) {
      logger.error("processVoiceCommand error", {
        error: error.message,
      });

      return res.status(500).json({
        success: false,
        error: "Voice command processing failed",
        message: error.message,
      });
    }
  }
}
