import { Request, Response } from "express";
import { SessionService } from "./session.service";
import logger from "../../logger";
import {
    emitSessionCreated,
    emitSessionUpdated,
    emitSessionDeleted,
} from "../../socket";

export class SessionController {
    private sessionService: SessionService;

    constructor() {
        this.sessionService = new SessionService();
    }

    /**
     * Get all sessions
     * GET /api/v2/sessions
     */
    async getAllSessions(req: Request, res: Response) {
        try {
            const sessions = await this.sessionService.getAllSessions();
            return res.json({ success: true, data: sessions });
        } catch (error: any) {
            logger.error("SessionController.getAllSessions error", { error: error.message });
            return res.status(500).json({ success: false, error: "Failed to fetch sessions" });
        }
    }

    /**
     * Get a single session by id
     * GET /api/v2/sessions/:id
     */
    async getSessionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const session = await this.sessionService.getSessionById(id as string);
            
            if (!session) {
                return res.status(404).json({ success: false, error: "Session not found" });
            }

            return res.json({ success: true, data: session });
        } catch (error: any) {
            logger.error("SessionController.getSessionById error", { error: error.message, sessionId: req.params.id });
            return res.status(500).json({ success: false, error: "Failed to fetch session" });
        }
    }

    /**
     * Create a new session
     * POST /api/v2/sessions
     */
    async createSession(req: Request, res: Response) {
        try {
            const { content_id } = req.body;
            
            if (!content_id) {
                return res.status(400).json({ success: false, error: "content id is required" });
            }

            const session = await this.sessionService.createSession(content_id);
            emitSessionCreated(session);

            return res.json({ success: true, data: session });
        } catch (error: any) {
            logger.error("SessionController.createSession error", { error: error.message });
            return res.status(500).json({ success: false, error: "Failed to create session" });
        }
    }

    /**
     * Update a session
     * PATCH /api/v2/sessions/:id
     */
    async updateSession(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status) {
                return res.status(400).json({ success: false, error: "status is required" });
            }

            const session = await this.sessionService.updateSession(id as string, status);
            emitSessionUpdated(session);

            return res.json({ success: true, data: session });
        } catch (error: any) {
            logger.error("SessionController.updateSession error", { error: error.message });
            return res.status(500).json({ success: false, error: "Failed to update session" });
        }
    }
}
