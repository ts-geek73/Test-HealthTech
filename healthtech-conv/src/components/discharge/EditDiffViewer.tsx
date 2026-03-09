import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiffMatchPatch from "diff-match-patch";
import { CheckCircle2, GitCompare, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { EditResponse } from "../draft-summary/hooks/useDraftSummary";

const dmp = new DiffMatchPatch();

function computeWordDiffs(original: string, updated: string) {
  const tokens: string[] = [];
  const tokenMap = new Map<string, number>();

  function encode(text: string): string {
    return (text.match(/\S+\s*|\s+/g) ?? [])
      .map((tok) => {
        if (!tokenMap.has(tok)) {
          tokenMap.set(tok, tokens.length);
          tokens.push(tok);
        }
        return String.fromCodePoint(0xe000 + tokenMap.get(tok)!);
      })
      .join("");
  }

  const encoded1 = encode(original);
  const encoded2 = encode(updated);
  const diffs = dmp.diff_main(encoded1, encoded2, false);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([op, chars]) => ({
    op,
    text: [...chars].map((c) => tokens[c.codePointAt(0)! - 0xe000]).join(""),
  }));
}

function InlineDiff({
  original,
  updated,
}: {
  original: string;
  updated: string;
}) {
  const diffs = useMemo(
    () => computeWordDiffs(original ?? "", updated ?? ""),
    [original, updated],
  );

  return (
    <div className="flex flex-col sm:flex-row rounded-lg overflow-hidden border border-border text-[13px] leading-relaxed">
      <div className="flex-1 min-w-0 p-2.5 sm:p-3 bg-muted/20">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/50 font-semibold mb-1 sm:mb-1.5">
          Before
        </div>
        <p className="whitespace-pre-wrap break-words text-foreground/80 text-xs sm:text-[13px]">
          {diffs.map(({ op, text }, i) => {
            if (op === 1) return null;
            if (op === 0) return <span key={i}>{text}</span>;
            return (
              <mark
                key={i}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "rgba(185,28,28,0.85)",
                }}
                className="rounded-[3px] px-0.5 line-through decoration-red-300/60"
              >
                {text}
              </mark>
            );
          })}
        </p>
      </div>

      <div className="sm:w-px sm:h-auto w-full h-px bg-border shrink-0" />

      <div className="flex-1 min-w-0 p-2.5 sm:p-3 bg-muted/10">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/50 font-semibold mb-1 sm:mb-1.5">
          After
        </div>
        <p className="whitespace-pre-wrap break-words text-foreground/80 text-xs sm:text-[13px]">
          {diffs.map(({ op, text }, i) => {
            if (op === -1) return null;
            if (op === 0) return <span key={i}>{text}</span>;
            return (
              <mark
                key={i}
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "rgba(21,128,61,0.9)",
                }}
                className="rounded-[3px] px-0.5"
              >
                {text}
              </mark>
            );
          })}
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
   Main Component
============================================================================ */

interface Props {
  editResponse: EditResponse | null;
  loading: boolean;
  onClose?: () => void;
  commitDraft: (createdBy: string) => Promise<void>;
  handleDiscard: () => Promise<void>;
}

const EditDiffViewer: React.FC<Props> = ({
  editResponse,
  loading,
  onClose,
  commitDraft,
  handleDiscard,
}) => {
  const [iLoading, setILoading] = useState(false);
  if (loading || iLoading) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <div className="h-7 w-24 rounded bg-muted animate-pulse" />
          <div className="ml-auto h-7 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-md border border-border p-3 space-y-2 animate-pulse"
            >
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-8 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!editResponse) return null;

  if (!editResponse.success) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            Review Changes
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {editResponse.message || "Failed to process updates"}
          </div>
        </div>
      </div>
    );
  }

  if (editResponse.needsClarification) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            Review Changes
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">Clarification Required</p>
            <p>
              {editResponse.message ||
                "The assistant needs more information before making changes."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!editResponse.edits?.length) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            Review Changes
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            No changes were detected
          </p>
        </div>
      </div>
    );
  }
  const handleAccept = async () => {
    setILoading(true);
    await commitDraft("anonymous");
    setILoading(false);
    onClose?.();
  };

  const handleCancel = async () => {
    onClose?.();
    await handleDiscard();
  };

  const displayResponse = editResponse || editResponse;

  return (
    <div className="border-t border-border bg-card shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      <Tabs defaultValue="changes" className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border">
          <div className="flex items-center justify-between px-4 py-2 sm:py-0">
            <TabsList className="h-8 bg-muted/50 p-1">
              <TabsTrigger
                value="changes"
                className="text-xs sm:text-sm gap-1.5 h-6 sm:h-7 px-2 sm:px-3 data-[state=active]:bg-background"
              >
                <GitCompare className="h-3.5 w-3.5" />
                <span>Changes</span>
                <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 font-bold">
                  {displayResponse.edits.length}
                </span>
              </TabsTrigger>

              {displayResponse.message && (
                <TabsTrigger
                  value="summary"
                  className="text-xs sm:text-sm gap-1.5 h-6 sm:h-7 px-2 sm:px-3 data-[state=active]:bg-background"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Summary</span>
                </TabsTrigger>
              )}
            </TabsList>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:hidden text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 px-4 py-2 sm:py-2 bg-muted/20 sm:bg-transparent border-t sm:border-t-0 border-border">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold flex-1 sm:flex-initial px-4"
                onClick={handleCancel}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs font-semibold flex-1 sm:flex-initial px-4 bg-black hover:bg-zinc-800 text-white shadow-sm"
                onClick={handleAccept}
              >
                Accept All
              </Button>
            </div>
            <div className="hidden sm:flex items-center ml-2 pl-2 border-l border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="changes" className="mt-0">
          <div className="max-h-[45vh] sm:max-h-64 overflow-y-auto p-3 sm:p-4 space-y-3 thin-scrollbar">
            {displayResponse.edits.map((edit, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/60 bg-white/50 p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-bold text-zinc-700 uppercase tracking-tight">
                    {edit.title}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {(edit.confidence * 100).toFixed(0)}% Match
                    </span>
                  </div>
                </div>
                <InlineDiff original={edit.original} updated={edit.updated} />
              </div>
            ))}
          </div>
        </TabsContent>

        {displayResponse.message && (
          <TabsContent value="summary" className="mt-0">
            <div className="p-4 sm:p-6 bg-white/50">
              <div className="max-w-2xl">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 leading-none">
                  AI Transformation Summary
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
                  {displayResponse.message}
                </p>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EditDiffViewer;
