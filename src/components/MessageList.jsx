import { useEffect, useRef, useState } from "react";
import axios from "../axios";
import socket from "../socketClient";
import {
  FaPaperclip,
  FaMicrophone,
  FaBolt,
  FaPaperPlane,
  FaFileAlt,
  FaTrash,
  FaStop,
  FaCheck,
  FaCheckDouble,
  FaHistory, // <-- ✅ New Icon
} from "react-icons/fa";
import CannedResponsePopover from "./CannedResponsePopover"; // ✅ 1. استيراد المكون الجديد

// Helper components (no changes to these)
function MediaMessage({ msg }) {
    // ... (content is identical to the original)
    const mediaType = msg.meta?.mediaType || "";
    const mediaUrl = msg.meta?.mediaUrl || "";
    const fileName = msg.meta?.fileName || "file";
 
    if (!mediaUrl)
      return <div className="text-red-400 text-xs italic">Media not available</div>;
 
    if (mediaType.startsWith("image/"))
      return <img src={mediaUrl} alt={fileName} className="max-w-[200px] rounded-lg shadow my-1" />;
 
    if (mediaType.startsWith("video/"))
      return <video src={mediaUrl} controls className="max-w-[220px] rounded-lg shadow my-1" />;
 
    if (mediaType.startsWith("audio/"))
      return <audio src={mediaUrl} controls preload="auto" className="w-[220px] my-1" />;
 
    return (
      <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg">
        <FaFileAlt className="text-lg" />
        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="truncate underline">
          {fileName}
        </a>
      </div>
    );
}

function AckIcon({ ack }) {
    // ... (content is identical to the original)
    if (ack === 1) return <FaCheck className="inline ml-1 text-xs text-gray-400" />;
    if (ack === 2) return <FaCheckDouble className="inline ml-1 text-xs text-gray-400" />;
    if (ack === 3) return <FaCheckDouble className="inline ml-1 text-xs text-blue-400" />;
    return null;
}
  
function FilePreview({ file, onCancel, onSend }) {
    // ... (content is identical to the original)
    const [caption, setCaption] = useState("");
    const isImage = file.type.startsWith("image/");
    const fileUrl = URL.createObjectURL(file);
 
    return (
      <div className="absolute bottom-full left-0 right-0 p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="flex items-start gap-3">
          {isImage ? (
            <img src={fileUrl} alt="preview" className="w-20 h-20 object-cover rounded" />
          ) : (
            <div className="w-20 h-20 bg-gray-100 flex items-center justify-center rounded">
              <FaFileAlt className="text-4xl text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold truncate">{file.name}</p>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input text-sm w-full mt-1"
              placeholder="Add a caption..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => onSend(caption)} className="btn primary !h-auto py-1 px-3">
              <FaPaperPlane />
            </button>
            <button onClick={onCancel} className="btn danger !h-auto py-1 px-3">
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    );
}

function MessageItem({ msg, deleteMessage }) {
    // ... (content is identical to the original)
    const isOut = msg.direction === "out";
    const rowClasses = `message-row ${isOut ? 'message-row-out' : 'message-row-in'}`;
    const bubbleClasses = `message-bubble ${isOut ? 'out' : 'in'}`;
 
    return (
      <div className={rowClasses}>
        <div className="relative group">
          <div className={bubbleClasses}>
            {msg.deleted ? (
              <p className="italic text-gray-400 text-sm">🚫 This message was deleted</p>
            ) : msg.type === "text" ? (
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
            ) : (
              <MediaMessage msg={msg} />
            )}
 
            <div className="text-[11px] mt-1 flex justify-end items-center text-gray-400">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {isOut && !msg.pending && <AckIcon ack={msg.meta?.ack} />}
              {msg.pending && <span className="ml-1 text-gray-400">⏳</span>}
            </div>
          </div>
 
          <div className="absolute top-0 right-0 hidden group-hover:flex gap-2">
            <button onClick={() => deleteMessage(msg._id, false)} className="text-xs bg-gray-200 px-2 py-1 rounded">
              Delete me
            </button>
            {isOut && (
              <button
                onClick={() => deleteMessage(msg._id, true)}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete all
              </button>
            )}
          </div>
        </div>
      </div>
    );
}

// --- ✅ START: NEW MODAL COMPONENT FOR FOLLOW-UPS ---
const FollowUpModal = ({ show, onClose, contactId }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if(show) {
            setLoading(true);
            axios.get('/follow-up-templates')
                .then(res => setTemplates(res.data.data))
                .catch(err => {
                    setError("Failed to load templates.");
                    console.error(err);
                })
                .finally(() => setLoading(false));
        }
    }, [show]);

    const handleStartFollowUp = async (templateId) => {
        if(!window.confirm("Are you sure you want to start this automated follow-up sequence?")) return;

        try {
            await axios.post(`/contacts/${contactId}/follow-up/start`, { templateId });
            alert("Follow-up sequence started successfully!");
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to start the sequence.");
        }
    };
    
    if (!show) return null;
    
    return (
      <div className="absolute bottom-full left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Start Automated Follow-up</h3>
            <button onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
        </div>
        {loading && <p>Loading templates...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {templates.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {templates.map(template => (
                    <li key={template._id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{template.name}</p>
                            <p className="text-xs text-gray-500">{template.messages.length} message(s)</p>
                        </div>
                        <button onClick={() => handleStartFollowUp(template._id)} className="btn btn-sm btn-primary">Start</button>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-center text-gray-500 py-4">No follow-up templates found. You can create them from the "Follow-up Templates" page.</p>
        )}
      </div>
    );
};
// --- ✅ END: NEW MODAL COMPONENT ---
  
export default function MessageList({ contactId, tenantId }) {
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  // --- ✅ START: NEW STATE FOR FOLLOW-UP MODAL ---
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  // --- ✅ END: NEW STATE ---


  const scrollToBottom = () => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!contactId || !tenantId) return;

    // --- ✅ Close modal when contact changes ---
    setIsFollowUpModalOpen(false);

    const fetchInitialData = async () => {
      try {
        const msgsRes = await axios.get(`/messages`, { params: { contactId } });
        setMessages(msgsRes.data?.data ?? []);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchInitialData();

    const handleNewMessage = (msgFromServer) => {
      if (String(msgFromServer.contactId) !== String(contactId)) return;
      setMessages((prevMessages) => {
        const pendingIndex = prevMessages.findIndex(
          (m) =>
            m.pending &&
            m.body === msgFromServer.body &&
            m.meta?.fileName === msgFromServer.meta?.fileName
        );
        if (pendingIndex !== -1) {
          const newMessages = [...prevMessages];
          newMessages[pendingIndex] = msgFromServer;
          return newMessages;
        }
        if (!prevMessages.some(m => m._id === msgFromServer._id)) {
            return [...prevMessages, msgFromServer];
        }
        return prevMessages;
      });
      setTimeout(scrollToBottom, 100);
    };

    socket.on("msg:new", handleNewMessage);
    return () => socket.off("msg:new", handleNewMessage);
  }, [contactId, tenantId]);

  // All other functions (addPendingMessage, handleSendMessage, etc.) remain unchanged
  // ... (content is identical to the original)
    const addPendingMessage = (body, type, meta = {}) => {
        const tempId = `temp-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            _id: tempId,
            contactId,
            direction: "out",
            type,
            body,
            createdAt: new Date(),
            meta,
            pending: true,
          },
        ]);
    };
    
    const handleSendMessage = async (body, type = "text", meta = {}) => {
        if (!contactId || sending || (!body.trim() && type === "text")) return;
        addPendingMessage(body, type, meta);
    
        setSending(true);
        try {
          await axios.post(`/messages`, { contactId, type, body, meta });
          if (type === "text") setNewMsg("");
        } catch (err) {
          alert("Failed to send message: " + (err.response?.data?.error || err.message));
        } finally {
          setSending(false);
        }
    };
    
    const handleSendFile = async (caption) => {
        if (!fileToPreview) return;
        const file = fileToPreview;
        setFileToPreview(null);
    
        const formData = new FormData();
        formData.append("file", file);
    
        try {
          const uploadRes = await axios.post(`/messages/upload`, formData); // Assuming this route exists for uploads
          if (uploadRes.data.ok) {
            const { path, fileName, url, mediaType } = uploadRes.data.data;
            const mainType = mediaType.split("/")[0];
    
            await handleSendMessage(caption, mainType, {
              path,
              mediaUrl: url,
              fileName,
              mediaType,
            });
          }
        } catch (err) {
          console.error("File upload or send error:", err);
        }
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setFileToPreview(file);
        e.target.value = null;
    };
    
    const deleteMessage = async (id, forEveryone = false) => {
        try {
          // This API needs to exist on your backend
          await axios.patch(`/messages/${id}/delete`, { forEveryone }); 
        } catch (err) {
          console.error("Failed to delete message:", err);
        }
    };
    
    const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
          audioChunksRef.current = [];
          mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
          mediaRecorderRef.current.onstop = () => {
            clearInterval(recordTimerRef.current);
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
            setFileToPreview(audioFile);
          };
          mediaRecorderRef.current.start();
          setRecording(true);
          recordTimerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
        } catch {
          alert("Could not access microphone.");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        setRecording(false);
        setRecordTime(0);
    };
    
    const cancelRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        setRecording(false);
        clearInterval(recordTimerRef.current);
        setRecordTime(0);
        audioChunksRef.current = [];
    };
   const handleCannedResponseSelect = (responseText) => {
    setNewMsg(prev => prev ? `${prev} ${responseText}` : responseText);
  };

  return (
    <div className="h-full flex flex-col">
      <div ref={listRef} className="flex-grow overflow-y-auto p-4 space-y-1">
        {messages.map((m) => (
          <MessageItem key={m._id} msg={m} deleteMessage={deleteMessage} />
        ))}
      </div>

      <div className="relative flex-shrink-0">
        {fileToPreview && (
          <FilePreview
            file={fileToPreview}
            onCancel={() => setFileToPreview(null)}
            onSend={handleSendFile}
          />
        )}
        
        {/* --- ✅ START: FOLLOW-UP MODAL INTEGRATION --- */}
        <FollowUpModal 
            show={isFollowUpModalOpen}
            onClose={() => setIsFollowUpModalOpen(false)}
            contactId={contactId}
        />
        {/* --- ✅ END: FOLLOW-UP MODAL INTEGRATION --- */}
        
        <div className="p-2 border-t flex items-center gap-2 bg-white dark:bg-gray-800 rounded-b-lg">
            {recording ? (
            <div className="flex-1 flex items-center gap-3">
              <button onClick={stopRecording} className="btn danger"><FaStop /></button>
              <div className="flex items-center gap-2 text-red-500 font-mono">
                <span className="animate-pulse">🔴</span>
                <span>{Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, "0")}</span>
              </div>
              <button onClick={cancelRecording} className="btn ml-auto"><FaTrash /></button>
            </div>
            ) : (
            <>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="btn icon-btn" title="Attach File">
                  <FaPaperclip />
                </button>

                {/* --- ✅ START: NEW FOLLOW-UP BUTTON --- */}
                <button onClick={() => setIsFollowUpModalOpen(true)} className="btn icon-btn" title="Start Automated Follow-up">
                  <FaHistory />
                </button>
                {/* --- ✅ END: NEW FOLLOW-UP BUTTON --- */}

                <button onClick={startRecording} className="btn icon-btn" title="Record Voice">
                  <FaMicrophone />
                </button>
                <div className="relative flex-1">
                 <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <CannedResponsePopover onSelectResponse={handleCannedResponseSelect} />
                </div>
                <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage(newMsg, "text", {})}
                    className="input w-full rounded-full px-3 py-2 border bg-gray-100 dark:bg-gray-700"
                    placeholder="Type a message..."
                />
              
                </div>
                <button
                    onClick={() => handleSendMessage(newMsg, "text", {})}
                    disabled={!newMsg.trim() || sending}
                    className="btn primary rounded-full px-4"
                    title="Send"
                >
                <FaPaperPlane />
                </button>
            </>
            )}
        </div>
      </div>
    </div>
  );
}