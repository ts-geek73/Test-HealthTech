export const up = (pgm) => {
    pgm.sql(`
        CREATE TYPE session_status AS ENUM ('active', 'complete');
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status session_status NOT NULL DEFAULT 'active';
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE sessions DROP COLUMN IF EXISTS status;
        DROP TYPE IF EXISTS session_status;
    `);
};
