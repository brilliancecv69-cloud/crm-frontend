import { useEffect, useState } from "react";
import axios from "../axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function UserEditModal({ user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "sales",
    isActive: true,
    password: "", // حقل كلمة المرور الجديدة، فارغ مبدئيًا
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // عندما يتم فتح النافذة، املأ الفورم ببيانات المستخدم الحالي
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "sales",
        isActive: user.isActive,
        password: "", // اتركه فارغًا دائمًا عند الفتح
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { ...form };
      // لا ترسل حقل كلمة المرور إذا كان فارغًا
      if (!payload.password) {
        delete payload.password;
      }

      const token = localStorage.getItem("superToken");
      await axios.patch(`${API_BASE}/super/users/${user._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      onSuccess(); // لإغلاق النافذة وتحديث القائمة
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="font-bold">Edit User: {user.name}</h2>
          <button onClick={onClose} className="icon-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            
            <div className="field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} className="input" />
            </div>
            <div className="field">
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input" />
            </div>
            <div className="field">
              <span>New Password (optional)</span>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current password" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <span>Role</span>
                <select name="role" value={form.role} onChange={handleChange} className="input">
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="field items-start">
                <span>Status</span>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                  Active
                </label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={loading} className="btn primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}