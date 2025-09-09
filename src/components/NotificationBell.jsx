import { useEffect, useState, useRef } from "react";
import { FaBell } from "react-icons/fa";
import axios from "../axios";
import socket from "../socketClient";
import { useNavigate } from "react-router-dom";

// A simple notification sound - you would place this file in your public directory
const notificationSound = new Audio('/notification.mp3');

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
            // --- ✅ START: PLAY SOUND ON NEW NOTIFICATION ---
            notificationSound.play().catch(e => console.error("Error playing sound:", e));
            // --- ✅ END: PLAY SOUND ON NEW NOTIFICATION ---
        };
        socket.on("new_notification", handleNewNotification);

        return () => {
            socket.off("new_notification", handleNewNotification);
        };
    }, []);

    const handleOpen = async () => {
        setIsOpen(prev => !prev);
        if (!isOpen && unreadCount > 0) {
            // Mark as read after a short delay to allow user to see the unread state
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
                    // --- ✅ START: IMPROVED UNREAD COUNT BADGE ---
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount}
                    </div>
                    // --- ✅ END: IMPROVED UNREAD COUNT BADGE ---
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                    <div className="p-3 font-bold border-b dark:border-gray-700">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-gray-500 text-center p-4">No notifications yet.</p>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n._id} 
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
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