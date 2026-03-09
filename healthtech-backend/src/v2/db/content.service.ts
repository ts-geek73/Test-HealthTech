import pool from "../../db";
import logger from "../../logger";

export interface Content {
    id: string;
    title: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export class ContentService {
    /**
     * Get all content records
     */
    async getAllContent(): Promise<Content[]> {
        try {
            const query = `
                SELECT 
                    id, 
                    title, 
                    description, 
                    created_at, 
                    updated_at
                FROM content
                ORDER BY created_at DESC
            `;
            
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            logger.error("Error fetching all content", { error });
            throw error;
        }
    }

    /**
     * Get content by ID
     */
    async getContentById(id: string): Promise<Content | null> {
        try {
            const query = `
                SELECT 
                    id, 
                    title, 
                    description, 
                    created_at, 
                    updated_at
                FROM content
                WHERE id = $1
            `;
            
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error(`Error fetching content ${id}`, { error });
            throw error;
        }
    }
}
