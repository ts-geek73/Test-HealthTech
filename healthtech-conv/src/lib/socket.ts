import { io } from "socket.io-client";

let BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

console.log("🚀 ~ BACKEND_URL:", BACKEND_URL)
export const socket = io(BACKEND_URL, {
  autoConnect: false,
});
