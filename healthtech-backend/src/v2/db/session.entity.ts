export interface Session {
    id: string;
    content_id: string;
    content_title: string;
    status: "active" | "completed" | string;
    created_at: Date;
    updated_at: Date;
}
