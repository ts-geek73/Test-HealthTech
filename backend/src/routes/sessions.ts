import { desc, eq } from "drizzle-orm";
import { Request, Response, Router } from "express";
import { db } from "../db/db";
import { sessions } from "../db/schema";

export const sessionsRouter = Router();

sessionsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.created_at));

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.post("/track", async (req: Request, res: Response) => {
  const { pid, status } = req.body;

  if (!pid) {
    return res.status(400).json({ success: false, message: "Missing pid" });
  }

  try {
    const [newSession] = await db
      .insert(sessions)
      .values({
        pid,
        status: status || "active",
        created_at: new Date(),
      })
      .returning();

    return res.json({
      success: true,
      data: newSession,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (data.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    return res.json({ success: true, data: data[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.patch("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res
      .status(400)
      .json({ success: false, message: "Missing status field" });
  }

  const allowedStatuses = ["active", "complete"];
  if (!allowedStatuses.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid status value" });
  }

  try {
    await db.update(sessions).set({ status }).where(eq(sessions.id, id));

    return res.json({ success: true, message: "Session updated" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
