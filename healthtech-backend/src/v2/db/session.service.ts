import pool from "../../db";
import { Session } from "./session.entity";
import logger from "../../logger";

export class SessionService {
    /**
     * Get all sessions
     */
    async getAllSessions(): Promise<Session[]> {
        try {
            const query = `
                SELECT 
                    id, 
                    content_id, 
                    created_at, 
                    updated_at
                FROM sessions
                ORDER BY created_at DESC
            `;
            
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            logger.error("Error fetching all sessions", { error });
            throw error;
        }
    }

    /**
     * Get session by ID with its content sections
     */
    async getSessionById(id: string): Promise<Session | null> {
        try {
            // Step 1: Get the session
            const sessionQuery = `
                SELECT 
                    id, 
                    content_id, 
                    created_at, 
                    updated_at
                FROM sessions
                WHERE id = $1
            `;
            
            const sessionResult = await pool.query(sessionQuery, [id]);
            const session = sessionResult.rows[0];
            
            if (!session) return null;

            // Step 2: Get the related content sections ordered by position
            const sectionsQuery = `
                SELECT 
                    id,
                    content_id,
                    position,
                    title,
                    content,
                    updated_at
                FROM content_sections
                WHERE content_id = $1
                ORDER BY position ASC
            `;

            const sectionsResult = await pool.query(sectionsQuery, [session.content_id]);
            
            // Attach sections to the returned object
            return {
                ...session,
                sections: sectionsResult.rows
            };
        } catch (error) {
            logger.error(`Error fetching session ${id}`, { error });
            throw error;
        }
    }

    /**
     * Create a new session
     */
    async createSession(contentId: string): Promise<Session> {
        try {
            const query = `
                INSERT INTO sessions (content_id)
                VALUES ($1)
                RETURNING id, content_id, created_at, updated_at
            `;
            
            const result = await pool.query(query, [contentId]);
            return result.rows[0];
        } catch (error) {
            logger.error("Error creating session", { error });
            throw error;
        }
    }
}
