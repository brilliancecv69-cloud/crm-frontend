import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../axios";

// Helper component for displaying stats
function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function TenantProfile() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      // ✅✅✅ تم تعديل هذا السطر ✅✅✅
      const res = await axios.get(`/super/tenants/${id}`); // استخدمنا المسار النسبي فقط
      if (res.data.ok) {
        setTenant(res.data.data);
      } else {
        setError(res.data.error || "Failed to fetch tenant details");
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTenantDetails();
    }
  }, [id]);

  if (loading) return <div className="page p-6">Loading Tenant Profile...</div>;
  if (error) return <div className="page p-6 text-red-500">Error: {error}</div>;
  if (!tenant) return <div className="page p-6">Tenant not found.</div>;

  return (
    <div className="page p-6">
      <Link to="/super/tenants" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to All Companies
      </Link>

      {/* Tenant Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-gray-500">Slug: {tenant.slug}</p>
        </div>
        <div className={`px-3 py-1 text-sm rounded-full font-semibold ${
          tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {tenant.isActive ? 'Active' : 'Suspended'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Admin Accounts" value={tenant.stats?.adminCount ?? 0} />
        <StatCard label="Sales Accounts" value={tenant.stats?.salesCount ?? 0} />
        <StatCard label="Total Users" value={(tenant.stats?.adminCount ?? 0) + (tenant.stats?.salesCount ?? 0)} />
        <StatCard label="WhatsApp Accounts" value={tenant.stats?.waCount ?? 0} />
      </div>

      {/* Details Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Card */}
        <div className="card p-4">
          <h2 className="font-bold text-lg mb-3">Subscription Details</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Type:</strong> {tenant.subscription?.type}</p>
            <p><strong>Status:</strong> {tenant.subscription?.status}</p>
            <p><strong>Expires At:</strong> {tenant.subscription?.expiresAt ? new Date(tenant.subscription.expiresAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <button className="btn mt-4">Edit Subscription</button>
        </div>

        {/* Actions Card */}
        <div className="card p-4">
          <h2 className="font-bold text-lg mb-3">Manage Company</h2>
          <div className="flex flex-col gap-2">
            <button className="btn">
              {tenant.isActive ? 'Suspend Company' : 'Re-activate Company'}
            </button>
            <button className="btn danger">
              Delete Company
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}