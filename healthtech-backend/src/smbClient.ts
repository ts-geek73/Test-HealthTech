import fs from "fs/promises";

const IS_WINDOWS = process.platform === "win32";

const WINDOWS_BASE =
  "\\\\192.168.168.199\\DocServer\\Doc-U-Script\\AI-Documents";
const LINUX_BASE = "/mnt/docserver/Doc-U-Script/AI-Documents";
const UNC_BASE = "\\\\192.168.168.199\\DocServer\\Doc-U-Script\\AI-Documents";

export const FILESERVER_BASE = IS_WINDOWS ? WINDOWS_BASE : LINUX_BASE;

export function toNetworkPath(localPath: string): string {
  if (IS_WINDOWS) {
    return localPath;
  }
  const relative = localPath.replace(LINUX_BASE, "").replace(/\//g, "\\");
  return `${UNC_BASE}${relative}`;
}

export function toLocalPath(networkPath: string): string {
  if (IS_WINDOWS) {
    return networkPath; // already a valid local UNC path on Windows
  }
  // Replace UNC root with Linux mount point
  const relative = networkPath
    .replace(UNC_BASE, "")
    .replace(/\\/g, "/");
  return `${LINUX_BASE}${relative}`;
}


export async function smbWriteFile(
  remotePath: string,
  buffer: Buffer,
): Promise<void> {
  console.log("[SMB] Writing file", { remotePath, bytes: buffer.length });
  await fs.writeFile(remotePath, buffer);
  console.log("[SMB] Write complete", { remotePath });
}

export async function smbReadFile(remotePath: string): Promise<Buffer> {
  console.log("[SMB] Reading file", { remotePath });
  return fs.readFile(remotePath);
}

export async function smbEnsureDir(remotePath: string): Promise<void> {
  console.log("[SMB] Ensuring dir", { remotePath });
  await fs.mkdir(remotePath, { recursive: true });
  console.log("[SMB] Dir ready", { remotePath });
}
