import "dotenv/config";
import app from "./app";
import logger from "./logger";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

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
        methods: ["GET", "POST"]
      }
    });

    io.on("connection", (socket) => {
      logger.info(`[Socket] Client connected: ${socket.id}`);
      
      socket.on("disconnect", () => {
        logger.info(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT}`);
    });

  } catch (error) {
    logger.error("[SERVER] Failed to start backend", error);
    process.exit(1);
  }
}

startServer();