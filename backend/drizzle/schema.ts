import { pgTable, uuid, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const sessionStatus = pgEnum("session_status", ['active', 'complete'])


export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	status: sessionStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	pid: varchar({ length: 50 }).notNull(),
});
