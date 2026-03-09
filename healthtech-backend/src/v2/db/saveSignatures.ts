import fs from "fs/promises";
import path from "path";
import { FILESERVER_BASE, toNetworkPath } from "../../smbClient";

export async function saveSignature(params: {
  base64: string;
  fileName: string;
}) {
  const ext = path.extname(params.fileName).toLowerCase();

  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".png"
        ? "image/png"
        : null;

  if (!mime) {
    throw new Error(`Unsupported signature extension: ${ext}`);
  }

  const buffer = Buffer.from(params.base64, "base64");
  const remoteDir = path.join(FILESERVER_BASE, "signatures");

  await fs.mkdir(remoteDir, { recursive: true });

  const localPath = path.join(remoteDir, params.fileName);
  await fs.writeFile(localPath, buffer);

  const networkPath = toNetworkPath(localPath);

  console.log("[SIGNATURE] Saved to:", localPath);
  console.log("[SIGNATURE] Network path:", networkPath);

  return {
    dbPath: path.join("signatures", params.fileName),
    remotePath: networkPath,  
    base64: `data:${mime};base64,${params.base64}`,
  };
}
