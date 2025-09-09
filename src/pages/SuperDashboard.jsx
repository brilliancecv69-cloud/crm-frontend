import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../axios";
import { FaBuilding, FaUsers, FaDollarSign, FaFileInvoiceDollar, FaChartLine } from "react-icons/fa";

// A small component for statistic cards
const StatCard = ({ icon, title, value, color }) => (
  <div className={`card p-4 flex items-center ${color}`}>
    <div className="mr-4 text-2xl">{icon}</div>
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default function SuperDashboard() {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, tenantsRes] = await Promise.all([
          api.get("/super/stats"),
          api.get("/super/tenants"),
        ]);
        setStats(statsRes.data.data);
        setTenants(tenantsRes.data.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch dashboard data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  }

  return (
    // The outer div and sidebar have been removed. This is now just the page content.
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {loading && <p>Loading dashboard...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<FaBuilding />} title="Total Companies" value={stats.totalTenants} />
          <StatCard icon={<FaChartLine />} title="Active Companies" value={stats.activeTenants} />
          <StatCard icon={<FaDollarSign />} title="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="text-green-500" />
          <StatCard icon={<FaFileInvoiceDollar />} title="Total Paid" value={formatCurrency(stats.totalPaid)} color="text-blue-500" />
          <StatCard icon={<FaUsers />} title="Remaining" value={formatCurrency(stats.totalRemaining)} color="text-red-500" />
        </div>
      )}

      {/* Tenants Table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Companies Overview</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Status</th>
                <th>Subscription Price</th>
                <th>Amount Paid</th>
                <th>Remaining</th>
                <th>Expires On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-gray-50">
                  <td>{tenant.name}</td>
                  <td>
                    <span className={`badge ${
                      tenant.subscription.status === 'active' ? 'badge-success' : 
                      tenant.subscription.status === 'expired' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {tenant.subscription.status}
                    </span>
                  </td>
                  <td>{formatCurrency(tenant.subscription.price)}</td>
                  <td>{formatCurrency(tenant.subscription.paidAmount)}</td>
                  <td>{formatCurrency(tenant.subscription.remainingAmount)}</td>
                  <td>{tenant.subscription.expiresAt ? new Date(tenant.subscription.expiresAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <Link to={`/super/tenants/${tenant._id}`} className="btn btn-sm btn-primary">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}