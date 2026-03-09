export interface Content {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
}

export interface TrackedSession {
  id: string;
  content_id: string;
  created_at: string;
  status: "active" | "complete";
  contents: Content;
}
