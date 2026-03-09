"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ActivatedSession {
  sessionId: string;
  contentId: string;
}

interface SessionContextType {
  activatedSessions: ActivatedSession[];
  activate: (sessionId: string, contentId: string) => void;
  getSessionByContentId: (contentId: string) => string | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activatedSessions, setActivatedSessions] = useState<
    ActivatedSession[]
  >([]);

  useEffect(() => {
    const stored = localStorage.getItem("activatedSessions");
    if (stored) {
      try {
        setActivatedSessions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse activated sessions:", e);
      }
    }
  }, []);

  const activate = (sessionId: string, contentId: string) => {
    setActivatedSessions((prev) => {
      if (prev.some((s) => s.sessionId === sessionId)) return prev;
      const next = [...prev, { sessionId, contentId }];
      localStorage.setItem("activatedSessions", JSON.stringify(next));
      return next;
    });
  };

  const getSessionByContentId = (contentId: string) => {
    return activatedSessions.find((s) => s.contentId === contentId)?.sessionId;
  };

  return (
    <SessionContext.Provider
      value={{
        activatedSessions,
        activate,
        getSessionByContentId,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
