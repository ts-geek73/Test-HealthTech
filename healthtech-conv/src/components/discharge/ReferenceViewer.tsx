import { FileText, X, Search, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Reference {
  id: string;
  content: string;
}

interface ReferenceViewerProps {
  open: boolean;
  onClose: () => void;
  references: Reference[];
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatClinicalTextToHtml(text: string) {
  if (!text) return "";

  // 1. Escape HTML
  let safe = escapeHtml(text);

  // 2. Normalize spaces
  safe = safe.replace(/\s+/g, " ");

  // 3. Inject line breaks before ALL CAPS headers
  // Example: "CHIEF COMPLAINT:" → "\n\nCHIEF COMPLAINT:"
  const headerRegex = /([A-Z][A-Z\s/()-]{3,}):/g;

  safe = safe.replace(headerRegex, "\n\n$1:\n");

  // 4. Split into blocks
  const blocks = safe
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  let html = "";

  for (let block of blocks) {
    // Section header
    if (/^[A-Z][A-Z\s/()-]{3,}:$/.test(block)) {
      const title = block.replace(":", "").trim();

      html += `
        <h4 class="clinical-heading">
          ${title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
        </h4>
      `;
      continue;
    }

    // Break very long paragraphs
    const sentences = block.split(/(?<=\.)\s+/);

    if (sentences.length > 3) {
      sentences.forEach((s) => {
        html += `<p class="clinical-text">${s}</p>`;
      });
    } else {
      html += `<p class="clinical-text">${block}</p>`;
    }
  }

  return html;
}
function ReferenceModal({
  reference,
  open,
  onClose,
}: {
  reference: Reference | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!reference) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[50%] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold truncate">
            <FileText className="h-4 w-4 text-primary" />
            {reference.id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div
            className="space-y-3 text-sm text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: formatClinicalTextToHtml(reference.content),
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ReferenceViewer = ({
  open,
  onClose,
  references,
}: ReferenceViewerProps) => {
  const [search, setSearch] = useState("");
  const [activeRef, setActiveRef] = useState<Reference | null>(null);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        !activeRef
      ) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handler);
    }

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose, activeRef]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    return references.filter((r) =>
      r.id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [references, search]);

  if (!open) return null;

  return (
    <>
      <div
        ref={popupRef}
        className="fixed top-14 right-5 sm:right-36 z-50 w-72 bg-card border border-border rounded-xl shadow-xl flex flex-col"
        style={{ maxHeight: "min(360px, calc(100vh - 80px))" }}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />

            <span className="text-xs font-semibold text-foreground">
              References
            </span>

            {references.length > 0 && (
              <span className="text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded-full">
                {references.length}
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {references.length > 3 && (
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg">
              <Search className="h-3 w-3 text-muted-foreground/50 shrink-0" />

              <input
                type="text"
                placeholder="Search references…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-[11px] bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FileText className="h-6 w-6 text-muted-foreground/20" />

              <p className="text-[11px] text-muted-foreground/40">
                No references found
              </p>
            </div>
          ) : (
            <div className="py-1.5 px-1.5 space-y-0.5">
              {filtered.map((ref, i) => (
                <button
                  key={ref.id}
                  onClick={() => setActiveRef(ref)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
                >
                  <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0 w-4 text-right">
                    {i + 1}.
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate leading-snug">
                      {ref.id}
                    </p>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/60 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReferenceModal
        reference={activeRef}
        open={!!activeRef}
        onClose={() => setActiveRef(null)}
      />
    </>
  );
};

export default ReferenceViewer;
