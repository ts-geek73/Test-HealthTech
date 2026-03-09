import { Request, Response } from "express";
import { ContentService } from "./content.service";
import logger from "../../logger";

export class ContentController {
    private contentService: ContentService;

    constructor() {
        this.contentService = new ContentService();
    }

    /**
     * Get all content
     * GET /api/v2/contents
     */
    async getAllContent(req: Request, res: Response) {
        try {
            const contents = await this.contentService.getAllContent();
            return res.json({ success: true, data: contents });
        } catch (error: any) {
            logger.error("ContentController.getAllContent error", { error: error.message });
            return res.status(500).json({ success: false, error: "Failed to fetch content" });
        }
    }

    /**
     * Get a single content record by id
     * GET /api/v2/contents/:id
     */
    async getContentById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const content = await this.contentService.getContentById(id as string);
            
            if (!content) {
                return res.status(404).json({ success: false, error: "Content not found" });
            }

            return res.json({ success: true, data: content });
        } catch (error: any) {
            logger.error("ContentController.getContentById error", { error: error.message, contentId: req.params.id });
            return res.status(500).json({ success: false, error: "Failed to fetch content" });
        }
    }
}
