import Axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axios = Axios.create({
  baseURL: API_BASE,
});

// ✅ interceptor: يضيف التوكن المناسب
axios.interceptors.request.use((config) => {
  // ✅ THE FIX: Changed from startsWith to includes
  // This ensures that even full URLs (like http://.../super/...) are correctly identified.
  // لو المسار فيه /super → استخدم superToken
  if (config.url && config.url.includes("/super")) {
    const superToken = localStorage.getItem("superToken");
    if (superToken) {
      config.headers.Authorization = `Bearer ${superToken}`;
    }
  } else {
    // باقي الـ routes → استخدم token العادي
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default axios;