// src/components/WhatsAppStatus.jsx
import { useEffect, useState, useCallback } from "react";
import socket from "../socketClient";
import axios from "../axios";

export default function WhatsAppStatus({ tenantId }) {
  const getInitialState = useCallback(() => {
    try {
      const savedStatus = sessionStorage.getItem(`whatsappStatus_${tenantId}`);
      // نتأكد أن الحالة المحفوظة ليست "error" ناتجة عن فشل التهيئة
      if (savedStatus) {
        const parsedStatus = JSON.parse(savedStatus);
        if (parsedStatus.state !== 'error') {
            return parsedStatus;
        }
      }
    } catch (error) {
      console.error("Failed to parse saved status from sessionStorage", error);
    }
    return { state: "loading", ready: false };
  }, [tenantId]);

  const [serverStatus, setServerStatus] = useState(getInitialState);
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  const requestStatusUpdate = useCallback(() => {
    if (socket.connected) {
      socket.emit("wa:get_status");
    }
  }, []);

  // --- ✅ START: تعديل منطق التهيئة ليكون أكثر قوة ---
  const initializeAccount = useCallback(async () => {
    if (!tenantId) return;

    const isInitialized = sessionStorage.getItem(`waAccountInitialized_${tenantId}`);
    
    if (isInitialized) {
      // إذا تمت التهيئة من قبل، اطلب الحالة مباشرةً
      requestStatusUpdate();
      return;
    }

    try {
      // حاول تنفيذ التهيئة
      await axios.post("/whatsapp/accounts", { name: "Default Account" });
      // عند النجاح، سجل أنها تمت
      sessionStorage.setItem(`waAccountInitialized_${tenantId}`, "true");
    } catch (error) {
      // إذا فشلت التهيئة، سجل الخطأ في الكونسول فقط ولا تغير حالة الواجهة
      // هذا ليس خطأ في حالة الواتساب، بل في الإعداد الأولي فقط
      console.error("Non-critical error during one-time account initialization:", error);
    } finally {
      // ✨ الأهم: سواء نجحت التهيئة أو فشلت، اطلب دائمًا الحالة الحقيقية من الخادم
      requestStatusUpdate();
    }
  }, [tenantId, requestStatusUpdate]);
  // --- ✅ END: تعديل منطق التهيئة ---

  useEffect(() => {
    initializeAccount();

    const onConnect = () => {
      setSocketConnected(true);
      requestStatusUpdate();
    };
    const onDisconnect = () => setSocketConnected(false);

    const onWaStatus = (payload) => {
      if (payload && payload.tenantId && String(payload.tenantId) === String(tenantId)) {
        setServerStatus(payload);
        try {
          // نحفظ فقط الحالات السليمة التي تصل من الخادم
          sessionStorage.setItem(`whatsappStatus_${tenantId}`, JSON.stringify(payload));
        } catch (error) {
          console.error("Failed to save status to sessionStorage", error);
        }
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("wa:status", onWaStatus);

    const intervalId = setInterval(() => {
      requestStatusUpdate();
    }, 5 * 60 * 1000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("wa:status", onWaStatus);
      clearInterval(intervalId);
    };
  }, [tenantId, initializeAccount, requestStatusUpdate]);

  const badge = (text, colorClass) => (
    <span className={`px-2 py-1 text-xs font-bold rounded-full ${colorClass}`}>
      {text}
    </span>
  );

  const getStatusBadge = () => {
    // ... (هذا الجزء يبقى كما هو بدون تغيير) ...
    switch (serverStatus.state) {
        case "connected":
        case "ready":
            return badge("Connected", "bg-green-100 text-green-700");
        case "scan":
        case "GOT_QR":
            return badge("Scan QR", "bg-yellow-100 text-yellow-700");
        case "loading":
        case "initializing":
            return badge("Loading...", "bg-gray-100 text-gray-600");
        case "not_configured":
            return badge("Not Configured", "bg-gray-100 text-gray-700");
        default:
            return badge(
            serverStatus.state || "Error",
            "bg-red-100 text-red-700"
            );
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
      {(serverStatus.state === "scan" || serverStatus.state === "GOT_QR") &&
        serverStatus.qr && (
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