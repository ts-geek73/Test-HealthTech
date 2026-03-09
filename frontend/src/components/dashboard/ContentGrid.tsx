"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Content } from "@/types";
import React from "react";
import { HiArrowRight } from "react-icons/hi2";

interface ContentGridProps {
  contents: Content[];
  loading: boolean;
  onClick: (id: string) => void;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  contents,
  loading,
  onClick,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-52 bg-zinc-50 animate-pulse rounded-2xl border border-zinc-100"
          />
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-2xl">
        <p className="text-zinc-300 font-mono text-xs uppercase tracking-widest">
          No primary modules identified
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {contents.slice(0, 4).map((item) => (
        <Card
          onClick={() => onClick(item?.id)}
          key={item.id}
          className="group h-full border-zinc-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500 bg-white overflow-hidden group-hover:border-black group-hover:translate-y-[-4px]"
        >
          <CardHeader className="px-8 py-6 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold group-hover:text-black transition-colors leading-tight">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest">
                  UNIT // {item.id.slice(0, 5)}
                </CardDescription>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1A1A1A] text-white shadow-lg transition-transform group-hover:scale-110">
                <HiArrowRight className="text-lg" />
              </div>
            </div>
            <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed font-medium">
              {item.content ||
                "Operational documentation module for patient stay and treatment progress tracking."}
            </p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default ContentGrid;
