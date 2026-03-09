import pool from "../../db";
import logger from "../../logger";

import { Reference } from "../../agents/types/draft-summary";
import { EditorAction, Signoff } from "../../types/signoff.types";
import { DraftEntity } from "./draft.entity";
import { SectionEntity } from "./section.entity";
export function sanitizeString(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\u0000/g, "");
  }
  return value;
}

export function deepSanitize<T>(obj: T): T {
  if (typeof obj === "string") {
    return obj.replace(/\u0000/g, "") as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitize) as T;
  }

  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, deepSanitize(v)]),
    ) as T;
  }

  return obj;
}

// ---------------------------------------------------------------------------
// Shared SQL fragment reused by getVersionSnapshot and overwriteWorkspaceFromVersion
// Returns section rows joined with their reference_ids for a given draft+version.
// ---------------------------------------------------------------------------
const VERSION_SNAPSHOT_SQL = `
  SELECT
    vs.section_id AS id,
    vs.title,
    vs.content,
    vs.position,  -- ✅ ADD THIS
    vs.embedding,
    COALESCE(
      array_agg(dr.reference_id)
        FILTER (WHERE dr.reference_id IS NOT NULL),
      '{}'
    ) AS reference_ids
  FROM version_sections vs
  JOIN draft_versions dv
    ON dv.id = vs.version_id
  LEFT JOIN section_reference_map sr
    ON sr.section_id = vs.section_id
  LEFT JOIN draft_references dr
    ON dr.id = sr.reference_id
  WHERE dv.draft_id = $1
    AND dv.version = $2
  GROUP BY vs.section_id, vs.title, vs.content, vs.position, vs.embedding  -- ✅ ADD position
  ORDER BY vs.position ASC  -- ✅ ORDER BY POSITION
`;
function rowsToSections(rows: any[]): SectionEntity[] {
  return rows.map(
    (r) =>
      new SectionEntity({
        id: r.id,
        title: r.title,
        content: r.content,
        position: r.position ?? 0, // ✅ ADD THIS
        referenceIds: r.reference_ids,
        embedding: r.embedding
          ? r.embedding
              .replace(/[\[\]]/g, "")
              .split(",")
              .map(Number)
          : undefined,
      }),
  );
}

export class DraftRepository {
  async findOrCreateDraft(params: {
    patientId: string; // MRN
    accountNumber: string; // Encounter
    createdBy: string;
  }): Promise<DraftEntity> {
    const patientUuid = await this.ensurePatient({
      patientId: params.patientId,
      accountNumber: params.accountNumber,
    });

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT 
        d.*,
        p.patient_id AS mrn,
        p.account_number AS encounter
       FROM drafts d
       JOIN patients p ON p.id = d.patient_id
       WHERE d.patient_id = $1
       FOR UPDATE`,
        [patientUuid],
      );

      if (existing.rows.length) {
        await client.query("COMMIT");
        const signature = await this.getSignature(existing.rows[0].id);
        const rows = {
          ...existing.rows[0],
          signature: signature?.signature ?? null,
          signed_doc_path: signature?.signedDocPath ?? null,
        };
        return this._rowToDraft(rows);
      }

      const created = await client.query(
        `INSERT INTO drafts (patient_id, created_by)
       VALUES ($1, $2)
       RETURNING *`,
        [patientUuid, params.createdBy],
      );

      const withPatient = await client.query(
        `SELECT 
        d.*,
        p.patient_id AS mrn,
        p.account_number AS encounter
       FROM drafts d
       JOIN patients p ON p.id = d.patient_id
       WHERE d.id = $1`,
        [created.rows[0].id],
      );

      await client.query("COMMIT");

      logger.info("Draft created", {
        patientId: params.patientId,
        accountNumber: params.accountNumber,
        draftId: withPatient.rows[0].id,
      });

      return this._rowToDraft(withPatient.rows[0]);
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error finding or creating draft", {
        patientId: params.patientId,
        accountNumber: params.accountNumber,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }

  async getDraftMeta(
    patientId: string,
    accountNumber: string,
  ): Promise<DraftEntity | null> {
    try {
      const { rows } = await pool.query(
        `SELECT 
        d.*,
        p.patient_id AS mrn,
        p.account_number AS encounter
       FROM drafts d
       JOIN patients p ON p.id = d.patient_id
       WHERE p.patient_id = $1 
         AND p.account_number = $2`,
        [patientId, accountNumber],
      );
      const signature = (await this.getSignature(rows[0]?.id)) ?? null;

      const rowsWithSignature = {
        ...rows[0],
        signature: signature?.signature ?? null,
        signed_doc_path: signature?.signedDocPath ?? null,
      };
      if (!rows.length) return null;

      return this._rowToDraft(rowsWithSignature);
    } catch (error) {
      logger.error("Error getting draft metadata", {
        patientId,
        accountNumber,
        error,
      });
      throw error;
    }
  }

  async getSignature(
    draftId: string,
  ): Promise<{ signature: string; signedDocPath: string } | null> {
    try {
      const { rows } = await pool.query(
        `SELECT signature_image_path,signed_doc_path FROM draft_signoffs WHERE draft_id = $1`,
        [draftId],
      );

      if (!rows.length) return null;

      return {
        signature: rows[0].signature_image_path ?? null,
        signedDocPath: rows[0].signed_doc_path ?? null,
      };
    } catch (error) {
      logger.error("Error getting signature", { draftId, error });
      throw error;
    }
  }

  async getCurrentSections(draftId: string): Promise<SectionEntity[]> {
    try {
      const { rows } = await pool.query(
        `SELECT
        s.id,
        s.title,
        s.content,
        s.position,  
        s.embedding,
        COALESCE(
          array_agg(dr.reference_id)
            FILTER (WHERE dr.reference_id IS NOT NULL),
          '{}'
        ) AS reference_ids
      FROM sections s
      LEFT JOIN section_reference_map sr
        ON sr.section_id = s.id
      LEFT JOIN draft_references dr
        ON dr.id = sr.reference_id
      WHERE s.draft_id = $1
      GROUP BY s.id, s.title, s.content, s.position, s.embedding  -- ✅ ADD position
      ORDER BY s.position ASC`,
        [draftId],
      );

      return rowsToSections(rows);
    } catch (error) {
      logger.error("Error getting current sections", { draftId, error });
      throw error;
    }
  }

  async upsertReferences(
    draftId: string,
    references: Reference[],
  ): Promise<void> {
    if (!references.length) return;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const ref of references) {
        const clean = deepSanitize(ref) as Reference;

        await client.query(
          `
          INSERT INTO draft_references
            (reference_id, draft_id, url, raw, content)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (draft_id, reference_id) DO UPDATE SET
            url = EXCLUDED.url,
            raw = EXCLUDED.raw,
            content = EXCLUDED.content
          `,
          [clean.id, draftId, clean.url, clean.raw, clean.content],
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error upserting references", {
        draftId,
        referenceCount: references.length,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }

  async getDraftReferences(draftId: string): Promise<Reference[]> {
    try {
      const { rows } = await pool.query(
        `
        SELECT reference_id, url, raw, content
        FROM draft_references
        WHERE draft_id = $1
        `,
        [draftId],
      );

      return rows.map((r) => ({
        id: r.reference_id,
        url: r.url,
        raw: r.raw,
        content: r.content,
      }));
    } catch (error) {
      logger.error("Error getting draft references", { draftId, error });
      throw error;
    }
  }
  async upsertSections(
    draftId: string,
    sections: SectionEntity[],
  ): Promise<void> {
    if (!sections.length) return;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* ================================================
       1️⃣ UPSERT SECTIONS
    ================================================ */

      for (const s of sections) {
        await client.query(
          `
        INSERT INTO sections
          (id, draft_id, title, content, position, embedding, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::vector, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          title      = EXCLUDED.title,
          content    = EXCLUDED.content,
          position   = EXCLUDED.position,
          embedding  = EXCLUDED.embedding,
          updated_at = NOW()
        `,
          [
            s.id,
            draftId,
            s.title,
            s.content,
            s.position,
            s.embedding ? `[${s.embedding.join(",")}]` : null,
          ],
        );
      }

      /* ================================================
       2️⃣ COLLECT ALL UNIQUE referenceIds (TEXT)
    ================================================ */

      const allReferenceIds = Array.from(
        new Set(sections.flatMap((s) => s.referenceIds ?? [])),
      );

      if (!allReferenceIds.length) {
        await client.query("COMMIT");
        return;
      }

      /* ================================================
       3️⃣ FETCH UUID PKs FROM draft_references
    ================================================ */

      const { rows } = await client.query(
        `
      SELECT id, reference_id
      FROM draft_references
      WHERE draft_id = $1
        AND reference_id = ANY($2::text[])
      `,
        [draftId, allReferenceIds],
      );

      const refIdToPk = new Map<string, string>(
        rows.map((r) => [r.reference_id, r.id]),
      );

      /* ================================================
       4️⃣ BUILD MAPPING PAIRS
    ================================================ */

      const mappingPairs: { sectionId: string; refPk: string }[] = [];

      for (const s of sections) {
        for (const refId of s.referenceIds ?? []) {
          const refPk = refIdToPk.get(refId);
          if (refPk) {
            mappingPairs.push({
              sectionId: s.id,
              refPk,
            });
          }
        }
      }

      /* ================================================
       5️⃣ INSERT INTO section_reference_map
    ================================================ */

      if (mappingPairs.length) {
        const sectionIds = mappingPairs.map((m) => m.sectionId);
        const refPks = mappingPairs.map((m) => m.refPk);

        await client.query(
          `
        INSERT INTO section_reference_map (section_id, reference_id)
        SELECT
          unnest($1::uuid[]),
          unnest($2::uuid[])
        ON CONFLICT (section_id, reference_id)
        DO NOTHING
        `,
          [sectionIds, refPks],
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error upserting sections", {
        draftId,
        sectionCount: sections.length,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }
  async getVersionSnapshot(
    draftId: string,
    version: number,
  ): Promise<SectionEntity[] | null> {
    try {
      const { rows } = await pool.query(VERSION_SNAPSHOT_SQL, [
        draftId,
        version,
      ]);

      if (!rows.length) return null;

      return rowsToSections(rows);
    } catch (error) {
      logger.error("Error getting version snapshot", {
        draftId,
        version,
        error,
      });
      throw error;
    }
  }

  async overwriteWorkspaceFromVersion(
    draftId: string,
    version: number,
  ): Promise<SectionEntity[] | null> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const snapshot = await client.query(VERSION_SNAPSHOT_SQL, [
        draftId,
        version,
      ]);

      if (!snapshot.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      for (const r of snapshot.rows) {
        const result = await client.query(
          `UPDATE sections
         SET
          title      = $3,
          content    = $4,
          position   = $5,  
          embedding  = $6::vector,
          updated_at = NOW()
         WHERE id = $1
          AND draft_id = $2`,
          [r.id, draftId, r.title, r.content, r.position, r.embedding],
        );

        if (result.rowCount !== 1) {
          throw new Error(
            `Invariant violation: Section ${r.id} not found in draft ${draftId}`,
          );
        }
      }

      await client.query("COMMIT");

      return rowsToSections(snapshot.rows);
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error overwriting workspace from version", {
        draftId,
        version,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }
  async createVersion(params: {
    draftId: string;
    version: number;
    createdBy: string;
    isRollback: boolean;
  }): Promise<number> {
    try {
      const { rows } = await pool.query(
        `
        INSERT INTO draft_versions
          (draft_id, version, created_by, is_rollback)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [params.draftId, params.version, params.createdBy, params.isRollback],
      );

      return rows[0].id;
    } catch (error) {
      logger.error("Error creating version", {
        draftId: params.draftId,
        version: params.version,
        error,
      });
      throw error;
    }
  }

  async saveVersionSections(
    versionId: number,
    sections: SectionEntity[],
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const s of sections) {
        await client.query(
          `INSERT INTO version_sections
          (version_id, section_id, title, content, position, embedding)  -- ✅ ADD position
         VALUES ($1, $2, $3, $4, $5, $6::vector)`,
          [
            versionId,
            s.id,
            s.title,
            s.content,
            s.position,
            s.embedding ? `[${s.embedding.join(",")}]` : null,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error saving version sections", {
        versionId,
        sectionCount: sections.length,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }

  async updateDraftMeta(
    draftId: string,
    currentVersion: number,
    nextVersion: number,
  ): Promise<void> {
    try {
      await pool.query(
        `
        UPDATE drafts
        SET current_version = $1,
            next_version    = $2,
            updated_at      = NOW()
        WHERE id = $3
        `,
        [currentVersion, nextVersion, draftId],
      );
    } catch (error) {
      logger.error("Error updating draft metadata", {
        draftId,
        currentVersion,
        nextVersion,
        error,
      });
      throw error;
    }
  }
  async updateVersionSectionEmbeddings(
    versionId: number,
    sections: SectionEntity[],
  ): Promise<void> {
    if (!sections.length) return;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const s of sections) {
        await client.query(
          `
          UPDATE version_sections
          SET embedding = $1::vector
          WHERE version_id = $2
            AND section_id = $3
          `,
          [s.embedding ? `[${s.embedding.join(",")}]` : null, versionId, s.id],
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error updating version section embeddings", {
        versionId,
        sectionCount: sections.length,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }

  async getReferencesByIds(referenceIds: string[]): Promise<Reference[]> {
    if (!referenceIds.length) return [];

    const { rows } = await pool.query(
      `
    SELECT reference_id, url, raw, content
    FROM draft_references
    WHERE reference_id = ANY($1::text[])
    `,
      [referenceIds],
    );

    return rows.map((r) => ({
      id: r.reference_id,
      url: r.url,
      raw: r.raw,
      content: r.content,
    }));
  }

  async getHistory(draftId: string) {
    try {
      const { rows } = await pool.query(
        `
        SELECT version, created_by, created_at, is_rollback
        FROM draft_versions
        WHERE draft_id = $1
        ORDER BY version ASC
        `,
        [draftId],
      );

      return rows.map(
        (h: {
          version: number;
          created_by: string;
          created_at: string;
          is_rollback: boolean;
        }) => ({
          version: `v${h.version}`,
          createdBy: h.created_by,
          timestamp: h.created_at,
          isRollback: h.is_rollback,
        }),
      );
    } catch (error) {
      logger.error("Error getting draft history", { draftId, error });
      throw error;
    }
  }

  private _rowToDraft(row: any): DraftEntity {
    return new DraftEntity({
      id: row.id,
      patientId: row.mrn,
      accountNumber: row.encounter,
      createdBy: row.created_by,
      initialSections: [],
      currentVersion: row.current_version,
      nextVersion: row.next_version,
      signature: row?.signature ?? null,
      signedDocPath: row?.signed_doc_path ?? null,
      isSigned: row.is_signed ?? false,
      signedAt: row.signed_at ? new Date(row.signed_at) : null,
      signedBy: row.signed_by ?? null,
    });
  }

  async ensurePatient(params: {
    patientId: string; // MRN
    accountNumber: string; // Encounter
  }): Promise<string> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT id FROM patients 
       WHERE patient_id = $1 AND account_number = $2
       FOR UPDATE`,
        [params.patientId, params.accountNumber],
      );

      if (existing.rows.length) {
        await client.query("COMMIT");
        logger.info("Patient record found", {
          patientId: params.patientId,
          accountNumber: params.accountNumber,
          uuid: existing.rows[0].id,
        });
        return existing.rows[0].id;
      }

      const created = await client.query(
        `INSERT INTO patients (patient_id, account_number)
       VALUES ($1, $2)
       RETURNING id`,
        [params.patientId, params.accountNumber],
      );

      await client.query("COMMIT");

      logger.info("Patient record created", {
        patientId: params.patientId,
        accountNumber: params.accountNumber,
        uuid: created.rows[0].id,
      });

      return created.rows[0].id;
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error ensuring patient", {
        patientId: params.patientId,
        accountNumber: params.accountNumber,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }

  async trackEditorAction(params: {
    draftId: string;
    userId: string;
    userDisplayName: string | null;
    action: string;
    versionAtAction: number | null;
    metadata?: any;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO draft_editors 
        (draft_id, user_id, user_display_name, action, version_at_action, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          params.draftId,
          params.userId,
          params.userDisplayName,
          params.action,
          params.versionAtAction,
          params.metadata ? JSON.stringify(params.metadata) : null,
        ],
      );

      logger.info("Editor action tracked", {
        draftId: params.draftId,
        userId: params.userId,
        action: params.action,
      });
    } catch (error) {
      logger.error("Error tracking editor action", {
        draftId: params.draftId,
        error,
      });
      throw error;
    }
  }

  async getEditorActivity(draftId: string): Promise<EditorAction[]> {
    try {
      const { rows } = await pool.query(
        `SELECT 
        id, 
        draft_id, 
        user_id, 
        user_display_name,
        action, 
        version_at_action, 
        metadata, 
        created_at
       FROM draft_editors
       WHERE draft_id = $1
       ORDER BY created_at DESC`,
        [draftId],
      );

      return rows.map((row) => ({
        id: row.id,
        draftId: row.draft_id,
        userId: row.user_id,
        userDisplayName: row.user_display_name,
        action: row.action,
        versionAtAction: row.version_at_action,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    } catch (error) {
      logger.error("Error getting editor activity", { draftId, error });
      throw error;
    }
  }

  async createSignoff(params: {
    draftId: string;
    signedBy: string;
    signatureImagePath: string;
    signedVersion: number;
    timezoneOffset: string | null;
  }): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO draft_signoffs 
        (draft_id, signed_by, signature_image_path, signed_version, timezone_offset)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (draft_id) 
       DO UPDATE SET
         signed_by = EXCLUDED.signed_by,
         signed_at = NOW(),
         signature_image_path = EXCLUDED.signature_image_path,
         signed_version = EXCLUDED.signed_version,
         timezone_offset = EXCLUDED.timezone_offset,
         revoked_at = NULL,
         revoked_by = NULL,
         revocation_reason = NULL`,
        [
          params.draftId,
          params.signedBy,
          params.signatureImagePath,
          params.signedVersion,
          params.timezoneOffset,
        ],
      );
      await client.query(
        `UPDATE drafts
       SET is_signed = true,
           signed_by = $2,
           signed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
        [params.draftId, params.signedBy],
      );

      await client.query("COMMIT");

      logger.info("Signoff created", {
        draftId: params.draftId,
        signedBy: params.signedBy,
        signedVersion: params.signedVersion,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error creating signoff", {
        draftId: params.draftId,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }

  async saveSignedDocPath(
    draftId: string,
    signedDocPath: string,
  ): Promise<void> {
    try {
      await pool.query(
        `UPDATE draft_signoffs
       SET signed_doc_path = $2
       WHERE draft_id = $1`,
        [draftId, signedDocPath],
      );

      logger.info("Signed doc path saved", { draftId, signedDocPath });
    } catch (error) {
      logger.error("Error saving signed doc path", { draftId, error });
      throw error;
    }
  }

  async getSignoff(draftId: string): Promise<Signoff | null> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM draft_signoffs WHERE draft_id = $1`,
        [draftId],
      );

      if (!rows.length) return null;

      const row = rows[0];
      return {
        id: row.id,
        draftId: row.draft_id,
        signedBy: row.signed_by,
        signedAt: row.signed_at,
        signatureImagePath: row.signature_image_path,
        signedDocPath: row.signed_doc_path,
        signedVersion: row.signed_version,
        timezoneOffset: row.timezone_offset,
        revokedAt: row.revoked_at,
        revokedBy: row.revoked_by,
        revocationReason: row.revocation_reason,
      };
    } catch (error) {
      logger.error("Error getting signoff", { draftId, error });
      throw error;
    }
  }

  async revokeSignoff(params: {
    draftId: string;
    revokedBy: string;
    revocationReason: string;
  }): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE draft_signoffs
       SET revoked_at = NOW(),
           revoked_by = $2,
           revocation_reason = $3
       WHERE draft_id = $1`,
        [params.draftId, params.revokedBy, params.revocationReason],
      );

      await client.query(
        `UPDATE drafts
       SET is_signed = false,
           signed_by = NULL,
           signed_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
        [params.draftId],
      );

      await client.query("COMMIT");

      logger.info("Signoff revoked", {
        draftId: params.draftId,
        revokedBy: params.revokedBy,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("Error revoking signoff", {
        draftId: params.draftId,
        error: e,
      });
      throw e;
    } finally {
      client.release();
    }
  }
}

export const draftRepository = new DraftRepository();
