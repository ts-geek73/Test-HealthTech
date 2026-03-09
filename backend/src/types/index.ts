export interface Content {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  content_id: string;
  created_at: string;
  status: string;
}
