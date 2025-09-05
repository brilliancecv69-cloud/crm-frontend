import { useEffect, useState } from "react";
import axios from "../axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { FaUsers, FaChartLine, FaMoneyBillWave, FaDollarSign, FaPercentage } from "react-icons/fa";

function KpiCard({ title, value, icon, format = "number" }) {
  const formattedValue =
    format === "money"
      ? `EGP ${Number(value || 0).toLocaleString()}`
      : format === "percent"
      ? `${Number(value || 0).toFixed(2)}%`
      : Number(value || 0).toLocaleString();

  return (
    <div className="card flex items-center p-4 shadow-sm">
      <div className="bg-gray-100 p-3 rounded-full mr-4">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold">{formattedValue}</div>
      </div>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

function NoDataMessage({ message }) {
  return <div className="flex items-center justify-center h-full text-gray-400">{message}</div>;
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ from: '', to: '', assignedTo: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/reports/detailed", { params: filters });
        if (res.data.ok) {
          setData(res.data.data);
        } else {
          setError("Failed to load report data.");
        }
      } catch (err) {
        setError(err.response?.data?.error || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleExport = async () => {
    try {
      const res = await axios.get('/reports/export', { params: filters, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export data.');
      console.error("Export error:", err);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Generating reports...</div>;
  if (error) return <div className="p-6 text-red-500 text-center">Error: {error}</div>;

  const { kpis, pipeline, monthlyRevenue, expensePerformance, salesTeam } = data || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Detailed Reports</h1>
        <button onClick={handleExport} className="btn primary">Export to Excel</button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 card">
        <div className="field">
          <span>From Date</span>
          <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="input" />
        </div>
        <div className="field">
          <span>To Date</span>
          <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="input" />
        </div>
        <div className="field">
          <span>Sales Person</span>
          <select name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange} className="input">
            <option value="">All Sales</option>
            {salesTeam && salesTeam.length > 0 ? (
              salesTeam.map(user => <option key={user._id} value={user._id}>{user.name}</option>)
            ) : (
              <option value="" disabled>No sales team found</option>
            )}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard title="New Leads" value={kpis?.leads} icon={<FaUsers className="text-blue-500" />} />
        <KpiCard title="Won Deals" value={kpis?.sales} icon={<FaChartLine className="text-green-500" />} />
        <KpiCard title="Sales Revenue" value={kpis?.salesAmount} format="money" icon={<FaDollarSign className="text-yellow-500" />} />
        <KpiCard title="Total Expenses" value={kpis?.expenses} format="money" icon={<FaMoneyBillWave className="text-red-500" />} />
        <KpiCard title="Conversion Rate" value={kpis?.conversionRate} format="percent" icon={<FaPercentage className="text-indigo-500" />} />
        <KpiCard title="Avg Deal Size" value={kpis?.avgDealSize} format="money" icon={<FaDollarSign className="text-pink-500" />} />
      </div>

      {/* Pipeline */}
      <div className="card p-4">
        <h3 className="font-bold mb-4">Pipeline Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          {pipeline && pipeline.length > 0 ? (
            <BarChart data={pipeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          ) : <NoDataMessage message="No pipeline data." />}
        </ResponsiveContainer>
      </div>

      {/* Monthly Revenue */}
      <div className="card p-4">
        <h3 className="font-bold mb-4">Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          {monthlyRevenue && monthlyRevenue.length > 0 ? (
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id.month" tickFormatter={(m) => `M${m}`} />
              <YAxis />
              <Tooltip formatter={(v) => `EGP ${v.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
              <Line type="monotone" dataKey="deals" stroke="#82ca9d" name="Deals" />
            </LineChart>
          ) : <NoDataMessage message="No monthly data." />}
        </ResponsiveContainer>
      </div>

      {/* Expenses */}
      <div className="card p-4">
        <h3 className="font-bold mb-4">Expenses by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          {expensePerformance && expensePerformance.length > 0 ? (
            <PieChart>
              <Pie data={expensePerformance} dataKey="totalAmount" nameKey="category" cx="50%" cy="50%" outerRadius={100} fill="#FF8042" label>
                {expensePerformance.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `EGP ${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          ) : <NoDataMessage message="No expense data to display." />}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
