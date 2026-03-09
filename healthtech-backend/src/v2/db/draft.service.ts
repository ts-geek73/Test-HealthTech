import crypto from "crypto";
import logger from "../../logger";

import { EmbeddingsService } from "../../agents/services/embeddings.service";
import { Reference } from "../../agents/types/draft-summary";

import { DraftRepository } from "./draft.repository";
import { SearchService } from "./search.service";

import { EditorAction, Signoff } from "../../types/signoff.types";
import { DocumentService } from "./document.service";
import { DraftEntity } from "./draft.entity";
import { SectionEntity } from "./section.entity";
export const LOW_CONFIDENCE_THRESHOLD = 0.5;

export class DraftService {
  private embeddings = EmbeddingsService.getProvider();

  private documentService: DocumentService;
  constructor(
    private repository: DraftRepository,
    private searchService: SearchService,
  ) {
    this.documentService = new DocumentService();
  }

  async prepareDraft(params: {
    sessionId: string;
    createdBy: string;
    draft: Record<string, string>;
    sectionReferences?: Record<string, Reference[]>;
  }): Promise<DraftEntity> {
    try {
      const draft = await this.repository.findOrCreateDraft({
        sessionId: params.sessionId,
        createdBy: params.createdBy,
      });

      const entries = Object.entries(params.draft);

      const allRefs: Reference[] = [];

      // ✅ ADD POSITION TO SECTIONS
      const sections: SectionEntity[] = entries.map(
        ([title, content], index) => {
          const refs = params.sectionReferences?.[title] ?? [];
          refs.forEach((r) => allRefs.push(r));

          return new SectionEntity({
            id: crypto.randomUUID(),
            title,
            content,
            position: index, // ✅ ADD THIS - sequential position
            referenceIds: refs.map((r) => r.id),
            embedding: undefined,
          });
        },
      );

      const uniqueRefs = Array.from(
        new Map(allRefs.map((r) => [r.id, r])).values(),
      );

      const [, , versionId] = await Promise.all([
        uniqueRefs.length
          ? this.repository.upsertReferences(draft.id, uniqueRefs)
          : Promise.resolve(),
        this.repository.upsertSections(draft.id, sections),
        this.repository.createVersion({
          draftId: draft.id,
          version: 0,
          createdBy: params.createdBy,
          isRollback: false,
        }),
      ]);

      await Promise.all([
        this.repository.saveVersionSections(versionId, sections),
        this.repository.updateDraftMeta(draft.id, 0, 1),
        // ✅ ADD TRACKING
        this.repository.trackEditorAction({
          draftId: draft.id,
          userId: params.createdBy,
          userDisplayName: null,
          action: "prepare",
          versionAtAction: 0,
          metadata: {
            sectionCount: sections.length,
            referenceCount: uniqueRefs.length,
          },
        }),
      ]);

      draft.restoreSections(sections);
      draft.addOrUpdateReferences(uniqueRefs);

      logger.info("Draft prepared", {
        sessionId: params.sessionId,
      });

      setImmediate(async () => {
        try {
          logger.info("Starting background embedding generation", {
            sessionId: params.sessionId,
          });

          const embeddings = await this.embeddings.embedDocuments(
            entries.map(([, c]) => c),
          );

          sections.forEach((s, i) => s.updateEmbedding(embeddings[i]));

          await Promise.all([
            this.repository.upsertSections(draft.id, sections),
            this.repository.updateVersionSectionEmbeddings(versionId, sections),
          ]);

          this.searchService.buildIndex(draft);

          logger.info(
            "Background tasks completed (embeddings + search index)",
            {
              sessionId: params.sessionId,
            },
          );
        } catch (bgError) {
          logger.error("Error in background tasks", {
            sessionId: params.sessionId,
            error: bgError,
          });
        }
      });

      return draft;
    } catch (error) {
      logger.error("Error preparing draft", {
        sessionId: params.sessionId,
        error,
      });
      throw error;
    }
  }

  async getDraft(sessionId: string): Promise<DraftEntity | null> {
    try {
      const draft = await this.repository.getDraftMeta(sessionId);

      if (!draft) return null;

      const [sections, refs] = await Promise.all([
        this.repository.getVersionSnapshot(
          draft.id,
          draft.currentVersionNumber,
        ),
        this.repository.getDraftReferences(draft.id),
      ]);

      if (sections) {
        draft.restoreSections(sections);
      }

      draft.restoreReferences(refs);

      this.searchService.buildIndex(draft);

      return draft;
    } catch (error) {
      logger.error("Error getting draft", { sessionId, error });
      throw error;
    }
  }

  async updateSection(params: {
    sessionId: string;
    sectionId: string;
    newContent: string;
    newReferences: Reference[];
    userId?: string;
  }): Promise<void> {
    try {
      const draft = await this.getDraft(params.sessionId);

      if (!draft) throw new Error("Draft not found");
      if (draft.isSigned) {
        throw new Error("Cannot edit a signed draft");
      }

      const section = draft.getSection(params.sectionId);

      if (!section) throw new Error("Section not found");

      const [[embedding]] = await Promise.all([
        this.embeddings.embedDocuments([params.newContent]),
        params.newReferences.length
          ? this.repository.upsertReferences(draft.id, params.newReferences)
          : Promise.resolve(),
      ]);

      if (params.newReferences.length) {
        draft.addOrUpdateReferences(params.newReferences);
      }

      section.update(
        params.newContent,
        params.newReferences.map((r) => r.id),
        embedding,
      );

      await this.repository.upsertSections(draft.id, [section]);

      if (params.userId) {
        await this.repository.trackEditorAction({
          draftId: draft.id,
          userId: params.userId,
          userDisplayName: null,
          action: "edit",
          versionAtAction: draft.currentVersionNumber,
          metadata: {
            sectionId: params.sectionId,
            sectionTitle: section.title,
          },
        });
      }

      this.searchService.buildIndex(draft);

      logger.info("Section updated", {
        draftId: draft.id,
        sectionId: params.sectionId,
      });
    } catch (error) {
      logger.error("Error updating section", {
        sessionId: params.sessionId,
        sectionId: params.sectionId,
        error,
      });
      throw error;
    }
  }

  async commitDraft(params: {
    sessionId: string;
    createdBy: string;
  }): Promise<string> {
    try {
      const draft = await this.repository.getDraftMeta(params.sessionId);

      if (!draft) throw new Error("Draft not found");

      // ✅ ADD SIGNING CHECK
      if (draft.isSigned) {
        throw new Error(
          "Cannot commit a signed draft. Revoke signature first.",
        );
      }

      const workingSections = await this.repository.getCurrentSections(
        draft.id,
      );

      if (!workingSections || workingSections.length === 0) {
        throw new Error("No sections to commit");
      }

      const newVersion = draft.nextVersionNumber;

      const versionId = await this.repository.createVersion({
        draftId: draft.id,
        version: newVersion,
        createdBy: params.createdBy,
        isRollback: false,
      });

      await Promise.all([
        this.repository.saveVersionSections(versionId, workingSections),

        this.repository.trackEditorAction({
          draftId: draft.id,
          userId: params.createdBy,
          userDisplayName: null,
          action: "commit",
          versionAtAction: newVersion,
          metadata: {
            sectionCount: workingSections.length,
          },
        }),
      ]);

      draft.advanceVersion();

      await this.repository.updateDraftMeta(
        draft.id,
        draft.currentVersionNumber,
        draft.nextVersionNumber,
      );

      logger.info("Draft committed", {
        sessionId: params.sessionId,
        version: newVersion,
      });

      return `v${newVersion}`;
    } catch (error) {
      logger.error("Error committing draft", {
        sessionId: params.sessionId,
        error,
      });
      throw error;
    }
  }

  async discardDraft(params: {
    sessionId: string;
    userId?: string; // ✅ ADD THIS
  }): Promise<boolean> {
    try {
      const draft = await this.repository.getDraftMeta(params.sessionId);

      if (!draft) return false;

      // ✅ ADD SIGNING CHECK
      if (draft.isSigned) {
        throw new Error(
          "Cannot discard a signed draft. Revoke signature first.",
        );
      }

      const [restored, refs] = await Promise.all([
        this.repository.overwriteWorkspaceFromVersion(
          draft.id,
          draft.currentVersionNumber,
        ),
        this.repository.getDraftReferences(draft.id),
      ]);

      if (!restored) return false;

      draft.restoreSections(restored);
      draft.restoreReferences(refs);

      // ✅ ADD TRACKING
      if (params.userId) {
        await this.repository.trackEditorAction({
          draftId: draft.id,
          userId: params.userId,
          userDisplayName: null,
          action: "discard",
          versionAtAction: draft.currentVersionNumber,
          metadata: {},
        });
      }

      this.searchService.buildIndex(draft);

      logger.info("Draft discarded", { draftId: draft.id });

      return true;
    } catch (error) {
      logger.error("Error discarding draft", {
        sessionId: params.sessionId,
        error,
      });
      throw error;
    }
  }

  async rollback(params: {
    sessionId: string;
    targetVersion: string;
    createdBy: string;
  }): Promise<boolean> {
    try {
      const draft = await this.repository.getDraftMeta(params.sessionId);

      if (!draft) return false;

      // ✅ ADD SIGNING CHECK
      if (draft.isSigned) {
        throw new Error(
          "Cannot rollback a signed draft. Revoke signature first.",
        );
      }

      const versionNum = Number(params.targetVersion.replace("v", ""));

      if (isNaN(versionNum)) throw new Error("Invalid version");

      const restored = await this.repository.overwriteWorkspaceFromVersion(
        draft.id,
        versionNum,
      );

      if (!restored) return false;

      const newVersion = draft.nextVersionNumber;

      const versionId = await this.repository.createVersion({
        draftId: draft.id,
        version: newVersion,
        createdBy: params.createdBy,
        isRollback: true,
      });

      const [, refs] = await Promise.all([
        this.repository.saveVersionSections(versionId, restored),
        this.repository.getDraftReferences(draft.id),
        // ✅ ADD TRACKING
        this.repository.trackEditorAction({
          draftId: draft.id,
          userId: params.createdBy,
          userDisplayName: null,
          action: "rollback",
          versionAtAction: newVersion,
          metadata: {
            targetVersion: versionNum,
          },
        }),
      ]);

      draft.restoreSections(restored);
      draft.restoreReferences(refs);
      draft.advanceVersion();

      await this.repository.updateDraftMeta(
        draft.id,
        draft.currentVersionNumber,
        draft.nextVersionNumber,
      );

      this.searchService.buildIndex(draft);

      logger.info("Draft rolled back", {
        draftId: draft.id,
        fromVersion: versionNum,
        toVersion: newVersion,
      });

      return true;
    } catch (error) {
      logger.error("Error rolling back draft", {
        sessionId: params.sessionId,
        targetVersion: params.targetVersion,
        error,
      });
      throw error;
    }
  }
  // Delegates to repository — no more raw pool.query in the service layer
  async getHistory(sessionId: string) {
    try {
      const draft = await this.repository.getDraftMeta(sessionId);

      if (!draft) return null;

      return this.repository.getHistory(draft.id);
    } catch (error) {
      logger.error("Error getting history", {
        sessionId,
        error,
      });
      throw error;
    }
  }

  async search(params: {
    sessionId: string;
    query: string;
    contentKeywords?: string[];
    limit?: number;
  }) {
    try {
      const draft = await this.getDraft(params.sessionId);

      if (!draft) throw new Error("Draft not found");

      const [queryEmbedding] = await this.embeddings.embedDocuments([
        params.query,
      ]);

      return this.searchService.search(
        draft,
        params.query,
        queryEmbedding,
        params.contentKeywords,
        params.limit ?? 3,
      );
    } catch (error) {
      logger.error("Error searching draft", {
        sessionId: params.sessionId,
        query: params.query,
        error,
      });
      throw error;
    }
  }
  async saveInlineVersion(params: {
    sessionId: string;
    createdBy: string;
    sections: {
      id: string;
      title: string;
      content: string;
      position: number;
    }[];
  }): Promise<DraftEntity> {
    try {
      const draft = await this.repository.getDraftMeta(params.sessionId);

      if (!draft) {
        throw new Error("Draft not found");
      }

      if (draft.isSigned) {
        throw new Error("Cannot save inline version on a signed draft");
      }

      const resolvedSections: SectionEntity[] = params.sections.map(
        (s) =>
          new SectionEntity({
            id: s.id,
            title: s.title,
            content: s.content,
            position: s.position,
            referenceIds: [],
            embedding: undefined,
          }),
      );

      const newVersionNumber = draft.nextVersionNumber;

      const versionId = await this.repository.createVersion({
        draftId: draft.id,
        version: newVersionNumber,
        createdBy: params.createdBy,
        isRollback: false,
      });

      await Promise.all([
        this.repository.upsertSections(draft.id, resolvedSections),
        this.repository.saveVersionSections(versionId, resolvedSections),
        this.repository.updateDraftMeta(
          draft.id,
          newVersionNumber,
          newVersionNumber + 1,
        ),
        this.repository.trackEditorAction({
          draftId: draft.id,
          userId: params.createdBy,
          userDisplayName: null,
          action: "inline_save",
          versionAtAction: newVersionNumber,
          metadata: {
            sectionCount: resolvedSections.length,
          },
        }),
      ]);

      draft.restoreSections(resolvedSections);
      draft.advanceVersion();

      logger.info("Inline version saved", {
        draftId: draft.id,
        version: newVersionNumber,
      });

      setImmediate(async () => {
        try {
          const embeddings = await this.embeddings.embedDocuments(
            resolvedSections.map((s) => s.content),
          );

          resolvedSections.forEach((s, i) => s.updateEmbedding(embeddings[i]));

          await Promise.all([
            this.repository.upsertSections(draft.id, resolvedSections),
            this.repository.updateVersionSectionEmbeddings(
              versionId,
              resolvedSections,
            ),
          ]);

          this.searchService.buildIndex(draft);

          logger.info("Embeddings updated for inline version", {
            draftId: draft.id,
            version: newVersionNumber,
          });
        } catch (err) {
          logger.error("Background embedding error (inline save)", {
            draftId: draft.id,
            error: err,
          });
        }
      });

      return draft;
    } catch (error) {
      logger.error("Error saving inline version", {
        sessionId: params.sessionId,
        error,
      });
      throw error;
    }
  }

  async signDraft(params: {
    sessionId: string;
    signedBy: string;
    signatureImagePath: string;
    timezoneOffset?: string;
    base64: string;
  }): Promise<string> {
    try {
      const draft = await this.repository.getDraftMeta(params.sessionId);

      if (!draft) {
        throw new Error("Draft not found");
      }

      if (draft.isSigned) {
        throw new Error("Draft is already signed");
      }

      await this.repository.createSignoff({
        draftId: draft.id,
        signedBy: params.signedBy,
        signatureImagePath: params.signatureImagePath,
        signedVersion: draft.currentVersionNumber,
        timezoneOffset: params.timezoneOffset ?? null,
      });

      draft.markAsSigned(
        params.signedBy,
        new Date(),
        params.signatureImagePath,
      );

      const draftU = await this.getDraft(params.sessionId);
      const signedDocPath = await this.documentService.generateDocxFromDraft({
        draft: draftU!,
        base64: params.base64,
      });

      await this.repository.saveSignedDocPath(draft.id, signedDocPath);
      draft.addDocPath(signedDocPath);
      await this.repository.trackEditorAction({
        draftId: draft.id,
        userId: params.signedBy,
        userDisplayName: null,
        action: "sign",
        versionAtAction: draft.currentVersionNumber,
        metadata: {
          signatureImagePath: params.signatureImagePath,
          timezoneOffset: params.timezoneOffset,
        },
      });

      logger.info("Draft signed successfully", {
        draftId: draft.id,
        signedBy: params.signedBy,
        version: draft.currentVersionNumber,
      });
      return signedDocPath;
    } catch (error) {
      logger.error("Error signing draft", {
        sessionId: params.sessionId,
        error,
      });
      throw error;
    }
  }

  async revokeSignature(params: {
    sessionId: string;
    revokedBy: string;
    reason: string;
  }): Promise<void> {
    try {
      const draft = await this.repository.getDraftMeta(params.sessionId);

      if (!draft) {
        throw new Error("Draft not found");
      }

      if (!draft.isSigned) {
        throw new Error("Draft is not signed");
      }
      await this.repository.revokeSignoff({
        draftId: draft.id,
        revokedBy: params.revokedBy,
        revocationReason: params.reason,
      });

      await this.repository.trackEditorAction({
        draftId: draft.id,
        userId: params.revokedBy,
        userDisplayName: null,
        action: "revoke_signature",
        versionAtAction: draft.currentVersionNumber,
        metadata: {
          reason: params.reason,
        },
      });

      draft.clearSignature();

      logger.info("Draft signature revoked", {
        draftId: draft.id,
        revokedBy: params.revokedBy,
      });
    } catch (error) {
      logger.error("Error revoking signature", {
        sessionId: params.sessionId,
        error,
      });
      throw error;
    }
  }

  async getSignoffStatus(sessionId: string): Promise<Signoff | null> {
    try {
      const draft = await this.repository.getDraftMeta(sessionId);

      if (!draft) {
        return null;
      }

      return this.repository.getSignoff(draft.id);
    } catch (error) {
      logger.error("Error getting signoff status", {
        sessionId,
        error,
      });
      throw error;
    }
  }

  async getEditorActivity(sessionId: string): Promise<EditorAction[]> {
    try {
      const draft = await this.repository.getDraftMeta(sessionId);

      if (!draft) {
        throw new Error("Draft not found");
      }

      return this.repository.getEditorActivity(draft.id);
    } catch (error) {
      logger.error("Error getting editor activity", {
        sessionId,
        error,
      });
      throw error;
    }
  }

  async reorderSections(params: {
    sessionId: string;
    userId: string;
    sectionOrder: Array<{ id: string; position: number }>;
  }): Promise<void> {
    try {
      const draft = await this.getDraft(params.sessionId);

      if (!draft) {
        throw new Error("Draft not found");
      }

      if (draft.isSigned) {
        throw new Error("Cannot reorder sections in a signed draft");
      }

      const sectionMap = new Map(draft.sections.map((s) => [s.id, s]));
      for (const item of params.sectionOrder) {
        if (!sectionMap.has(item.id)) {
          throw new Error(`Section ${item.id} not found in draft`);
        }
      }

      const updatedSections: SectionEntity[] = [];
      for (const item of params.sectionOrder) {
        const section = sectionMap.get(item.id)!;
        section.updatePosition(item.position);
        updatedSections.push(section);
      }

      await this.repository.upsertSections(draft.id, updatedSections);

      await this.repository.trackEditorAction({
        draftId: draft.id,
        userId: params.userId,
        userDisplayName: null,
        action: "reorder_sections",
        versionAtAction: draft.currentVersionNumber,
        metadata: {
          sectionOrder: params.sectionOrder,
        },
      });

      logger.info("Sections reordered", {
        draftId: draft.id,
        userId: params.userId,
        sectionCount: updatedSections.length,
      });
    } catch (error) {
      logger.error("Error reordering sections", {
        sessionId: params.sessionId,
        error,
      });
      throw error;
    }
  }
  async getSnapshotByVersion(params: { sessionId: string; version: number }) {
    try {
      const draft = await this.repository.getDraftMeta(params.sessionId);

      if (!draft) return null;

      const [snapshot, history] = await Promise.all([
        this.repository.getVersionSnapshot(draft.id, params.version),
        this.repository.getHistory(draft.id),
      ]);

      if (!snapshot) return null;

      const found = history?.find((h) => h.version === `v${params.version}`);

      if (!found) return null;

      return {
        version: params.version,
        createdBy: found.createdBy,
        timestamp: found.timestamp,
        isRollback: found.isRollback,
        sections: snapshot,
      };
    } catch (error) {
      logger.error("Error getting snapshot by version", {
        sessionId: params.sessionId,
        version: params.version,
        error,
      });
      throw error;
    }
  }
}
