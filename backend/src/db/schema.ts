import { pgTable, uuid, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("session_status", ["active", "complete"]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  pid: varchar("pid", { length: 50 }).notNull(),
  status: statusEnum("status").default("active").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
