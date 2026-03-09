import api from "@/lib/api";
import type { Content, TrackedSession } from "@/types/session";
import { useCallback, useEffect, useState } from "react";

const MOCK_PATIENTS = [
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
  pid: string,
): Promise<TrackedSession | null> => {
  try {
    const { data } = await api.post("/sessions/track", {
      pid: pid,
      status: "active",
    });
    if (data.success) {
      console.log("✅ Activity logged to sessions table");
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

  const fetchContents = useCallback(async () => {
    setLoading(true);
    setTimeout(() => {
      const mockContents: Content[] = MOCK_PATIENTS.map((p) => ({
        pid: p.pid,
        acc: p.acc,
        content: p.summary,
        created_at: new Date().toISOString(),
      }));
      setContents(mockContents);
      setLoading(false);
    }, 300);
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
