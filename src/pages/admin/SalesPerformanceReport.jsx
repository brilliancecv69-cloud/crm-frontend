import React, { useState, useEffect } from "react";
import axios from "../../axios";
import {
  FaUserTie,
  FaChartBar,
  FaDollarSign,
  FaCheckCircle,
  FaClipboardList,
} from "react-icons/fa";

// ✅ Card Component
const StatCard = ({ icon, title, value, color }) => (
  <div className="card flex items-center p-5">
    <div className={`rounded-full p-3 mr-4 ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
        {title}
      </div>
      {/* ✅ الرقم أسود في اللايت / أبيض في الدارك */}
<div className="stat-value">
        {value}
      </div>
    </div>
  </div>
);

export default function SalesPerformanceReport() {
  const [salesUsers, setSalesUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/auth/users?role=sales")
      .then((res) => {
        setSalesUsers(res.data.data);
      })
      .catch((err) => {
        console.error("Failed to fetch sales users", err);
        setError("Could not load the list of sales users.");
      });
  }, []);

  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    if (!userId) {
      setKpis(null);
      return;
    }

    setLoading(true);
    setError("");
    setKpis(null);

    axios
      .get(`/reports/sales-performance/${userId}`)
      .then((res) => {
        setKpis(res.data.data);
      })
      .catch((err) => {
        console.error(`Failed to fetch performance for user ${userId}`, err);
        setError("Could not fetch performance data for this user.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const conversionRate = kpis
    ? kpis.totalAssigned > 0
      ? ((kpis.totalSalesDeals / kpis.totalAssigned) * 100).toFixed(1)
      : 0
    : 0;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">📊 Sales Performance Report</h1>

      <div className="mb-6 max-w-sm">
        <label
          htmlFor="salesUser"
          className="field-label mb-2 block"
        >
          Select a Sales Representative
        </label>
        <select
          id="salesUser"
          value={selectedUser}
          onChange={handleUserChange}
          className="input"
        >
          <option value="">-- Select a user --</option>
          {salesUsers.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="text-center p-10">Loading performance data...</div>}
      {error && <div className="text-center p-10 text-red-500">{error}</div>}

      {!loading && !error && !kpis && (
        <div className="text-center p-10 text-gray-500">
          <FaUserTie className="mx-auto text-5xl mb-4 text-gray-400" />
          <p>Please select a sales representative to view their performance KPIs.</p>
        </div>
      )}

      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<FaClipboardList className="text-white text-2xl" />}
            title="Total Assigned Leads"
            value={kpis.totalAssigned}
            color="bg-blue-500"
          />
          <StatCard
            icon={<FaCheckCircle className="text-white text-2xl" />}
            title="Converted to Customer"
            value={kpis.convertedToCustomer}
            color="bg-cyan-500"
          />
          <StatCard
            icon={<FaDollarSign className="text-white text-2xl" />}
            title="Total Sales Deals"
            value={kpis.totalSalesDeals}
            color="bg-green-500"
          />
          <StatCard
            icon={<FaChartBar className="text-white text-2xl" />}
            title="Conversion Rate"
            value={`${conversionRate}%`}
            color="bg-purple-500"
          />
          <StatCard
            icon={<FaDollarSign className="text-white text-2xl" />}
            title="Total Sales Amount"
            value={`EGP ${kpis.totalSalesAmount.toLocaleString()}`}
            color="bg-amber-500"
          />
        </div>
      )}
    </div>
  );
}
