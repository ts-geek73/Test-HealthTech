import "dotenv/config";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import logger from "./logger";
import { setSocket } from "./socket";

// Export the io instance so it can be used elsewhere (like controllers)
export let io: SocketIOServer;

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // logger.info("[SERVER] Connecting to file server...");

    // await connectFileServer();

    // logger.info("[SERVER] File server connection established");

    const httpServer = createServer(app);

    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      logger.info(`[Socket] Client connected: ${socket.id}`);

      socket.on("disconnect", () => {
        logger.info(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    setSocket(io);

    httpServer.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("[SERVER] Failed to start backend", error);
    process.exit(1);
  }
}

startServer();
