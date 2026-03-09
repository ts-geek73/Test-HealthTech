-- Create session_status enum
DO $$ BEGIN
 CREATE TYPE "session_status" AS ENUM('active', 'complete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pid" varchar(50) NOT NULL,
  "status" "session_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
