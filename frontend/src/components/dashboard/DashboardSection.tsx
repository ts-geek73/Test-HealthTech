import React from "react";
import { Badge } from "@/components/ui/badge";

interface DashboardSectionProps {
  title: string;
  badgeCount?: number;
  children: React.ReactNode;
  className?: string;
  badgeContent?: React.ReactNode;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  badgeCount,
  children,
  className = "",
  badgeContent,
}) => {
  return (
    <section className={`space-y-8 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-400">
          {title}
        </h2>
        {badgeCount !== undefined ? (
          <Badge
            variant="outline"
            className="rounded-full px-2 py-1 border-zinc-100 text-zinc-400 font-mono text-xs"
          >
            {badgeCount} {badgeCount === 1 ? "ENTRY" : "ENTRIES"}
          </Badge>
        ) : (
          badgeContent
        )}
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
