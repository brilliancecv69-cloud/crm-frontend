// src/components/MessageList.jsx
import { useEffect, useRef, useState } from "react";
import axios from "../axios";
import socket from "../socketClient";
import { FaBolt } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function MessageList({ contactId, tenantId }) {
  const listRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  const [cannedResponses, setCannedResponses] = useState([]);
  const [showResponses, setShowResponses] = useState(false);
  const responsesContainerRef = useRef(null);

  const scrollToBottom = () => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (!contactId || !tenantId) return;

    const joinTenantRoom = () => {
      if (tenantId && socket.connected) {
        socket.emit("join", { tenantId });
        console.log(`📡 Re-joined tenant room: ${tenantId}`);
      }
    };
    
    joinTenantRoom();

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_BASE}/messages`, { params: { contactId } });
        const msgs = res.data?.data ?? [];
        setMessages(msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        setTimeout(scrollToBottom, 50);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    const fetchCannedResponses = async () => {
      try {
        const res = await axios.get(`${API_BASE}/canned-responses`);
        setCannedResponses(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching canned responses:", err);
      }
    };

    fetchMessages();
    fetchCannedResponses();

    const handleConnect = () => {
      setSocketConnected(true);
      joinTenantRoom();
    };
    const handleDisconnect = () => setSocketConnected(false);
    
    const handleNewMessage = (msg) => {
      // ✅✅✅  بداية التعديل الحاسم  ✅✅✅
      // إذا كانت الرسالة صادرة (out)، تجاهلها تمامًا.
      // لأن دالة sendMessage تعالجها بالفعل.
      if (msg.direction === "out") {
        return;
      }
      // ✅✅✅  نهاية التعديل الحاسم  ✅✅✅

      if (String(msg.tenantId) === String(tenantId) && String(msg.contactId) === String(contactId)) {
        setMessages((prev) => {
          const exists = prev.find((m) => String(m._id) === String(msg._id));
          if (exists) return prev;
          const updated = [...prev, msg];
          return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        setTimeout(scrollToBottom, 50);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("msg:new", handleNewMessage);

    const handleClickOutside = (event) => {
      if (responsesContainerRef.current && !responsesContainerRef.current.contains(event.target)) {
        setShowResponses(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("msg:new", handleNewMessage);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contactId, tenantId]);

  const sendMessage = async () => {
    const body = newMsg.trim();
    if (!contactId || !body || sending) return;

    const optimisticMsg = {
      _id: `temp_${Date.now()}`,
      contactId,
      tenantId,
      direction: "out",
      body,
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMsg("");
    setSending(true);
    setTimeout(scrollToBottom, 50);

    try {
      const payload = { contactId, tenantId, direction: "out", body };
      const res = await axios.post(`${API_BASE}/messages`, payload);
      const savedMsg = res.data?.data;

      setMessages((prev) =>
        prev.map((m) => (m._id === optimisticMsg._id ? savedMsg : m))
      );
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimisticMsg._id ? { ...m, pending: false, failed: true } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleSelectResponse = (text) => {
    setNewMsg(text);
    setShowResponses(false);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">Messages</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            socketConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {socketConnected ? "Live" : "Offline"}
        </span>
      </div>

      <div
        ref={listRef}
        className="h-80 overflow-y-auto border p-2 mb-2 bg-gray-50 rounded"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">No messages yet.</div>
        ) : (
          messages.map((m) => {
            const outgoing = m.direction === "out";
            return (
              <div
                key={m._id}
                className={`my-1 flex ${outgoing ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg ${
                    outgoing ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                  <div
                    className={`text-[10px] mt-1 flex items-center gap-2 ${
                      outgoing ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString()}
                    {m.pending && <span className="italic">• sending…</span>}
                    {m.failed && <span className="text-red-400">• failed</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2 relative" ref={responsesContainerRef}>
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message…"
          className="input"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />

        <button
          onClick={() => setShowResponses((prev) => !prev)}
          title="Canned Responses"
          className="btn"
          style={{ padding: "0 12px" }}
        >
          <FaBolt />
        </button>

        <button
          onClick={sendMessage}
          disabled={!contactId || !newMsg.trim() || sending}
          className="btn primary"
        >
          {sending ? "..." : "Send"}
        </button>

        {showResponses && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-white border rounded-lg shadow-lg z-10">
            {cannedResponses.length > 0 ? (
              cannedResponses.map((res) => (
                <div
                  key={res._id}
                  onClick={() => handleSelectResponse(res.text)}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-bold text-sm">{res.title}</div>
                  <p className="text-xs text-gray-600 truncate">{res.text}</p>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-sm text-gray-500">
                No canned responses found. You can add them from the "Canned Responses"
                page.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}