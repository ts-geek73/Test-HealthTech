"use client";

import { Button } from "@/components/ui/button";
import { useSessionUpdates } from "@/hooks/useSessionUpdates";
import api from "@/lib/api";
import { useDraft } from "@/providers/DraftProvider";
import type { TrackedSession } from "@/types/session";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DraftSummary from "../draft-summary";

const PID_TO_ACC: Record<string, string> = {
  mrn2093: "acc2093",
  mrn2094: "acc2094",
  mrn2095: "acc2095",
  mrn2096: "acc2096",
};

const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { prepareDraft, patientId: currentPid } = useDraft();
  const { sessions, loading: sessionsLoading } = useSessionUpdates();
  const [session, setSession] = useState<TrackedSession | null>(null);
  const [loading, setLoading] = useState(true);

  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === "active"),
    [sessions],
  );

  const fetchSession = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/sessions/${id}`);
      if (data.success) {
        setSession(data.data);
        const pid = data.data.pid;
        const acc = PID_TO_ACC[pid] || "unknown";

        if (currentPid !== pid) {
          await prepareDraft(pid, acc);
        }
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id]);

  const currentIndex = useMemo(() => {
    if (!session) return -1;
    return activeSessions.findIndex((s) => s.id === session.id);
  }, [activeSessions, session]);

  const nextSession = useMemo(() => {
    if (currentIndex === -1) return null;
    if (currentIndex + 1 >= activeSessions.length) {
      const tempIndex = (currentIndex + 1) % activeSessions.length;
      return activeSessions[tempIndex];
    }
    return activeSessions[currentIndex + 1];
  }, [activeSessions, currentIndex]);

  const handleNextSession = () => {
    if (nextSession) {
      navigate(`/session/${nextSession.id}`);
    }
  };

  if (loading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <h2 className="text-xl font-bold">Session Not Found</h2>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <DraftSummary
        session={session}
        onNextSession={handleNextSession}
        hasNext={!!nextSession}
      />
    </div>
  );
};

export default SessionDetailPage;
