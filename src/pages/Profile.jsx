import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import { FaUserShield, FaUserTie, FaCalendarAlt } from "react-icons/fa";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await axios.get("/auth/me");
        // ✅ تم تبسيط التحقق من البيانات
        if (res.data.ok && res.data.data) {
          setUser(res.data.data);
        } else {
            navigate("/login");
        }
      } catch {
        navigate("/login"); // لو التوكن بايظ يرجع لوجين
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [navigate]);

  if (loading) return <div className="p-6">Loading...</div>;

  // ✅ تم نقل التحقق من وجود المستخدم للأعلى لضمان عدم حدوث خطأ
  if (!user) return null;

  // ✅ تم تحسين طريقة عرض الأيقونات والبيانات
  const avatarInitial = user.name ? user.name.charAt(0).toUpperCase() : '?';
  const userRoleIcon = user.role === 'admin' 
    ? <FaUserShield className="text-blue-500" size={20} /> 
    : <FaUserTie className="text-green-500" size={20} />;

  return (
    <div className="page p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* بطاقة معلومات المستخدم الأساسية */}
        <div className="md:col-span-1 card p-6 text-center shadow-lg">
            <div className="avatar mx-auto" style={{ width: 80, height: 80, fontSize: 40, marginBottom: 16 }}>
                {avatarInitial}
            </div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
        </div>

        {/* بطاقة التفاصيل الإضافية */}
        <div className="md:col-span-2 card p-6 space-y-4 shadow-lg">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Account Details</h3>
            
            <div className="flex items-center text-md">
                {userRoleIcon}
                <span className="ml-3">Role: <strong className="capitalize">{user.role}</strong></span>
            </div>

            <div className="flex items-center text-md">
                <FaCalendarAlt className="text-gray-500" size={20} />
                <span className="ml-3">Joined: <strong>{new Date(user.createdAt).toLocaleDateString()}</strong></span>
            </div>

            <div className="flex items-center text-md">
                <span className="font-mono text-gray-400 text-2xl mr-3">#</span>
                <span className="ml-1">User ID: <strong className="text-sm font-mono text-gray-600">{user._id}</strong></span>
            </div>
        </div>
      </div>
    </div>
  );
}