import { useEffect, useState } from "react";
import axios from "../axios";
import { Link } from "react-router-dom"; // ✅ تم استدعاء Link

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [error, setError] = useState("");

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("superToken");
      if (!token) return setError("No token found. Please login again.");

      const res = await axios.get(`${API_BASE}/super/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.ok) {
        setTenants(res.data.data);
      } else {
        setError(res.data.error || "Failed to fetch tenants");
      }
    } catch (err) {
      console.error("❌ Fetch tenants error:", err);
      setError(err.response?.data?.error || "Failed to fetch tenants");
    }
  };

  const addTenant = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("superToken");
      if (!token) return setError("No token found. Please login again.");

      const res = await axios.post(`${API_BASE}/super/tenants`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.ok) {
        setForm({
          name: "",
          slug: "",
          adminName: "",
          adminEmail: "",
          adminPassword: "",
        });
        fetchTenants();
      } else {
        setError(res.data.error || "Failed to add tenant");
      }
    } catch (err) {
      console.error("❌ Add tenant error:", err);
      setError(err.response?.data?.error || "Failed to add tenant");
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="page p-6">
      <h1 className="text-xl font-bold mb-4">🏢 Companies (Tenants)</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={addTenant} className="grid gap-2 mb-4 card p-4">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Company Name"
          className="input"
          required
        />
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="Slug (short id)"
          className="input"
          required
        />
        <input
          value={form.adminName}
          onChange={(e) => setForm({ ...form, adminName: e.target.value })}
          placeholder="Admin Name"
          className="input"
        />
        <input
          value={form.adminEmail}
          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
          placeholder="Admin Email"
          type="email"
          className="input"
          required
        />
        <input
          value={form.adminPassword}
          onChange={(e) =>
            setForm({ ...form, adminPassword: e.target.value })
          }
          placeholder="Admin Password"
          type="password"
          className="input"
          required
        />
        <button className="btn primary">Add</button>
      </form>

      {/* --- ✅ بداية التعديل ✅ --- */}
      <div className="card divide-y">
        {tenants.map((t) => (
          <Link
            key={t._id}
            to={`/super/tenants/${t._id}`} // رابط لصفحة البروفايل
            className="p-3 flex justify-between items-center hover:bg-gray-50"
          >
            <div>
              <span className="font-bold">{t.name}</span>
              <span className="text-sm text-gray-500 ml-2">({t.slug})</span>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {t.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Created: {new Date(t.createdAt).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
      {/* --- 🔚 نهاية التعديل 🔚 --- */}
    </div>
  );
}