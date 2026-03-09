import { db } from "./db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runMigrations() {
  console.log("🚀 Starting migrations...");

  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith(".sql")) {
      console.log(`📜 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const query = fs.readFileSync(filePath, "utf-8");

      try {
        await db.execute(sql.raw(query));
        console.log(`✅ Completed: ${file}`);
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error);
        process.exit(1);
      }
    }
  }

  console.log("✨ All migrations completed successfully!");
  process.exit(0);
}

runMigrations();
