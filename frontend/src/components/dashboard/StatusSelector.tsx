"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import React from "react";
import { HiChevronUpDown } from "react-icons/hi2";

const statusOptions = [
  {
    value: "active",
    label: "Active",
    color: "bg-emerald-500",
    dotColor: "bg-emerald-800",
  },
  {
    value: "complete",
    label: "Complete",
    color: "bg-blue-500",
    dotColor: "bg-blue-800",
  },
];

interface StatusSelectorProps {
  currentStatus: "active" | "complete";
  isUpdating: boolean;
  onUpdate: (status: "active" | "complete") => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({
  currentStatus,
  isUpdating,
  onUpdate,
}) => {
  const activeOption =
    statusOptions.find((opt) => opt.value === currentStatus.toLowerCase()) ||
    statusOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isUpdating}
          className={cn(
            "flex items-center h-full gap-2 px-3 py-2 rounded-full border border-zinc-200 bg-white text-xs font-bold uppercase tracking-widest transition-all outline-none text-white",
            activeOption.color,
            isUpdating
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-zinc-300 hover:shadow-sm active:scale-95 cursor-pointer focus:ring-2 focus:ring-zinc-100",
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", activeOption.dotColor)} />
          <span>{activeOption.label}</span>
          {isUpdating ? (
            <div className="w-3 h-3 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          ) : (
            <HiChevronUpDown className="w-3 h-3 text-zinc-700" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-40 p-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl space-y-1"
      >
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              if (option.value !== currentStatus.toLowerCase()) {
                onUpdate(option.value as "active" | "complete");
              }
            }}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer",
              "text-white hover:text-white focus:text-white/90",
              option.color,
              `hover:${option.color}`,
              `focus:${option.color}`,
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", option.dotColor)} />
              {option.label}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusSelector;
