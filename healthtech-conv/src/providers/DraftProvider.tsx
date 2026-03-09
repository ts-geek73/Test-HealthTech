import api from "@/lib/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

export interface PatchResult {
  title: string;
  original: string;
  updated: string;
  confidence: number;
}

export interface AgentResult {
  success: boolean;
  message: string | null;
  edits: PatchResult[];
  needsClarification: boolean;
  dirty: boolean;
}

export interface HistoryItem {
  version: string;
  createdBy: string;
  timestamp: string;
  isRollback: boolean;
}

export interface VersionSnapshot {
  version: string;
  createdBy: string;
  timestamp: string;
  isRollback: boolean;
  sections: any[];
}

export interface Reference {
  id: string;
  title: string;
  content: string;
}

export interface InlineSection {
  id?: string;
  title: string;
  content: string;
  position: number;
}

export interface SignoffData {
  signatureDataUrl: string;
  signedAt: string;
  signedBy: string;
  isSigned: boolean;
}

interface DraftContextValue {
  contentId: string | null;
  sessionId: string | null;

  sections: any[];
  references: Reference[];
  currentVersion: string | null;
  history: HistoryItem[];

  dirty: boolean;
  lastEdits: AgentResult | null;

  isPreparing: boolean;
  isInvoking: boolean;
  isSaving: boolean;
  isDiscarding: boolean;
  isRollingBack: boolean;
  isInlineSaving: boolean;
  isPreviewing: boolean;
  isAnyLoading: boolean;

  signoff: SignoffData | null;
  isSigned: boolean;
  openSignoff: boolean;
  setOpenSignoff: (open: boolean) => void;
  handleSignoffConfirm: (signatureDataUrl: string) => void;
  setContentId: (contentId: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  prepareDraft: (contentId: string, sessionId: string) => Promise<void>;
  invokeAgent: (messages: any[], sectionId?: string | null) => Promise<void>;
  discardDraft: () => Promise<void>;
  commitDraft: (createdBy: string) => Promise<void>;
  rollback: (version: string) => Promise<void>;
  getVersionSnapshot: (version: string) => Promise<VersionSnapshot | null>;
  saveInline: (
    contentId: string,
    sessionId: string,
    sections: InlineSection[],
  ) => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contentId, setContentId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [lastEdits, setLastEdits] = useState<AgentResult | null>(null);

  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInvoking, setIsInvoking] = useState(false);

  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isInlineSaving, setIsInlineSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [signoff, setSignoff] = useState<SignoffData | null>(null);
  const [openSignoff, setOpenSignoff] = useState(false);

  const isSigned = !!signoff;

  const isAnyLoading =
    isPreparing ||
    isInvoking ||
    isSaving ||
    isDiscarding ||
    isRollingBack ||
    isInlineSaving ||
    isPreviewing;

  // ── ORIGINAL api() helper (commented out – using mock data) ──────────
  // const api = useCallback(async (url: string, options?: RequestInit) => {
  //   const res = await fetch(`${BASE_URL}${url}`, options);
  //   if (!res.ok) {
  //     const text = await res.text();
  //     throw new Error(text || "Request failed");
  //   }
  //   return res.json();
  // }, []);
  // ─────────────────────────────────────────────────────────────────────

  // ── ORIGINAL loadAllData (commented out – using mock data) ────────────
  // const loadAllData = useCallback(
  //   async (pid: string, acc: string) => {
  //     const [draftRes, historyRes] = await Promise.all([
  //       api(`/drafts/${pid}/${acc}`),
  //       api(`/drafts/${pid}/${acc}/history`),
  //     ]);
  //     const draft = draftRes.data;
  //     setSections(draft.sections ?? []);
  //     setReferences(draft.references ?? []);
  //     setCurrentVersion(draft.currentVersion);
  //     setDirty(false);
  //     setHistory(historyRes.data ?? []);
  //     if (draft?.isSigned) {
  //       setSignoff({
  //         signedBy: draft.signedBy,
  //         signatureDataUrl: draft.signature,
  //         signedAt: draft.signedAt,
  //         isSigned: draft.isSigned,
  //       });
  //     } else {
  //       setSignoff(null);
  //     }
  //   },
  //   [api],
  // );
  // ─────────────────────────────────────────────────────────────────────

  const loadAllData = useCallback(
    async (sessionId: string) => {
      try {
        const [draftRes, historyRes] = await Promise.all([
          api.get(`/drafts/${sessionId}`),
          api.get(`/drafts/${sessionId}/history`),
        ]);
        const draft = draftRes.data.data;
        setSections(draft.sections ?? []);
        setReferences(draft.references ?? []);
        setCurrentVersion(draft.currentVersion);
        setDirty(false);
        setHistory(historyRes.data.data ?? []);
        if (draft?.isSigned) {
          setSignoff({
            signedBy: draft.signedBy,
            signatureDataUrl: draft.signature,
            signedAt: draft.signedAt,
            isSigned: draft.isSigned,
          });
        } else {
          setSignoff(null);
        }
      } catch (err) {
        console.error("Failed to load session data", err);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!contentId || !sessionId) return;
    await loadAllData(sessionId);
  }, [contentId, sessionId, loadAllData]);

  const prepareDraft = useCallback(
    async (contentId: string, sessionId: string) => {
      try {
        setIsPreparing(true);

        await api.post("/prepare-draft", {
          contentId,
          sessionId,
        });
        setContentId(contentId);
        setSessionId(sessionId);
        
        await loadAllData(sessionId);
      } catch (err: any) {
        toast.error(err?.message || "Failed to prepare draft.");
      } finally {
        setIsPreparing(false);
      }
    },
    [loadAllData],
  );

  const invokeAgent = useCallback(
    async (messages: any[], sectionId?: string | null) => {
      if (!sessionId) return;
      try {
        setIsInvoking(true);
        const res = await api.post("/invoke", {
          sessionId,
          messages,
          sectionId: sectionId ?? undefined,
        });
        const result: AgentResult = res.data;
        setLastEdits(result);
        setDirty(result.dirty);
        if (result.needsClarification)
          toast.warning(result.message ?? "Clarify");
      } catch (err: any) {
        toast.error(err?.message || "Failed to invoke AI");
      } finally {
        setIsInvoking(false);
      }
    },
    [sessionId],
  );

  const commitDraft = useCallback(
    async (createdBy: string) => {
      if (!sessionId) return;
      try {
        setIsSaving(true);
        const res = await api.post(`/drafts/${sessionId}/commit`, {
          createdBy,
        });
        setCurrentVersion(res.data.version);
        setDirty(false);
        setLastEdits(null);
        await refresh();
        toast.success("Changes applied.");
      } catch (err: any) {
        toast.error(err?.message || "Commit failed");
      } finally {
        setIsSaving(false);
      }
    },
    [sessionId, refresh],
  );

  const discardDraft = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsDiscarding(true);
      await api.post(`/drafts/${sessionId}/discard`, {});
      setDirty(false);
      setLastEdits(null);

      await refresh();
      toast.info("Changes discarded");
    } catch (err: any) {
      toast.error(err?.message || "Discard failed");
    } finally {
      setIsDiscarding(false);
    }
  }, [sessionId, refresh]);

  const rollback = useCallback(
    async (version: string) => {
      if (!sessionId) return;
      try {
        setIsRollingBack(true);
        await api.post(`/drafts/${sessionId}/rollback`, {
          targetVersion: version,
          createdBy: "anonymous",
        });
        await refresh();
        toast.success(`Draft rolled back to ${version}`);
      } catch (err: any) {
        toast.error(err?.message || "Rollback failed");
      } finally {
        setIsRollingBack(false);
      }
    },
    [sessionId, refresh],
  );

  const handleSignoffConfirm = useCallback(
    async (signatureDataUrl: string) => {
      if (!sessionId) return;
      try {
        setIsSaving(true);
        const timezoneOffset = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await api.post(`/drafts/${sessionId}/sign`, {
          signedBy: "anonymous",
          signatureImageData: signatureDataUrl,
          timezoneOffset,
        });
        setOpenSignoff(false);
        await refresh();
        toast.success("Document signed and locked");
      } catch (err: any) {
        toast.error(err?.message || "Signing failed");
      } finally {
        setIsSaving(false);
      }
    },
    [sessionId, refresh],
  );

  const saveInline = useCallback(
    async (_contentId: string, sessionId: string, inlineSections: InlineSection[]) => {
      try {
        setIsInlineSaving(true);
        await api.post(`/drafts/${sessionId}/save-inline`, {
          sessionId,
          sections: inlineSections,
        });
        await loadAllData(sessionId);
        toast.success("Version saved");
      } catch (err: any) {
        toast.error(err?.message || "Inline save failed");
      } finally {
        setIsInlineSaving(false);
      }
    },
    [loadAllData],
  );

  const getVersionSnapshot = useCallback(
    async (version: string) => {
      if (!sessionId) return null;
      try {
        setIsPreviewing(true);
        const res = await api.get(`/drafts/${sessionId}/versions/${version}`);
        return res.data ?? null;
      } catch (err: any) {
        toast.error(err?.message || "Preview failed");
        return null;
      } finally {
        setIsPreviewing(false);
      }
    },
    [sessionId],
  );

  const value = useMemo(
    () => ({
      contentId,
      sessionId,
      sections,
      references,
      currentVersion,
      history,
      dirty,
      lastEdits,

      isPreparing,
      isInvoking,
      isSaving,
      isDiscarding,
      isRollingBack,
      isInlineSaving,
      isPreviewing,
      isAnyLoading,

      signoff,
      isSigned,
      openSignoff,
      setOpenSignoff,
      handleSignoffConfirm,
      setSessionId,
      setContentId,
      prepareDraft,
      invokeAgent,
      discardDraft,
      commitDraft,
      rollback,
      getVersionSnapshot,
      saveInline,
    }),
    [
      contentId,
      sessionId,
      sections,
      references,
      currentVersion,
      history,
      dirty,
      lastEdits,
      isPreparing,
      isInvoking,
      isSaving,
      isDiscarding,
      isRollingBack,
      isInlineSaving,
      isPreviewing,
      isAnyLoading,
      signoff,
      isSigned,
      openSignoff,
      handleSignoffConfirm,
      prepareDraft,
      invokeAgent,
      discardDraft,
      commitDraft,
      rollback,
      getVersionSnapshot,
      saveInline,
    ],
  );

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
};

export const useDraft = (): DraftContextValue => {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used inside DraftProvider");
  return ctx;
};
