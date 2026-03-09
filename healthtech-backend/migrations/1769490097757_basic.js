/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS vector`);
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  pgm.createTable("content", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: {
      type: "varchar",
      notNull: true,
    },
    description: {
      type: "varchar",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createTable("content_sections", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    content_id: {
      type: "uuid",
      notNull: true,
      references: "content",
      onDelete: "CASCADE",
    },
    position: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    title: {
      type: "varchar",
      notNull: true,
    },
    content: {
      type: "text",
      notNull: true,
    },
    embedding: {
      type: "vector(1024)",
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    content_id: {
      type: "uuid",
      notNull: true,
      references: "content",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createTable("patients", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    patient_id: {
      type: "varchar",
      notNull: true,
    },
    account_number: {
      type: "varchar",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("patients", "patients_patient_account_unique", {
    unique: ["patient_id", "account_number"],
  });
  pgm.createIndex("patients", ["patient_id"]);
  pgm.createIndex("patients", ["account_number"]);

  pgm.createTable("drafts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    session_id: {
      type: "uuid",
      notNull: true,
      references: "sessions",
      onDelete: "CASCADE",
    },
    created_by: {
      type: "varchar",
      notNull: true,
    },
    current_version: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    next_version: {
      type: "integer",
      notNull: true,
      default: 1,
    },
    is_signed: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    signed_at: {
      type: "timestamptz",
      default: null,
    },
    signed_by: {
      type: "varchar",
      default: null,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("drafts", "drafts_session_id_unique", {
    unique: ["session_id"],
  });
  pgm.createIndex("drafts", ["session_id"]);

  pgm.createTable("sections", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    draft_id: {
      type: "uuid",
      notNull: true,
      references: "drafts",
      onDelete: "CASCADE",
    },
    position: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    title: {
      type: "varchar",
      notNull: true,
    },
    content: {
      type: "text",
      notNull: true,
    },
    embedding: {
      type: "vector(1024)",
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("sections", ["draft_id"]);
  pgm.createIndex("sections", ["draft_id", "position"]);

  pgm.createTable("draft_versions", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    draft_id: {
      type: "uuid",
      notNull: true,
      references: "drafts",
      onDelete: "CASCADE",
    },
    version: {
      type: "integer",
      notNull: true,
    },
    created_by: {
      type: "varchar",
      notNull: true,
    },
    is_rollback: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("draft_versions", "draft_versions_unique", {
    unique: ["draft_id", "version"],
  });

  pgm.createTable("version_sections", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    version_id: {
      type: "integer",
      notNull: true,
      references: "draft_versions",
      onDelete: "CASCADE",
    },
    section_id: {
      type: "uuid",
      notNull: true,
      references: "sections",
      onDelete: "CASCADE",
    },
    position: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    title: {
      type: "varchar",
      notNull: true,
    },
    content: {
      type: "text",
      notNull: true,
    },
    embedding: {
      type: "vector(1024)",
    },
  });

  pgm.createIndex("version_sections", ["version_id"]);
  pgm.addConstraint(
    "version_sections",
    "version_sections_version_section_unique",
    { unique: ["version_id", "section_id"] },
  );

  pgm.createTable("draft_references", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    reference_id: {
      type: "text",
      notNull: true,
    },
    draft_id: {
      type: "uuid",
      notNull: true,
      references: "drafts",
      onDelete: "CASCADE",
    },
    url: {
      type: "text",
      notNull: true,
    },
    raw: {
      type: "text",
    },
    content: {
      type: "text",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("draft_references", ["draft_id"]);
  pgm.createIndex("draft_references", ["reference_id"]);
  pgm.addConstraint(
    "draft_references",
    "draft_references_draft_reference_unique",
    { unique: ["draft_id", "reference_id"] },
  );

  pgm.createTable("section_reference_map", {
    section_id: {
      type: "uuid",
      notNull: true,
      references: "sections",
      onDelete: "CASCADE",
    },
    reference_id: {
      type: "uuid",
      notNull: true,
      references: "draft_references",
      onDelete: "CASCADE",
    },
  });

  pgm.createIndex("section_reference_map", ["reference_id"]);
  pgm.addConstraint("section_reference_map", "section_reference_map_pk", {
    primaryKey: ["section_id", "reference_id"],
  });

  pgm.createTable("draft_editors", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    draft_id: {
      type: "uuid",
      notNull: true,
      references: "drafts",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "varchar",
      notNull: true,
    },
    user_display_name: {
      type: "varchar",
      default: null,
    },
    action: {
      type: "varchar(20)",
      notNull: true,
    },
    version_at_action: {
      type: "integer",
      default: null,
    },
    metadata: {
      type: "jsonb",
      default: null,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("draft_editors", ["draft_id"]);
  pgm.createIndex("draft_editors", ["user_id"]);
  pgm.createIndex("draft_editors", ["action"]);
  pgm.createIndex("draft_editors", ["created_at"]);

  pgm.createTable("draft_signoffs", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    draft_id: {
      type: "uuid",
      notNull: true,
      references: "drafts",
      onDelete: "CASCADE",
    },
    signed_by: {
      type: "varchar",
      notNull: true,
    },
    signed_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    signature_image_path: {
      type: "text",
      notNull: true,
    },
    signed_doc_path: {
      type: "text",
      default: null,
    },
    signed_version: {
      type: "integer",
      notNull: true,
    },
    timezone_offset: {
      type: "text",
      default: null,
    },
    revoked_at: {
      type: "timestamptz",
      default: null,
    },
    revoked_by: {
      type: "varchar",
      default: null,
    },
    revocation_reason: {
      type: "text",
      default: null,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("draft_signoffs", "draft_signoffs_draft_id_unique", {
    unique: ["draft_id"],
  });
  pgm.createIndex("draft_signoffs", ["draft_id"]);
  pgm.createIndex("draft_signoffs", ["signed_by"]);
  pgm.createIndex("draft_signoffs", ["signed_at"]);

  pgm.sql(`
    CREATE INDEX sections_fts_idx
    ON sections
    USING GIN (to_tsvector('english', title || ' ' || content))
  `);

  pgm.sql(`
    CREATE INDEX sections_embedding_idx
    ON sections
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
  `);
};

export const down = (pgm) => {
  pgm.dropTable("draft_signoffs");
  pgm.dropTable("draft_editors");
  pgm.dropTable("section_reference_map");
  pgm.dropTable("draft_references");
  pgm.dropTable("version_sections");
  pgm.dropTable("draft_versions");
  pgm.dropTable("sections");
  pgm.dropTable("drafts");
  pgm.dropTable("patients");
  pgm.dropTable("content");
  pgm.dropTable("content_sections");
  pgm.dropTable("sessions");

  pgm.sql(`DROP EXTENSION IF EXISTS vector`);
  pgm.sql(`DROP EXTENSION IF EXISTS pgcrypto`);
};
