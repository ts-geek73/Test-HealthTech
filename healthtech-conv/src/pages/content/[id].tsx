"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackVisit } from "@/hooks/useContents";

const ContentRedirectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const create = async () => {
      const session = await trackVisit(id);
      if (session?.id) {
        navigate(`/session/${session.id}`);
      } else {
        navigate(`/`);
      }
    };

    create();
  }, [id, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  );
};

export default ContentRedirectPage;
