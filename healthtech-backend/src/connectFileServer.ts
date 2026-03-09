import { exec } from "child_process";

export async function connectFileServer() {
  const server = process.env.FILESERVER_BASE_URL!;
  const user = process.env.FILESERVER_USER!;
  const pass = process.env.FILESERVER_PASS!;

  const command = `net use ${server} /user:${user} ${pass}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("[FILESERVER] Connection failed", error);
        return reject(error);
      }

      console.log("[FILESERVER] Connected to file server");
      console.log(stdout);

      resolve(true);
    });
  });
}
