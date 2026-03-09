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
                s.id,
                s.content_id,
                c.title AS content_title,
                s.status,
                s.created_at,
                s.updated_at
            FROM sessions s
            JOIN content c ON c.id = s.content_id
            ORDER BY s.created_at DESC
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
                    status
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
                WITH inserted AS (
                    INSERT INTO sessions (content_id)
                    VALUES ($1)
                    RETURNING id, content_id, status, created_at, updated_at
                )
                SELECT 
                    i.id,
                    i.content_id,
                    c.title AS content_title,
                    i.status,
                    i.created_at,
                    i.updated_at
                FROM inserted i
                JOIN content c ON c.id = i.content_id
            `;
            
            const result = await pool.query(query, [contentId]);
            return result.rows[0];
        } catch (error) {
            logger.error("Error creating session", { error });
            throw error;
        }
    }

    /**
     * Update a session
     */
    async updateSession(id: string, status: string): Promise<Session> {
        try {
            const query = `
                UPDATE sessions
                SET status = $2,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, content_id, status, created_at, updated_at
            `;
            
            const result = await pool.query(query, [id, status]);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error updating session ${id}`, { error });
            throw error;
        }
    }
}
