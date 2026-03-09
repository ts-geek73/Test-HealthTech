import { useSession } from "@/context";
import api from "@/lib/api";
import { Content, TrackedSession } from "@/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export const trackVisit = async (
  contentId: string,
  activate: (sessionId: string, contentId: string) => void,
): Promise<TrackedSession | null> => {
  try {
    const { data } = await api.post("/sessions/track", {
      content_id: contentId,
      status: "active",
    });
    console.log("✅ Activity logged to sessions table");
    if (data.success) {
      activate(data?.data?.id, contentId);
    }
    return data?.data;
  } catch (err) {
    console.error("❌ Error tracking session visit:", err);
    return null;
  }
};
export const useContents = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activate, getSessionByContentId } = useSession();
  const router = useRouter();

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/contents");
      if (data.success) {
        setContents(data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard contents:", err);
      setError(err.message || "Failed to fetch contents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleContentClick = async (contentId: string) => {
    // const existingSessionId = getSessionByContentId(contentId);
    // if (existingSessionId) {
    //   router.push(`/session/${existingSessionId}`);
    //   return;
    // }
    const session = await trackVisit(contentId, activate);
    if (session?.id) {
      await router.push(`/session/${session?.id}`);
    }
  };

  return {
    contents,
    loading,
    error,
    refetch: fetchContents,
    handleContentClick,
  };
};
