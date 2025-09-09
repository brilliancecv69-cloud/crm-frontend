import { useEffect, useState } from "react";
import axios from "../axios";
import {
  FaUsers,
  FaUserTie,
  FaDollarSign,
  FaChartLine,
  FaMoneyBill,
  FaBuilding,
  FaUserShield,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    leads: 0,
    customers: 0,
    sales: 0,
    salesAmount: 0,
    conversionRate: 0,
    users: 0,
    tenants: 0,
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // 👈 لو هتجيبها من التوكن أو API auth

  const fetchStats = async () => {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await axios.get(`${API_BASE}/contacts/stats`, { params });
      if (res.data.ok) {
        setStats(prev => ({ ...prev, ...res.data.data }));
      }

      if (isAdmin) {
        // 👇 استعلامات إضافية للأدمن
        const [usersRes, tenantsRes] = await Promise.all([
          axios.get(`${API_BASE}/auth/users`),
          axios.get(`${API_BASE}/super/tenants`),
        ]);
        setStats(prev => ({
          ...prev,
          users: usersRes.data?.data?.length || 0,
          tenants: tenantsRes.data?.data?.length || 0,
        }));
      }
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  };

  useEffect(() => {
    // TODO: استبدلها بالـ role اللي جاي من التوكن أو الكونتكست
    const role = localStorage.getItem("role"); 
    setIsAdmin(role === "admin" || role === "super"); 
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">📊 Dashboard Overview</h2>

      {/* Date filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </div>
        <button
          onClick={fetchStats}
          className="btn primary self-end"
        >
          Apply
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card color="from-blue-500 to-blue-400" title="Leads" value={stats.leads} icon={<FaUsers size={28} />} />
        <Card color="from-green-500 to-green-400" title="Customers" value={stats.customers} icon={<FaUserTie size={28} />} />
        <Card color="from-purple-500 to-purple-400" title="Sales Deals" value={stats.sales} icon={<FaChartLine size={28} />} />
        <Card color="from-amber-500 to-amber-400" title="Sales Amount" value={`EGP ${stats.salesAmount.toLocaleString()}`} icon={<FaMoneyBill size={28} />} />
        <Card color="from-red-500 to-red-400" title="Conversion Rate" value={`${stats.conversionRate}%`} icon={<FaDollarSign size={28} />} />
      </div>

      {/* Admin Only Section */}
      {isAdmin && (
        <div className="mt-10">
          <h3 className="text-2xl font-bold mb-4">👑 Admin Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card color="from-indigo-500 to-indigo-400" title="Total Users" value={stats.users} icon={<FaUserShield size={28} />} />
            <Card color="from-pink-500 to-pink-400" title="Total Companies" value={stats.tenants} icon={<FaBuilding size={28} />} />
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-r ${color} text-white shadow-lg rounded-xl p-6 flex items-center justify-between`}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-2xl font-extrabold mt-2">{value}</p>
      </div>
      {icon}
    </div>
  );
}
