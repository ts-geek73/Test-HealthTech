import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { TrackedSession } from "@/types";

export const useSessionDetail = (id: string) => {
  const [session, setSession] = useState<TrackedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/sessions/${id}`);
      if (data.success) {
        setSession(data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch session:", err);
      setError(err.message || "Failed to fetch session");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
};
