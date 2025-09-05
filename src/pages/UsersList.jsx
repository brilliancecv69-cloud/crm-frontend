import { useEffect, useState } from "react";
import axios from "../axios";
import UserEditModal from "./UserEditModal"; // سنقوم بإنشاء هذا الملف لاحقًا

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales", tenantId: "" });
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState("");
  
  // --- ✅ بداية الإضافات الجديدة ✅ ---
  const [editingUser, setEditingUser] = useState(null); // لتخزين اليوزر الذي يتم تعديله
  // --- 🔚 نهاية الإضافات الجديدة 🔚 ---

  const fetchUsers = async () => {
    try {
        const token = localStorage.getItem("superToken");
        const res = await axios.get(`${API_BASE}/super/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.ok) setUsers(res.data.data);
    } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch users");
    }
  };

  const fetchTenants = async () => {
    try {
        const token = localStorage.getItem("superToken");
        const res = await axios.get(`${API_BASE}/super/tenants`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.ok) setTenants(res.data.data);
    } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch tenants");
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    setError("");
    try {
        const token = localStorage.getItem("superToken");
        await axios.post(`${API_BASE}/super/users`, form, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setForm({ name: "", email: "", password: "", role: "sales", tenantId: "" });
        fetchUsers();
    } catch (err) {
        setError(err.response?.data?.error || "Failed to add user");
    }
  };

  // --- ✅ بداية الدوال الجديدة ✅ ---
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user permanently?")) {
        try {
            const token = localStorage.getItem("superToken");
            await axios.delete(`${API_BASE}/super/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete user");
        }
    }
  };
  
  const handleEditSuccess = () => {
      setEditingUser(null);
      fetchUsers();
  };
  // --- 🔚 نهاية الدوال الجديدة 🔚 ---

  useEffect(() => { 
      fetchUsers(); 
      fetchTenants(); 
  }, []);

  return (
    <div className="page">
      <h1 className="text-xl font-bold mb-4">👥 Manage Users</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      
      {/* Add User Form */}
      <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 card p-4">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input" />
        <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" className="input" />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
          <option value="admin">Admin</option>
          <option value="sales">Sales</option>
        </select>
        <select value={form.tenantId} onChange={e => setForm({ ...form, tenantId: e.target.value })} className="input">
          <option value="">-- Select Tenant --</option>
          {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <button className="btn primary w-full">Add User</button>
      </form>

      {/* Users List */}
      <div className="card divide-y">
        {users.map(u => (
          <div key={u._id} className="p-3 flex justify-between items-center">
            <div>
              <span className="font-bold">{u.name}</span>
              <span className="text-sm text-gray-500 ml-2">({u.role}) – {u.email}</span>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {u.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-gray-500 font-semibold">{u.tenantId?.name}</span>
              <button onClick={() => setEditingUser(u)} className="btn sm">Edit</button>
              <button onClick={() => handleDelete(u._id)} className="btn sm danger">Delete</button>
            </div>
          </div>
        ))}
      </div>

        {/* --- ✅ تأكد من أن هذا الجزء غير معلّق ✅ --- */}
      {editingUser && (
        <UserEditModal 
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}