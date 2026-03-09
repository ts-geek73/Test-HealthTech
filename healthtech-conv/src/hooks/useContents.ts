import api from "@/lib/api";
import type { Content, TrackedSession } from "@/types/session";
import { useCallback, useEffect, useState } from "react";

export const MOCK_PATIENTS = [
  {
    pid: "mrn2093",
    acc: "acc2093",
    summary:
      "Psychiatric Diagnoses: Major Depressive Disorder, GAD, Cannabis Use Disorder, PTSD.",
  },
  {
    pid: "mrn2094",
    acc: "acc2094",
    summary:
      "Brief Summary: Significant mental health concerns, including feelings of being overwhelmed.",
  },
  {
    pid: "mrn2095",
    acc: "acc2095",
    summary:
      "Recommendations: Continue residential level of care for observation and stabilization.",
  },
  {
    pid: "mrn2096",
    acc: "acc2096",
    summary:
      "Diagnoses: Disruptive Mood Dysregulation Disorder (DMDD) and Generalized Anxiety Disorder (GAD).",
  },
];

export const trackVisit = async (
  contentId: string,
): Promise<TrackedSession | null> => {
  try {
    const { data } = await api.post("/sessions", {
      content_id: contentId,
    });
    return data?.success ? data?.data : null;
  } catch (err) {
    console.error("❌ Error tracking session visit:", err);
    return null;
  }
};

export const useContents = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/contents");
      if (data.success) {
        setContents(data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch contents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  return {
    contents,
    loading,
    error: null,
    refetch: fetchContents,
  };
};
