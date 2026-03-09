"use client";

import { cn } from "@/lib/utils";
import { TrackedSession } from "@/types";
import Link from "next/link";
import React, { useState } from "react";
import { MdModeEdit } from "react-icons/md";
import { Button } from "../ui/button";

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
  updatedSessionIds = new Set(),
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    if (!onStatusUpdate) return;
    if (newStatus !== "active" && newStatus !== "complete") return;
    setUpdatingId(sessionId);
    try {
      await onStatusUpdate(sessionId, newStatus as "active" | "complete");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
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
            sessions.map((session, index) => (
              <tr
                key={session.id + index}
                className={cn(
                  "group w-full [&_td]:p-3 hover:bg-zinc-50/50 transition-colors",
                  newSessionIds.has(session.id) && "animate-row-enter",
                  updatedSessionIds.has(session.id) && "delay-300 ease-in-out",
                )}
              >
                <td>
                  <Link href={`/session/${session?.id}`}>
                    <span className="text-sm font-bold text-black hover:underline underline-offset-4 cursor-pointer">
                      {session.contents?.title || "Unknown"}
                    </span>
                  </Link>
                </td>
                <td className="p-0! align-middle">
                  <StatusSelector
                    currentStatus={session.status}
                    isUpdating={updatingId === session.id}
                    onUpdate={(newStatus) =>
                      handleStatusChange(session.id, newStatus)
                    }
                  />
                </td>
                <td>
                  <div className="flex flex-col text-sm text-zinc-600">
                    <span className="font-bold">
                      {new Date(session.created_at).toLocaleDateString(
                        "en-US",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </td>
                <td className="text-right">
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full hover:bg-white hover:border hover:border-zinc-200 transition-all text-zinc-400 hover:text-black"
                    onClick={() => console.log("Update clicked")}
                  >
                    <MdModeEdit className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogTable;
