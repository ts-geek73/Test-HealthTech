import { useEffect, useState, useCallback } from "react";
import { socket } from "@/lib/socket";
import api from "@/lib/api";
import { TrackedSession } from "@/types";

export const useSessionUpdates = () => {
  const [sessions, setSessions] = useState<TrackedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSessionIds, setNewSessionIds] = useState<Set<string>>(new Set());
  const [updatedSessionIds, setUpdatedSessionIds] = useState<Set<string>>(
    new Set(),
  );

  const fetchInitialSessions = useCallback(async () => {
    try {
      const { data } = await api.get("/sessions");
      if (data.success) {
        setSessions(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch initial sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialSessions();

    socket.connect();

    socket.on("connect", () => {
      console.log("✅ WebSocket connected to backend");
    });

    socket.on("session_created", (newSession: TrackedSession) => {
      setSessions((prev) => [newSession, ...prev]);
      setNewSessionIds((prev) => new Set(prev).add(newSession.id));
      setTimeout(() => {
        setNewSessionIds((prev) => {
          const next = new Set(prev);
          next.delete(newSession.id);
          return next;
        });
      }, 3000);
    });

    socket.on("session_updated", (updatedSession: TrackedSession) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      );
      setUpdatedSessionIds((prev) => new Set(prev).add(updatedSession.id));
      setTimeout(() => {
        setUpdatedSessionIds((prev) => {
          const next = new Set(prev);
          next.delete(updatedSession.id);
          return next;
        });
      }, 2000);
    });

    socket.on("disconnect", () => {
      console.log("🔌 WebSocket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("session_created");
      socket.off("session_updated");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [fetchInitialSessions]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data } = await api.patch(`/sessions/${id}`, { status });
      return data.success;
    } catch (err) {
      console.error("Failed to update session status:", err);
      return false;
    }
  };

  return { sessions, loading, updateStatus, newSessionIds, updatedSessionIds };
};
