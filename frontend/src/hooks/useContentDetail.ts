import { useSession } from "@/context";
import api from "@/lib/api";
import { Content } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackVisit } from "./useContents";


export const useContentDetail = (
  id: string,
  shouldActivate: boolean = false,
) => {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activate } = useSession();
  const hasTracked = useRef(false);

  const fetchContent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/contents/${id}`);
      if (data.success) {
        setContent(data.data);
        if (shouldActivate && !hasTracked.current) {
          hasTracked.current = true;
          await trackVisit(data.data.id, activate);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch content");
    } finally {
      setLoading(false);
    }
  }, [id, shouldActivate, trackVisit]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, error, refetch: fetchContent };
};
