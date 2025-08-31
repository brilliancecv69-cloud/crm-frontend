// src/components/WhatsAppStatus.jsx
import { useEffect, useState, useRef } from "react";
import socket from "../socketClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function WhatsAppStatus({ tenantId, tenantName }) {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const pollRef = useRef(null);

  // 🟢 متابعة حالة Socket + join room
  useEffect(() => {
    const onConnect = () => {
      setSocketConnected(true);
      if (tenantId) {
        socket.emit("join", { tenantId }); // ⬅️ انضم للغرفة الخاصة بالـ tenant
        console.log("📡 Joined tenant room:", tenantId);
      }
    };
    const onDisconnect = () => setSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // 🟢 استقبال wa:status من السيرفر
    socket.on("wa:status", (payload) => {
      if (payload.tenantId === tenantId) {
        console.log("📡 wa:status event received:", payload);
        setServerStatus(payload);
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("wa:status");
    };
  }, [tenantId]);

  // 🟢 Polling كـ fallback
  useEffect(() => {
    if (!tenantId) return;

    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${API_BASE.replace(/\/$/, "")}/api/whatsapp/status/${tenantId}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!mounted) return;
        if (json?.ok) setServerStatus(json.status);
      } catch (err) {
        console.error("fetch whatsapp status error", err);
        if (mounted) setServerStatus({ state: "error", ready: false });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => {
      mounted = false;
      clearInterval(pollRef.current);
    };
  }, [tenantId]);

  const badge = (text, green) => (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 8,
        background: green ? "#eafff0" : "#fff0f0",
        color: green ? "#045e2b" : "#7a1b1b",
        marginRight: 8,
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {text}
    </span>
  );

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 8,
        maxWidth: 560,
      }}
    >
      <h4 style={{ margin: "0 0 8px 0" }}>
        WhatsApp Status —{" "}
        <span style={{ color: "#555" }}>{tenantName || tenantId}</span>
      </h4>
      <div style={{ marginBottom: 8 }}>
        {loading ? (
          <em>Loading…</em>
        ) : (
          <>
            {serverStatus?.state === "connected"
              ? badge("Server: CONNECTED", true)
              : badge(`Server: ${serverStatus?.state || "unknown"}`, false)}
            {socketConnected
              ? badge("Socket: connected", true)
              : badge("Socket: disconnected", false)}
          </>
        )}
      </div>

      {/* لو فيه QR يبان كصورة مباشرة */}
      {serverStatus?.qr && (
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6 }}>📲 Scan this QR with WhatsApp:</div>
          <img
            src={serverStatus.qr}
            alt="whatsapp-qr"
            style={{ width: 240, height: 240, borderRadius: 8 }}
          />
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 13, color: "#333" }}>
        <div>
          <strong>Last updated:</strong>{" "}
          {serverStatus?.lastUpdated
            ? new Date(serverStatus.lastUpdated).toLocaleString()
            : "—"}
        </div>
        <div>
          <strong>Tenant:</strong> {serverStatus?.tenantId ?? "—"}
        </div>
      </div>
    </div>
  );
}
