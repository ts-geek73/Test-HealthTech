"use client";

import {
  ActivityLogTable,
  ContentGrid,
  DashboardSection,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { useContents, useSessionUpdates } from "@/hooks";

const HomePage: React.FC = () => {
  const {
    contents,
    loading: contentsLoading,
    handleContentClick,
  } = useContents();
  const {
    sessions,
    loading: sessionsLoading,
    updateStatus,
    newSessionIds,
    updatedSessionIds,
  } = useSessionUpdates();

  const totalLoading = contentsLoading || sessionsLoading;

  return (
    <div className="max-w-5xl w-full *:py-8 divide-y divide-zinc-200">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Control Dashboard
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Manage operational units and monitor session activity logs.
          </p>
        </div>
        <div className="flex gap-4">
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1 border-zinc-200 text-zinc-400 font-bold bg-zinc-50 tracking-widest text-[10px] uppercase"
          >
            System Online
          </Badge>
        </div>
      </header>

      <DashboardSection title="Operational Modules">
        <ContentGrid
          contents={contents}
          loading={totalLoading}
          onClick={handleContentClick}
        />
      </DashboardSection>

      <DashboardSection title="Activity Log" badgeCount={sessions.length}>
        <ActivityLogTable
          sessions={sessions}
          loading={totalLoading}
          onStatusUpdate={updateStatus}
          newSessionIds={newSessionIds}
          updatedSessionIds={updatedSessionIds}
        />
      </DashboardSection>
    </div>
  );
};

export default HomePage;
