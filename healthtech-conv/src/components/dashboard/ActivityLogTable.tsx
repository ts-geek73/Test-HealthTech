"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { MdModeEdit } from "react-icons/md";
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
type Column = {
  label: string;
  align?: "left" | "right";
};

const columns: Column[] = [
  { label: "Unit Name" },
  { label: "Status" },
  { label: "Created AT" },
  { label: "Actions", align: "right" },
];

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({
  sessions,
  loading,
  onStatusUpdate,
  newSessionIds = new Set(),
  onSessionClick,
}) => {
  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    if (!onStatusUpdate) return;
    // if (newStatus !== "active" && newStatus !== "complete") return;
    try {
      await onStatusUpdate(sessionId, newStatus as "active" | "complete");
    } catch (error) {
      console.error("Failed to update session status:", error);
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
                    <button
                      disabled={!isActive}
                      onClick={() => onSessionClick?.(session.id)}
                      className={cn(
                        "text-sm text-black font-bold uppercase text-left bg-transparent border-none p-0 outline-none transition-all",
                        isActive
                          ? "hover:underline underline-offset-4 cursor-pointer"
                          : "",
                      )}
                    >
                      {session?.content_title ?? "Unknown"}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-full border border-zinc-100 bg-white text-zinc-400 hover:text-black shadow-sm"
                  >
                    <MdModeEdit className="h-4 w-4" />
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
                        // isUpdating={updatingId === session.id}
                        isUpdating={false}
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

      <table className="hidden md:table w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-50/50 border-b border-zinc-100">
            {columns.map((col) => (
              <th
                key={col.label}
                className={`py-5 px-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400 ${
                  col.align === "right" ? "text-right" : ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {loading ? (
            <tr>
              <td
                colSpan={5}
                className="py-20 text-center font-mono text-[10px] text-zinc-300 animate-pulse uppercase tracking-[0.3em]"
              >
                Syncing logs...
              </td>
            </tr>
          ) : sessions.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-16 text-center text-zinc-400 font-medium text-sm"
              >
                No operational sessions logged yet.
              </td>
            </tr>
          ) : (
            sessions.map((session, index) => {
              // To Do: change status later
              const isActive = session?.status ?? "active" === "active";
              return (
                <tr
                  key={session.id + index}
                  className={cn(
                    "group w-full [&_td]:p-3 hover:bg-zinc-50/50 transition-colors",
                    newSessionIds.has(session.id) && "animate-row-enter",
                  )}
                >
                  <td className="pl-8!">
                    <button
                      disabled={!isActive}
                      onClick={() => onSessionClick?.(session.id)}
                      className={cn(
                        "text-sm text-black font-bold uppercase text-left bg-transparent border-none p-0 outline-none transition-all",
                        isActive
                          ? "hover:underline underline-offset-4 cursor-pointer"
                          : "",
                      )}
                    >
                      {session?.content_title ?? "Unknown"}
                    </button>
                  </td>
                  <td className="p-0! align-middle">
                    <StatusSelector
                      currentStatus={session?.status ?? "active"}
                      // isUpdating={updatingId === session.id}
                      isUpdating={false}
                      onUpdate={(newStatus) =>
                        handleStatusChange(session.id, newStatus)
                      }
                    />
                  </td>
                  <td>
                    <div className="flex flex-col text-sm text-zinc-600 font-bold">
                      {new Date(session.created_at).toLocaleDateString(
                        "en-US",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </td>
                  <td className="text-right pr-8!">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full hover:bg-white hover:border hover:border-zinc-200 transition-all text-zinc-400 hover:text-black"
                    >
                      <MdModeEdit className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogTable;
