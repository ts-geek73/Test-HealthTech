export interface Content {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface TrackedSession {
  id: string;
  content_id: string;
  content_title: string;
  created_at: string;
  sections: {
    content:string,
    id:string,
    title:string,
    position:number,
    updated_at:string,
  }[];
  status: "active" | "complete";
}
