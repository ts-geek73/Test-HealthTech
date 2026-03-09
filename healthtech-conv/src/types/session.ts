export interface Content {
  pid: string;
  acc: string;
  content: string | null;
  created_at: string;
}

export interface TrackedSession {
  id: string;
  pid: string;
  created_at: string;
  status: "active" | "complete";
}
