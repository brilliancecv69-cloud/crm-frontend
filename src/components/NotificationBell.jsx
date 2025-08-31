// src/components/NotificationBell.jsx
import { useEffect, useState, useRef } from "react";
import { FaBell } from "react-icons/fa";
import axios from "../axios";
import socket from "../socketClient";
import { useNavigate } from "react-router-dom";

function useClickAway(ref, cb) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) cb?.();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, cb]);
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const boxRef = useRef(null);
    useClickAway(boxRef, () => setIsOpen(false));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        // Fetch initial notifications
        axios.get("/notifications")
            .then(res => setNotifications(res.data.data))
            .catch(console.error);
        
        // Listen for real-time notifications
        const handleNewNotification = (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
        };
        socket.on("new_notification", handleNewNotification);

        return () => {
            socket.off("new_notification", handleNewNotification);
        };
    }, []);

    const handleOpen = async () => {
        setIsOpen(prev => !prev);
        if (!isOpen && unreadCount > 0) {
            // Mark as read after a short delay
            setTimeout(async () => {
                try {
                    await axios.post("/notifications/read");
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                } catch (error) {
                    console.error("Failed to mark notifications as read", error);
                }
            }, 2000);
        }
    };
    
    const handleNotificationClick = (notification) => {
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div className="relative" ref={boxRef}>
            <button onClick={handleOpen} className="relative icon-btn">
                <FaBell />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-3 font-bold border-b">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-gray-500 text-center p-4">No notifications yet.</p>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n._id} 
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!n.isRead ? 'bg-blue-50' : ''}`}
                                >
                                    <p className="text-sm">{n.text}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}