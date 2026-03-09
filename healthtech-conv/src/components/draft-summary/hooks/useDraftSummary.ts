import { normalizeVersion } from "@/components/discharge/VersionHistoryDropdown";
import { useDraft } from "@/providers/DraftProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { htmlToSections } from "../htmlToSections";

import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export interface EditSection {
  confidence: number;
  original: string;
  title: string;
  updated: string;
}

export interface EditResponse {
  edits: EditSection[];
  message: string;
  needsClarification: boolean;
  success: boolean;
  dirty: boolean;
}

async function markdownToHtml(content: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(content.replace(/\t/g, "    "));

  return String(file);
}

async function sectionsToHtml(sections: any[]): Promise<string> {
  if (!sections?.length) return "";

  const sorted = [...sections].sort((a, b) => a.position - b.position);

  const rendered = await Promise.all(
    sorted.map(async (s) => {
      const body = await markdownToHtml(String(s.content || ""));

      const positionAttr = s.position
        ? ` data-section-position="${s.position}"`
        : "";

      const idAttr = s.id ? ` data-section-id="${String(s.id)}"` : "";

      return `
        <section class="doc-section">
          <h3 class="doc-title"${idAttr}${positionAttr}>
            ${String(s.title || "")
              .replace(/:$/, "")
              .trim()}
          </h3>
          <div class="doc-body">
            ${body}
          </div>
        </section>
      `;
    }),
  );

  return rendered.join("");
}

function useRenderedHtml(sections: any[] | null) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!sections?.length) return;

    let cancelled = false;

    const render = async () => {
      const output = await sectionsToHtml(sections);
      if (!cancelled) setHtml(output);
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [sections]);

  return html;
}

export const useDraftSummary = () => {
  const {
    prepareDraft,
    invokeAgent,
    commitDraft,
    discardDraft,
    currentVersion,
    dirty,
    history,
    rollback,
    lastEdits,
    getVersionSnapshot,
    sections,
    references,
    saveInline,
    isSaving,
    isDiscarding,
    isRollingBack,
    isInlineSaving,
    isPreviewing,
    isAnyLoading,
    signoff,
    isSigned,
    patientId,
    accountNumber,
    setPatientId,
    setAccountNumber,
    openSignoff,
    setOpenSignoff,
    handleSignoffConfirm,
  } = useDraft();

  const [editor, setEditor] = useState<any>(null);
  const [content, setContent] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(false);

  const [previewVersion, setPreviewVersion] = useState<string | null>(null);
  const [previewSections, setPreviewSections] = useState<any[] | null>(null);

  const [inlineDirty, setInlineDirty] = useState(false);
  const [showInlineConfirm, setShowInlineConfirm] = useState(false);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const currentHtmlRef = useRef("");
  const hasPrepared = useRef<string | null>(null);

  const normalizedCurrentVersion = normalizeVersion(currentVersion);
  const normalizedPreviewVersion = normalizeVersion(previewVersion);

  const canEnableVoice = normalizedPreviewVersion
    ? normalizedPreviewVersion === normalizedCurrentVersion
    : true;

  useEffect(() => {
    const init = async () => {
      try {
        const key = `${patientId}-${accountNumber}`;
        hasPrepared.current = key;

        setIsPreparing(true);

        await prepareDraft(patientId || "", accountNumber || "");
      } catch {
        toast.error("Failed to prepare draft");
      } finally {
        setIsPreparing(false);
      }
    };

    if (!patientId || !accountNumber) return;

    const key = `${patientId}-${accountNumber}`;

    if (hasPrepared.current !== key) {
      init();
    }
  }, [patientId, accountNumber]);

  const activeSections = useMemo(
    () => previewSections ?? sections,
    [previewSections, sections],
  );

  const renderedHtml = useRenderedHtml(activeSections);

  useEffect(() => {
    if (!editor || !renderedHtml) return;

    editor.commands.setContent(renderedHtml);
    setContent(renderedHtml);
    currentHtmlRef.current = renderedHtml;
    setInlineDirty(false);
  }, [editor, renderedHtml]);

  /* ---------------------------------------------------------------------- */
  /*                               Handlers                                 */
  /* ---------------------------------------------------------------------- */

  const handleDocChanged = useCallback(() => {
    setInlineDirty(true);
  }, []);

  const handleTranscript = useCallback(
    async (text: string) => {
      try {
        setLoading(true);
        setShowDiff(true);
        await invokeAgent([{ role: "user", content: text }], selectedSectionId);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [invokeAgent, selectedSectionId],
  );

  const handleSave = useCallback(async () => {
    if (!isSigned) {
      setOpenSignoff(true);
      return;
    }

    try {
      await commitDraft("anonymous");
      toast.success("Version committed");
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [isSigned, commitDraft, setOpenSignoff]);

  const handleConfirmInlineSave = useCallback(async () => {
    try {
      const parsedSections = htmlToSections(content);
      await saveInline(patientId || "", accountNumber || "", parsedSections);
      setShowInlineConfirm(false);
      setInlineDirty(false);
      currentHtmlRef.current = content;
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [content, saveInline]);

  const handlePreviewVersion = useCallback(
    async (version: string) => {
      if (normalizeVersion(version) === normalizedCurrentVersion) {
        setPreviewVersion(null);
        setPreviewSections(null);
        return;
      }

      try {
        const snapshot = await getVersionSnapshot(version);
        if (snapshot) {
          setPreviewVersion(version);
          setPreviewSections(snapshot.sections);
        }
      } catch (err: any) {
        toast.error(err.message);
      }
    },
    [normalizedCurrentVersion, getVersionSnapshot],
  );

  const handleRollback = useCallback(
    async (version: string) => {
      if (!version) return;
      try {
        await rollback(version);
        setPreviewVersion(null);
        setPreviewSections(null);
      } catch (err: any) {
        toast.error(err.message);
      }
    },
    [rollback],
  );

  const handleDiscard = useCallback(async () => {
    try {
      await discardDraft();
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [discardDraft]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleRefresh = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(currentHtmlRef.current);
    toast.success("Editor refreshed");
  }, [editor]);

  return {
    content,
    editor,
    setEditor,
    showVoice,
    setShowVoice,
    isPreparing,
    handleTranscript,
    handleSave,
    loading,
    isSaving,
    isDiscarding,
    isRollingBack,
    isInlineSaving,
    isPreviewing,
    isAnyLoading,
    showDiff,
    setShowDiff,
    handleRefresh,
    handleContentChange,
    currentVersion,
    dirty,
    history,
    lastEdits,
    rollback,
    commitDraft,
    discardDraft,
    handleDiscard,
    previewVersion,
    previewSections,
    handlePreviewVersion,
    handleRollback,
    references,
    canEnableVoice,
    inlineDirty,
    showInlineConfirm,
    setShowInlineConfirm,
    handleConfirmInlineSave,
    handleDocChanged,
    selectedSectionId,
    setSelectedSectionId,
    signoff,
    isSigned,
    openSignoff,
    setOpenSignoff,
    handleSignoffConfirm,
    patientId,
    accountNumber,
    setPatientId,
    setAccountNumber,
  };
};
