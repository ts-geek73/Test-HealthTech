import { Button } from "@/components/ui/button";
import type { HistoryItem, SignoffData } from "@/providers/DraftProvider";
import { ChevronDown, Clock, Eye, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AlertDialog from "./AlertDialog";

// eslint-disable-next-line react-refresh/only-export-components
export function normalizeVersion(
  version: string | number | null | undefined,
): string | null {
  if (version === null || version === undefined) return null;
  const str = String(version).trim();
  if (!str) return null;
  const match = str.match(/\d+/);
  return match ? String(Number(match[0])) : str.toLowerCase();
}

function formatVersion(version?: string | number | null): string | null {
  if (version === null || version === undefined) return null;
  const str = String(version).trim();
  if (!str) return null;
  const match = str.match(/\d+/);
  return `Version ${match ? Number(match[0]) : str}`;
}

function formatTimestamp(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  );
}

export interface VersionHistoryDropdownProps {
  versions: HistoryItem[];
  currentVersion?: string | number | null;
  previewVersion?: string | number | null;
  signoff: SignoffData | null;
  onPreview?: (version: string) => void;
  onRestore?: (version: string) => void;
  onCompare?: (version: string) => void;
}

function formatVersionCompact(version?: string | number | null): string | null {
  if (version === null || version === undefined) return null;
  const str = String(version).trim();
  if (!str) return null;
  const match = str.match(/\d+/);
  return `v${match ? Number(match[0]) : str}`;
}

const VersionHistoryDropdown = ({
  versions,
  currentVersion,
  previewVersion,
  onRestore,
  onCompare,
  signoff,
}: VersionHistoryDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<HistoryItem | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSelected(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!versions?.length) return null;

  const hasMultiple = versions.length > 1;

  const normalizedCurrent = normalizeVersion(currentVersion);
  const normalizedPreview = normalizeVersion(previewVersion);

  const isPreviewingOldVersion =
    normalizedPreview !== null && normalizedPreview !== normalizedCurrent;

  const activeVersion = isPreviewingOldVersion
    ? previewVersion
    : currentVersion;
  const normalizedActive = normalizeVersion(activeVersion);

  const displayLabel = formatVersion(activeVersion) ?? "Versions";
  const displayLabelCompact = formatVersionCompact(activeVersion) ?? "v";

  const sorted = [...versions].reverse();

  return (
    <>
      <div className="relative" ref={ref}>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMultiple}
          className="h-8 gap-1 md:gap-1.5 text-[10px] md:text-xs font-medium px-2 md:px-3"
          onClick={() => {
            if (!hasMultiple) return;
            setOpen((o) => !o);
          }}
        >
          <Clock className="hidden sm:inline h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">{displayLabel}</span>
          <span className="sm:hidden uppercase">{displayLabelCompact}</span>

          {isPreviewingOldVersion && (
            <span className="text-[9px] text-blue-500 font-semibold md:ml-0.5">
              •
            </span>
          )}

          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </Button>

        {open && (
          <div className="absolute left-[80%] xs:max-sm:left-3/4 max-sm:-translate-x-1/2 sm:right-0 top-full mt-1.5 w-[calc(100vw-2rem)] sm:w-72 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                Version History
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground/60">
                {versions.length} version{versions.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
              {sorted.map((v, i) => {
                const normalizedItem = normalizeVersion(v.version);

                const isCurrent = normalizedItem === normalizedCurrent;
                const isActiveInEditor = normalizedItem === normalizedActive;
                const isBeingPreviewed =
                  isActiveInEditor && isPreviewingOldVersion;

                const isActionable = hasMultiple;
                const isSelected = selected === String(v.version);

                return (
                  <div key={String(v.version)}>
                    <div
                      onClick={() => {
                        if (!isActionable || isCurrent) return;
                        setSelected(isSelected ? null : String(v.version));
                      }}
                      className={`rounded-lg px-2 md:px-3 py-2 md:py-2.5 transition-colors ${
                        !isActionable
                          ? "border border-border bg-muted/30 cursor-default"
                          : isSelected
                            ? "bg-secondary border border-border cursor-pointer"
                            : "hover:bg-muted/60 border border-transparent cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {formatVersion(v.version)}
                          </span>

                          {isCurrent && (
                            <span
                              className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full font-semibold transition-opacity ${
                                isPreviewingOldVersion
                                  ? "bg-muted text-muted-foreground opacity-50"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              Current
                            </span>
                          )}

                          {isBeingPreviewed && (
                            <span className="text-[9px] uppercase tracking-wide bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                              Previewing
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground/60">
                          {v.createdBy}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {formatTimestamp(v.timestamp)}
                        </span>
                      </div>

                      {isSelected && isActionable && (
                        <div className="flex gap-2 mt-2.5 pt-2 border-t border-border">
                          {(isCurrent
                            ? isPreviewingOldVersion
                            : !isBeingPreviewed) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompare?.(String(v.version));
                                setSelected(null);
                                setOpen(false);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          )}

                          {!signoff?.isSigned && !isCurrent && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRestoreTarget(v);
                                setSelected(null);
                                setOpen(false);
                              }}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Make Current
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {i < sorted.length - 1 && (
                      <div className="flex justify-start pl-4 py-0.5">
                        <div className="w-px h-2 bg-border" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        onConfirm={() => {
          if (restoreTarget) {
            onRestore?.(String(restoreTarget.version));
            setRestoreTarget(null);
          }
        }}
        content={{
          title: `Make ${formatVersion(restoreTarget?.version)} current?`,
          description: `This will create a new version with the content of ${formatVersion(restoreTarget?.version)} to preserve the history.`,
          actionText: "Make Current",
        }}
      />
    </>
  );
};

export default VersionHistoryDropdown;
