import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ⭐️ 1. تعديل: لا تقم بالاتصال تلقائياً
const socket = io(API_BASE, {
  path: "/socket.io",
  autoConnect: false, // أهم تعديل هنا
  reconnection: true,
});

socket.on("connect", () => {
  console.log("[Socket.IO] Connected successfully with ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.warn("[Socket.IO] Connection Error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.warn("[Socket.IO] Disconnected:", reason);
});

export default socket;