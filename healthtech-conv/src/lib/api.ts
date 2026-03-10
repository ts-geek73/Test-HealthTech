import axios from "axios";
import { socket } from "./socket";

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v2`,
});

api.interceptors.request.use((config) => {
  if (socket.id) {
    config.headers["X-Socket-ID"] = socket.id;
  }
  return config;
});

export default api;
