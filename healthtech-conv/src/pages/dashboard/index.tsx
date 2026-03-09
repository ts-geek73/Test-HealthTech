"use client";

import {
  ActivityLogTable,
  ContentGrid,
  DashboardSection,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { trackVisit, useContents } from "@/hooks/useContents";
import { useSessionUpdates } from "@/hooks/useSessionUpdates";
import { useNavigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const { contents, loading: contentsLoading } = useContents();
  const {
    sessions,
    loading: sessionsLoading,
    updateStatus,
    newSessionIds,
    updatedSessionIds,
  } = useSessionUpdates();
  const navigate = useNavigate();

  const totalLoading = contentsLoading || sessionsLoading;

  const handleContentClick = async (pid: string) => {
    const session = await trackVisit(pid);
    if (session?.id) {
      navigate(`/session/${session.id}`);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session && session.status === "active") {
      navigate(`/session/${session.id}`);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto p-4 md:p-8 divide-y divide-zinc-200">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Clinical Control Dashboard
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Monitor patient sessions and manage clinical documentation units.
          </p>
        </div>
        <Badge
          variant="outline"
          className="rounded-full px-4 py-1 border-zinc-200 text-zinc-400 font-bold bg-zinc-50 tracking-widest text-[10px] uppercase"
        >
          System Online
        </Badge>
      </header>

      <div className="py-8">
        <DashboardSection title="Documentation Modules">
          <ContentGrid
            contents={contents}
            loading={totalLoading}
            onClick={handleContentClick}
          />
        </DashboardSection>
      </div>

      <div className="py-8">
        <DashboardSection
          title="Clinical Activity Log"
          badgeCount={sessions.length}
        >
          <ActivityLogTable
            sessions={sessions}
            loading={totalLoading}
            onStatusUpdate={updateStatus}
            newSessionIds={newSessionIds}
            updatedSessionIds={updatedSessionIds}
            onSessionClick={handleSessionClick}
          />
        </DashboardSection>
      </div>
    </div>
  );
};

export default DashboardPage;
