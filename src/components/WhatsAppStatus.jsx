// src/components/WhatsAppStatus.jsx
import { useEffect, useState } from "react";
import socket from "../socketClient";

export default function WhatsAppStatus({ tenantId }) {
  const [serverStatus, setServerStatus] = useState({ state: "loading", ready: false });
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  useEffect(() => {
    if (tenantId) {
      socket.emit("join", { tenantId });
    }
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onWaStatus = (payload) => {
      if (String(payload.tenantId) === String(tenantId)) {
        setServerStatus(payload);
      }
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("wa:status", onWaStatus);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("wa:status", onWaStatus);
    };
  }, [tenantId]);

  const badge = (text, colorClass) => (
    <span className={`px-2 py-1 text-xs font-bold rounded-full ${colorClass}`}>
      {text}
    </span>
  );

  const getStatusBadge = () => {
    switch (serverStatus.state) {
      case "connected":
      case "ready":
        return badge("Connected", "bg-green-100 text-green-700");
      case "scan":
        return badge("Scan QR", "bg-yellow-100 text-yellow-700");
      case "loading":
        return badge("Loading...", "bg-gray-100 text-gray-600");
      default:
        return badge(serverStatus.state || "Error", "bg-red-100 text-red-700");
    }
  };

  return (
    <div className="p-2">
      <div className="flex gap-2 items-center mb-2">
        {getStatusBadge()}
        {socketConnected
          ? badge("Socket: OK", "bg-blue-100 text-blue-700")
          : badge("Socket: Off", "bg-gray-100 text-gray-700")}
      </div>
      {serverStatus.state === "scan" && serverStatus.qr && (
        <div className="mt-2 text-center">
          <p className="text-xs mb-1">Scan QR Code:</p>
          <img
            src={serverStatus.qr}
            alt="whatsapp-qr"
            className="w-32 h-32 rounded-lg mx-auto"
          />
        </div>
      )}
    </div>
  );
}