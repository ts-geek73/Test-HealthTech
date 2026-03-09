import express from "express";
import path from "path";
import { installAuth, installCORS } from "./middleware";
import { healthRouter } from "./routes";
import router from "./v2/routes/drafts.routes";
import voiceToTextRoutes from "./voice-to-text/routes/voice-to-text.routes";

const app = express();
app.use(express.json({ limit: "10mb" })); // important for base64 images

app.use("/signatures", express.static(path.join(process.cwd(), "signatures")));
app.use(installCORS);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(installAuth);

app.use("/health", healthRouter);
app.use("/api/v2/health", healthRouter);
// app.use("/api/agent", agentRoutes);
app.use("/api/v2", router);
app.use("/api/v2/voice-to-text", voiceToTextRoutes);

export default app;
