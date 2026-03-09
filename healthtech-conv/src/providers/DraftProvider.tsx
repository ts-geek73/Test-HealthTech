import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  mockPrepareDraft,
  mockGetDraft,
  mockGetHistory,
  mockGetVersionSnapshot,
} from "@/mock-data";

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
  patientId: string | null;
  accountNumber: string | null;

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
  setPatientId: (patientId: string | null) => void;
  setAccountNumber: (accountNumber: string | null) => void;
  prepareDraft: (patientId: string, accountNumber: string) => Promise<void>;
  invokeAgent: (messages: any[], sectionId?: string | null) => Promise<void>;
  discardDraft: () => Promise<void>;
  commitDraft: (createdBy: string) => Promise<void>;
  rollback: (version: string) => Promise<void>;
  getVersionSnapshot: (version: string) => Promise<VersionSnapshot | null>;
  saveInline: (
    patientId: string,
    accountNumber: string,
    sections: InlineSection[],
  ) => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

// ── ORIGINAL API CONFIG (commented out – using mock data) ──────────────
// const BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v2";
//
// const JSON_HEADERS = { "Content-Type": "application/json" };
// ───────────────────────────────────────────────────────────────────────

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [patientId, setPatientId] = useState<string | null>("mrn2096");
  const [accountNumber, setAccountNumber] = useState<string | null>("acc2096");
  const [sections, setSections] = useState<any[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [lastEdits, setLastEdits] = useState<AgentResult | null>(null);

  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInvoking, ] = useState(false);
  // const [isInvoking, setIsInvoking] = useState(false); Enable On API Call

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

  /** MOCK version of loadAllData */
  const loadAllData = useCallback(async (pid: string, acc: string) => {
    const draftRes = mockGetDraft(pid, acc);
    const historyRes = mockGetHistory(pid, acc);

    const draft = draftRes.data;

    setSections(draft.sections ?? []);
    setReferences(draft.references ?? []);
    setCurrentVersion(draft.currentVersion);
    setDirty(false);
    setHistory(historyRes.data ?? []);

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
  }, []);

  const refresh = useCallback(async () => {
    if (!patientId || !accountNumber) return;
    await loadAllData(patientId, accountNumber);
  }, [patientId, accountNumber, loadAllData]);

  // ── ORIGINAL prepareDraft (commented out – using mock data) ───────────
  // const prepareDraft = useCallback(
  //   async (pid: string, acc: string) => {
  //     try {
  //       setIsPreparing(true);
  //       await api("/prepare-draft", {
  //         method: "POST",
  //         headers: JSON_HEADERS,
  //         body: JSON.stringify({ patientId: pid, accountNumber: acc }),
  //       });
  //       setPatientId(pid);
  //       setAccountNumber(acc);
  //       await loadAllData(pid, acc);
  //       toast.success("Draft ready");
  //     } catch (err: any) {
  //       toast.error(err?.message || "Server is waking up. Please try again.");
  //     } finally {
  //       setIsPreparing(false);
  //     }
  //   },
  //   [api],
  // );
  // ─────────────────────────────────────────────────────────────────────

  /** MOCK version of prepareDraft */
  const prepareDraft = useCallback(
    async (pid: string, acc: string) => {
      try {
        setIsPreparing(true);

        // validate that mock data exists for this patient
        mockPrepareDraft(pid, acc);

        setPatientId(pid);
        setAccountNumber(acc);

        await loadAllData(pid, acc);
        toast.success("Draft ready (mock data)");
      } catch (err: any) {
        toast.error(err?.message || "No mock data for this patient.");
      } finally {
        setIsPreparing(false);
      }
    },
    [loadAllData],
  );

  // ── ORIGINAL invokeAgent (commented out – using mock data) ────────────
  // const invokeAgent = useCallback(
  //   async (messages: any[], sectionId?: string | null) => {
  //     if (!patientId || !accountNumber) return;
  //     try {
  //       setIsInvoking(true);
  //       const res = await api("/invoke", {
  //         method: "POST",
  //         headers: JSON_HEADERS,
  //         body: JSON.stringify({
  //           patientId, accountNumber, messages,
  //           sectionId: sectionId ?? undefined,
  //         }),
  //       });
  //       const result: AgentResult = res.data;
  //       setLastEdits(result);
  //       setDirty(result.dirty);
  //       if (result.needsClarification)
  //         toast.warning(result.message ?? "Clarify");
  //     } catch (err: any) {
  //       toast.error(err?.message || "Failed to invoke AI");
  //     } finally {
  //       setIsInvoking(false);
  //     }
  //   },
  //   [api, patientId, accountNumber],
  // );
  // ─────────────────────────────────────────────────────────────────────

  /** MOCK version – AI invoke is a no-op with mock data */
  const invokeAgent = useCallback(
    async (_messages: any[], _sectionId?: string | null) => {
      if (!patientId || !accountNumber) return;
      toast.info("AI invoke is disabled while using mock data.");
    },
    [patientId, accountNumber],
  );

  // ── ORIGINAL commitDraft (commented out – using mock data) ────────────
  // const commitDraft = useCallback(
  //   async (createdBy: string) => {
  //     if (!patientId || !accountNumber) return;
  //     try {
  //       setIsSaving(true);
  //       const res = await api(`/drafts/${patientId}/${accountNumber}/commit`, {
  //         method: "POST",
  //         headers: JSON_HEADERS,
  //         body: JSON.stringify({ createdBy }),
  //       });
  //       setCurrentVersion(res.data.version);
  //       setDirty(false);
  //       setLastEdits(null);
  //       await refresh();
  //       toast.success("Changes applied.");
  //     } catch (err: any) {
  //       toast.error(err?.message || "Commit failed");
  //     } finally {
  //       setIsSaving(false);
  //     }
  //   },
  //   [api, patientId, accountNumber, refresh],
  // );
  // ─────────────────────────────────────────────────────────────────────

  /** MOCK version of commitDraft */
  const commitDraft = useCallback(
    async (_createdBy: string) => {
      if (!patientId || !accountNumber) return;
      try {
        setIsSaving(true);
        setDirty(false);
        setLastEdits(null);
        toast.success("Changes applied (mock).");
      } finally {
        setIsSaving(false);
      }
    },
    [patientId, accountNumber],
  );

  const discardDraft = useCallback(async () => {
    if (!patientId || !accountNumber) return;

    try {
      setIsDiscarding(true);
      setDirty(false);
      setLastEdits(null);

      await refresh();
      toast.info("No changes made");
    } catch (err: any) {
      toast.error(err?.message || "Discard failed");
    } finally {
      setIsDiscarding(false);
    }
  }, [patientId, accountNumber, refresh]);

  // ── ORIGINAL rollback (commented out – using mock data) ───────────────
  // const rollback = useCallback(
  //   async (version: string) => {
  //     if (!patientId || !accountNumber) return;
  //     try {
  //       setIsRollingBack(true);
  //       await api(`/drafts/${patientId}/${accountNumber}/rollback`, {
  //         method: "POST",
  //         headers: JSON_HEADERS,
  //         body: JSON.stringify({ targetVersion: version, createdBy: "anonymous" }),
  //       });
  //       await refresh();
  //       toast.success(`Draft rolled back to ${version}`);
  //     } catch (err: any) {
  //       toast.error(err?.message || "Rollback failed");
  //     } finally {
  //       setIsRollingBack(false);
  //     }
  //   },
  //   [api, patientId, accountNumber, refresh],
  // );
  // ─────────────────────────────────────────────────────────────────────

  /** MOCK version of rollback */
  const rollback = useCallback(
    async (version: string) => {
      if (!patientId || !accountNumber) return;
      try {
        setIsRollingBack(true);
        await loadAllData(patientId, accountNumber);
        toast.success(`Draft rolled back to ${version} (mock)`);
      } catch (err: any) {
        toast.error(err?.message || "Rollback failed");
      } finally {
        setIsRollingBack(false);
      }
    },
    [patientId, accountNumber, loadAllData],
  );

  // ── ORIGINAL handleSignoffConfirm (commented out – using mock data) ──
  // const handleSignoffConfirm = useCallback(
  //   async (signatureDataUrl: string) => {
  //     if (!patientId || !accountNumber) return;
  //     try {
  //       setIsSaving(true);
  //       const timezoneOffset = Intl.DateTimeFormat().resolvedOptions().timeZone;
  //       await api(`/drafts/${patientId}/${accountNumber}/sign`, {
  //         method: "POST",
  //         headers: JSON_HEADERS,
  //         body: JSON.stringify({
  //           signedBy: "anonymous",
  //           signatureImageData: signatureDataUrl,
  //           timezoneOffset,
  //         }),
  //       });
  //       setOpenSignoff(false);
  //       await refresh();
  //       toast.success("Document signed and locked");
  //     } catch (err: any) {
  //       toast.error(err?.message || "Signing failed");
  //     } finally {
  //       setIsSaving(false);
  //     }
  //   },
  //   [api, patientId, accountNumber, refresh],
  // );
  // ─────────────────────────────────────────────────────────────────────

  /** MOCK version of handleSignoffConfirm */
  const handleSignoffConfirm = useCallback(
    async (signatureDataUrl: string) => {
      if (!patientId || !accountNumber) return;
      try {
        setIsSaving(true);
        setSignoff({
          signedBy: "anonymous",
          signatureDataUrl,
          signedAt: new Date().toISOString(),
          isSigned: true,
        });
        setOpenSignoff(false);
        toast.success("Document signed and locked (mock)");
      } catch (err: any) {
        toast.error(err?.message || "Signing failed");
      } finally {
        setIsSaving(false);
      }
    },
    [patientId, accountNumber],
  );

  // ── ORIGINAL saveInline (commented out – using mock data) ─────────────
  // const saveInline = useCallback(
  //   async (pid: string, acc: string, inlineSections: InlineSection[]) => {
  //     try {
  //       setIsInlineSaving(true);
  //       await api(`/drafts/${pid}/${acc}/save-inline`, {
  //         method: "POST",
  //         headers: JSON_HEADERS,
  //         body: JSON.stringify({ patientId: pid, accountNumber: acc, sections: inlineSections }),
  //       });
  //       await loadAllData(pid, acc);
  //       toast.success("Version saved");
  //     } catch (err: any) {
  //       toast.error(err?.message || "Inline save failed");
  //     } finally {
  //       setIsInlineSaving(false);
  //     }
  //   },
  //   [api, loadAllData],
  // );
  // ─────────────────────────────────────────────────────────────────────

  /** MOCK version of saveInline */
  const saveInline = useCallback(
    async (_pid: string, _acc: string, inlineSections: InlineSection[]) => {
      try {
        setIsInlineSaving(true);
        // In mock mode, just update local sections state
        setSections(inlineSections);
        toast.success("Version saved (mock)");
      } catch (err: any) {
        toast.error(err?.message || "Inline save failed");
      } finally {
        setIsInlineSaving(false);
      }
    },
    [],
  );

  // ── ORIGINAL getVersionSnapshot (commented out – using mock data) ────
  // const getVersionSnapshot = useCallback(
  //   async (version: string) => {
  //     if (!patientId || !accountNumber) return null;
  //     try {
  //       setIsPreviewing(true);
  //       const res = await api(
  //         `/drafts/${patientId}/${accountNumber}/versions/${version}`,
  //       );
  //       return res.data ?? null;
  //     } catch (err: any) {
  //       toast.error(err?.message || "Preview failed");
  //       return null;
  //     } finally {
  //       setIsPreviewing(false);
  //     }
  //   },
  //   [api, patientId, accountNumber],
  // );
  // ─────────────────────────────────────────────────────────────────────

  /** MOCK version of getVersionSnapshot */
  const getVersionSnapshot = useCallback(
    async (_version: string) => {
      if (!patientId || !accountNumber) return null;
      try {
        setIsPreviewing(true);
        const res = mockGetVersionSnapshot(patientId, accountNumber);
        return res.data ?? null;
      } catch (err: any) {
        toast.error(err?.message || "Preview failed");
        return null;
      } finally {
        setIsPreviewing(false);
      }
    },
    [patientId, accountNumber],
  );

  const value = useMemo(
    () => ({
      patientId,
      accountNumber,
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
      setAccountNumber,
      setPatientId,
      prepareDraft,
      invokeAgent,
      discardDraft,
      commitDraft,
      rollback,
      getVersionSnapshot,
      saveInline,
    }),
    [
      patientId,
      accountNumber,
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
