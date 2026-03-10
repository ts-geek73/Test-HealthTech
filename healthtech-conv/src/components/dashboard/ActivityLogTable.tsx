"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { HiArrowRight } from "react-icons/hi";
import { Button } from "../ui/button";

import type { TrackedSession } from "@/types/session";
import StatusSelector from "./StatusSelector";

interface ActivityLogTableProps {
  sessions: TrackedSession[];
  loading: boolean;
  onStatusUpdate?: (
    id: string,
    status: "active" | "complete",
  ) => Promise<boolean>;
  newSessionIds?: Set<string>;
  updatedSessionIds?: Set<string>;
  onSessionClick?: (id: string) => void;
}

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({
  sessions,
  loading,
  onStatusUpdate,
  newSessionIds = new Set(),
  onSessionClick,
}) => {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    if (!onStatusUpdate) return;
    if (newStatus !== "active" && newStatus !== "complete") return;

    try {
      setUpdatingId(sessionId);
      await onStatusUpdate(sessionId, newStatus as "active" | "complete");
    } catch (error) {
      console.error("Failed to update session status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="md:hidden grid grid-cols-1 divide-y divide-zinc-100">
        {loading ? (
          <div className="py-20 text-center font-mono text-[10px] text-zinc-300 animate-pulse uppercase tracking-[0.3em]">
            Syncing logs...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 font-medium text-sm">
            No operational sessions logged yet.
          </div>
        ) : (
          sessions.map((session, index) => {
            const isActive = session.status === "active";

            return (
              <div
                key={session.id + index + "-mobile"}
                className={cn(
                  "p-5 flex flex-col gap-4 transition-colors hover:bg-zinc-50/50",
                  newSessionIds.has(session.id) && "animate-row-enter",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">
                      Unit Name
                    </span>

                    <span className="text-sm text-black font-bold uppercase">
                      {session?.content_title ?? "Unknown"}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    disabled={!isActive}
                    onClick={() => onSessionClick?.(session.id)}
                    className={cn(
                      "h-9 w-9 p-0 rounded-full border border-zinc-100 bg-white shadow-sm transition-all",
                      isActive
                        ? "text-zinc-400 hover:text-black"
                        : "text-zinc-200 cursor-not-allowed",
                    )}
                  >
                    <HiArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">
                      Operational Status
                    </span>

                    <div className="scale-95 origin-left">
                      <StatusSelector
                        currentStatus={session?.status ?? "active"}
                        isUpdating={updatingId === session.id}
                        onUpdate={(newStatus) =>
                          handleStatusChange(session.id, newStatus)
                        }
                      />
                    </div>
                  </div>

                  <div className="text-right flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">
                      Logged At
                    </span>

                    <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-wider">
                      {new Date(session.created_at).toLocaleDateString(
                        "en-US",
                        {
                          day: "2-digit",
                          month: "short",
                        },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-[1fr_1fr_1fr_0.5fr] bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <div className="py-5 px-8">Unit Name</div>
          <div className="py-5 px-3">Status</div>
          <div className="py-5 px-3">Created At</div>
          <div className="py-5 px-8 text-right">Actions</div>
        </div>

        <div className="divide-y divide-zinc-100">
          {loading ? (
            <div className="py-20 text-center font-mono text-[10px] text-zinc-300 animate-pulse uppercase tracking-[0.3em]">
              Syncing logs...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 font-medium text-sm">
              No operational sessions logged yet.
            </div>
          ) : (
            sessions.map((session, index) => {
              const isActive = session?.status === "active";

              return (
                <div
                  key={session.id + index}
                  className={cn(
                    "grid grid-cols-[1fr_1fr_1fr_0.5fr] items-center hover:bg-zinc-50/50 transition-colors",
                    newSessionIds.has(session.id) && "animate-row-enter",
                  )}
                >
                  <div className="px-8 py-4 text-sm text-black font-bold uppercase">
                    {session?.content_title ?? "Unknown"}
                  </div>

                  <div className="px-3 py-4">
                    <StatusSelector
                      currentStatus={session?.status ?? "active"}
                      isUpdating={updatingId === session.id}
                      onUpdate={(newStatus) =>
                        handleStatusChange(session.id, newStatus)
                      }
                    />
                  </div>

                  <div className="px-3 py-4 text-sm text-zinc-600 font-bold">
                    {new Date(session.created_at).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  <div className="px-8 py-4 flex justify-end">
                    <Button
                      variant="ghost"
                      disabled={!isActive}
                      onClick={() => onSessionClick?.(session.id)}
                      className={cn(
                        "h-8 w-8 p-0 rounded-full transition-all",
                        isActive
                          ? "hover:bg-white hover:border hover:border-zinc-200 text-zinc-400 hover:text-black"
                          : "text-zinc-200 cursor-not-allowed",
                      )}
                    >
                      <HiArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogTable;