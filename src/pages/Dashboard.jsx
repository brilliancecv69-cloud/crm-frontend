import { useEffect, useState } from "react";
import axios from "../axios";

import { FaUsers, FaUserTie, FaDollarSign, FaChartLine, FaMoneyBill } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    leads: 0,
    customers: 0,
    sales: 0,
    salesAmount: 0,
    conversionRate: 0,
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchStats = async () => {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await axios.get(`${API_BASE}/contacts/stats`, { params });
      if (res.data.ok) setStats(res.data.data);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard Overview</h2>

      {/* Date filter */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <button
          onClick={fetchStats}
          className="bg-blue-500 text-white px-4 py-2 rounded self-end"
        >
          Apply
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Leads</h3>
            <p className="text-3xl font-extrabold mt-2">{stats.leads}</p>
          </div>
          <FaUsers size={32} />
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-400 text-white shadow-lg rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Customers</h3>
            <p className="text-3xl font-extrabold mt-2">{stats.customers}</p>
          </div>
          <FaUserTie size={32} />
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-lg rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Sales Deals</h3>
            <p className="text-3xl font-extrabold mt-2">{stats.sales}</p>
          </div>
          <FaChartLine size={32} />
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white shadow-lg rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Sales Amount</h3>
            <p className="text-2xl font-extrabold mt-2">EGP {stats.salesAmount}</p>
          </div>
          <FaMoneyBill size={32} />
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Conversion Rate</h3>
            <p className="text-3xl font-extrabold mt-2">{stats.conversionRate}%</p>
          </div>
          <FaDollarSign size={32} />
        </div>
      </div>
    </div>
  );
}
