import { useEffect, useState } from "react";
import axios from "../axios";
import socket from "../socketClient";

export default function ChatBox({ contact, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!contact) return;

    // 🟢 Fetch messages for this contact
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/messages`, {
          params: { contactId: contact._id },
        });
        if (res.data.ok) setMessages(res.data.data);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };
    fetchMessages();

    // 🟢 Listen for new incoming messages (filtered by contactId)
    const handler = (msg) => {
      if (msg.contactId === contact._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("msg:new", handler);

    return () => {
      socket.off("msg:new", handler);
    };
  }, [contact]);

  // 🟢 Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      const res = await axios.post("/messages", {
        contactId: contact._id,
        direction: "out", // مننا → للعميل
        type: "text",
        body: input,
      });

      if (res.data.ok) {
        setMessages((prev) => [...prev, res.data.data]);
      }
      setInput(""); // clear input
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  if (!contact) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white shadow-lg rounded-lg flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
        <h2 className="text-lg font-bold">Chat with {contact.phone}</h2>
        <button onClick={onClose} className="text-sm">❌</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[70%] ${
              msg.direction === "in"
                ? "bg-gray-200 text-left"
                : "bg-green-200 text-right ml-auto"
            }`}
          >
            {msg.body}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
