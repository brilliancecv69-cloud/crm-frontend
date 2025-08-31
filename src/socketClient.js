// src/socketClient.js
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const socket = io(ORIGIN, {
  path: "/socket.io",
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
  timeout: 20000,
  withCredentials: true,
  // ✅✅✅ **بداية الإضافة: إرسال التوكن عند الاتصال** ✅✅✅
  auth: {
    token: localStorage.getItem("token")
  }
  // ✅✅✅ **نهاية الإضافة** ✅✅✅
});

socket.on("connect", () => {
  console.debug("[socketClient] connected", socket.id);

  // 🟢 join tenant room بعد الاتصال
  const tenantId = localStorage.getItem("tenantId");
  if (tenantId) {
    socket.emit("join", { tenantId });
    console.debug("[socketClient] joined tenant room", tenantId);
  }
});

socket.on("connect_error", (err) =>
  console.warn("[socketClient] connect_error", err && err.message)
);

socket.on("disconnect", (reason) =>
  console.warn("[socketClient] disconnected", reason)
);

export default socket;