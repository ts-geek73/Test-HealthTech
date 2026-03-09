import { eq } from "drizzle-orm";
import { Server } from "socket.io";
import { client, db } from "../../db/db";
import { sessions } from "../../db/schema";

export const initWebSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log(`📡 New client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  client.listen("session_change", async (payload: string) => {
    try {
      const data = JSON.parse(payload);

      const { eventType, new: newRow } = data;

      if (eventType === "INSERT" || eventType === "UPDATE") {
        const [detailedSession] = await db
          .select()
          .from(sessions)
          .where(eq(sessions.id, (newRow as any).id))
          .limit(1);

        if (detailedSession) {
          if (eventType === "INSERT") {
            console.log("🚀 Emitting session_created", detailedSession.id);
            io.emit("session_created", detailedSession);
          } else {
            console.log("🔄 Emitting session_updated", detailedSession.id);
            io.emit("session_updated", detailedSession);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error handling Postgres notification:", error);
    }
  });
};
