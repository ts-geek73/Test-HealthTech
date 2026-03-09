"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/context";
import { useSessionDetail } from "@/hooks";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi2";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

const SessionLoading = () => (
  <div className="max-w-4xl w-full mx-auto bg-white border border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] min-h-[500px] p-12 space-y-8 animate-pulse">
    <div className="flex justify-between items-center border-b border-zinc-50 pb-4">
      <div className="h-4 w-24 bg-zinc-100 rounded" />
      <div className="flex gap-6">
        <div className="h-4 w-20 bg-zinc-100 rounded" />
        <div className="h-4 w-28 bg-zinc-100 rounded" />
      </div>
    </div>
    <div className="space-y-4">
      <div className="h-10 w-3/4 bg-zinc-100 rounded" />
      <div className="h-px bg-zinc-100 w-full" />
    </div>
    <div className="space-y-6">
      <div className="h-6 w-full bg-zinc-50 rounded" />
      <div className="h-6 w-5/6 bg-zinc-50 rounded" />
      <div className="h-6 w-4/6 bg-zinc-50 rounded" />
      <div className="h-6 w-full bg-zinc-50 rounded" />
    </div>
    <div className="pt-6 border-t border-zinc-50 flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-3 w-48 bg-zinc-50 rounded" />
        <div className="h-4 w-24 bg-zinc-50 rounded" />
      </div>
      <div className="h-10 w-32 bg-zinc-100 rounded-full" />
    </div>
  </div>
);

const SessionPage: React.FC<SessionPageProps> = ({ params }) => {
  const { id } = React.use(params);
  const router = useRouter();
  const { session, loading: sessionLoading } = useSessionDetail(id);
  const { activatedSessions } = useSession();
  const activatedIds = useMemo(
    () => activatedSessions.map((s) => s.sessionId),
    [activatedSessions],
  );

  const content = session?.contents;
  const currentIndex = useMemo(() => {
    return activatedIds.findIndex((i) => i === id);
  }, [activatedIds, id]);

  const nextId = useMemo(() => {
    if (currentIndex === -1) return null;
    if (activatedIds?.length === 1) return null;
    if (currentIndex + 1 > activatedIds.length - 1) {
      const temp = (currentIndex + 1) % activatedIds.length;
      return activatedIds[temp];
    }

    return activatedIds[currentIndex + 1];
  }, [currentIndex, activatedIds]);

  if (sessionLoading) {
    return <SessionLoading />;
  }
  if (!session) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto bg-white border border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] min-h-[500px] p-12 space-y-5">
      <nav className="flex justify-between items-center text-xs font-medium text-zinc-400 uppercase tracking-widest border-b border-zinc-50">
        <Link
          href="/"
          className="hover:text-black transition-colors flex items-center gap-2"
        >
          <HiArrowLeft className="text-sm" />
          Dashboard
        </Link>
        <div className="flex gap-6">
          <span>Ref: {session?.content_id.slice(0, 8)}</span>
          <span>
            {new Date(content?.created_at ?? "").toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </nav>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-black leading-[1.2]">
          {content?.title ?? ""}
        </h1>
        <div className="h-px bg-zinc-200 w-full" />
      </div>

      <article className="space-y-8 text-lg font-normal text-[#4A4A4A] leading-[1.8] min-h-[350px]">
        {content?.content ? (
          content?.content
            .split("\n\n")
            .map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
        ) : (
          <p className="italic text-zinc-300">
            No core documentation records found for this operational ID.
          </p>
        )}
      </article>

      <div className="pt-6 border-t border-zinc-100 flex justify-between items-center italic text-xs text-zinc-400">
        <div className="flex flex-col gap-2">
          <p>End of professional documentation module.</p>
          <div className="flex items-center gap-2 text-emerald-500 not-italic font-bold tracking-tighter cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            VERIFIED
          </div>
        </div>
        {nextId && (
          <Button
            onClick={() => router.push(`/session/${nextId}`)}
            variant="outline"
            className="rounded-full cursor-pointer px-6 py-2 border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-all flex items-center gap-2"
          >
            Next Session
            <HiArrowRight className="text-lg" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionPage;
