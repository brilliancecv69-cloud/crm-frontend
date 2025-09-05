import { useEffect, useState, useMemo } from "react";
import axios from "../axios";
import MessageList from "../components/MessageList";
import WhatsAppStatus from "../components/WhatsAppStatus";
import { FaUserCircle, FaSearch } from "react-icons/fa";
import "./WhatsApp.css";
import { useAuth } from "../context/AuthContext"; // ⭐️ استيراد useAuth

export default function WhatsAppPage() {
  const { user } = useAuth(); // ⭐️ الحصول على بيانات المستخدم من السياق
  const tenantId = user?.tenantId; // ⭐️ استخدام tenantId من السياق

  const [allChats, setAllChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅✅✅ *** بداية التعديل المطلوب *** ✅✅✅
  // عند تحميل الصفحة، اطلب من الخادم بدء جلسة الواتساب
  useEffect(() => {
    const startWhatsAppSession = async () => {
      try {
        await axios.post("/whatsapp/start");
        console.log("Requested to start WhatsApp session.");
      } catch (err) {
        console.error("Failed to send start request:", err);
        setError("Could not initialize WhatsApp connection.");
      }
    };

    if (tenantId) {
      startWhatsAppSession();
    }
  }, [tenantId]);
  // ✅✅✅ *** نهاية التعديل المطلوب *** ✅✅✅

  useEffect(() => {
    if (!tenantId) return;

    const fetchChats = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/contacts", {
          params: { limit: 1000, sortBy: "last_seen", order: "desc" },
        });
        if (res.data.ok) {
          setAllChats(res.data.data.items || []);
        } else {
          setError(res.data.error || "Failed to load chats.");
        }
      } catch (err) {
        setError(err.response?.data?.error || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [tenantId]);

  const filteredChats = useMemo(() => {
    if (!searchTerm) return allChats;
    return allChats.filter(chat =>
      (chat.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.phone.includes(searchTerm)
    );
  }, [searchTerm, allChats]);

  if (!tenantId) {
    return (
      <div className="whatsapp-page-error">
        <h2>WhatsApp Dashboard</h2>
        <p>❌ Tenant not found. Please login again.</p>
      </div>
    );
  }

  return (
    <div className="whatsapp-page">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <WhatsAppStatus tenantId={tenantId} />
        </div>
        
        <div className="search-container">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list">
          {loading && <p className="status-text">Loading chats...</p>}
          {error && <p className="status-text error">{error}</p>}
          {!loading && filteredChats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-item ${activeChat?._id === chat._id ? "active" : ""}`}
              onClick={() => setActiveChat(chat)}
            >
              <FaUserCircle className="avatar-icon" />
              <div className="chat-details">
                <p className="chat-name">{chat.name || chat.phone}</p>
                <p className="chat-stage">Stage: {chat.stage || 'lead'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {activeChat ? (
          <>
            <div className="chat-area-header">
              <div className="flex items-center">
                 <FaUserCircle className="text-3xl text-gray-400 mr-3" />
                 <div>
                    <h3 className="font-bold text-lg">{activeChat.name || activeChat.phone}</h3>
                    <a href={`/contacts/${activeChat._id}`} className="text-xs text-blue-500 hover:underline">
                        View Full Profile
                    </a>
                 </div>
              </div>
            </div>
            <div className="message-list-container">
              <MessageList contactId={activeChat._id} tenantId={activeChat.tenantId} />
            </div>
          </>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-icon"></div>
            <h2 className="welcome-title">CRM Messenger</h2>
            <p className="welcome-subtitle">Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}