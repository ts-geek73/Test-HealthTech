import "dotenv/config";
import app from "./app";
import logger from "./logger";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // logger.info("[SERVER] Connecting to file server...");

    // await connectFileServer();

    // logger.info("[SERVER] File server connection established");

    app.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT}`);
    });

  } catch (error) {
    logger.error("[SERVER] Failed to start backend", error);
    process.exit(1);
  }
}

startServer();