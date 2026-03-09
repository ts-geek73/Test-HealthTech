import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { initWebSocket } from "./integrations";
import { sessionsRouter } from "./routes/sessions";

dotenv.config();

const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",") ?? [
  "http://localhost:3000", "http://localhost:4173"
];
const corsOptions = {
  origin: CORS_ORIGINS,
  methods: ["GET", "POST", "OPTIONS", "PATCH"],
};
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

const PORT = process.env.PORT ?? 4000;

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/sessions", sessionsRouter);

app.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

initWebSocket(io);

httpServer.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
