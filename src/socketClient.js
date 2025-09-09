import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const socket = io(API_BASE, {
  path: "/socket.io",
  autoConnect: false,
  reconnection: true,
});

// --- ✅ START: NEW CONNECTION AND NOTIFICATION LOGIC ---

// This function will be called from AuthContext after login
export const connectSocket = (token, user) => {
  if (!socket.connected) {
    // Attach the auth token for the handshake
    socket.auth = { token };
    socket.connect();
  }

  // Clear any old listeners to prevent duplicates
  socket.off("msg:notification");

  // Listen for new message notifications from the server
  socket.on("msg:notification", (payload) => {
    // Check if the notification is for the current user
    if (user && user.id === payload.assignedTo) {
      // Check if the browser supports notifications
      if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return;
      }

      // Check notification permission
      if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        new Notification(`New message from ${payload.contactName}`, {
          body: payload.messageBody,
          // You can add an icon here later
          // icon: "/path/to/icon.png" 
        });
      } else if (Notification.permission !== "denied") {
        // Otherwise, we need to ask the user for permission
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(`New message from ${payload.contactName}`, {
              body: payload.messageBody,
            });
          }
        });
      }
    }
  });
};

// This function can be called on logout
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// --- ✅ END: NEW CONNECTION AND NOTIFICATION LOGIC ---


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