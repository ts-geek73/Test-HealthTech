import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v2`,
});

export default api;
