import { useEffect, useState } from "react";
import { useParams, Link, NavLink, useNavigate } from "react-router-dom";
import api from "../axios";

// Helper component for displaying stats
const StatCard = ({ label, value }) => (
  <div className="card text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

export default function TenantProfile() {
  const { id } = useParams();
  const navigate = useNavigate(); // For redirecting after delete
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for the edit form
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // States for other actions
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/super/tenants/${id}`);
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

  useEffect(() => {
    if (tenant) {
      setFormData({
        type: tenant.subscription?.type || 'none',
        status: tenant.subscription?.status || 'inactive',
        expiresAt: tenant.subscription?.expiresAt ? new Date(tenant.subscription.expiresAt).toISOString().split('T')[0] : '',
        price: tenant.subscription?.price || 0,
        paidAmount: tenant.subscription?.paidAmount || 0,
      });
    }
  }, [tenant]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubscriptionSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.patch(`/super/tenants/${id}/subscription`, formData);
      if (res.data.ok) {
        setTenant(res.data.data);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- ✅ START: NEW ACTION HANDLERS ---
  const handleToggleActiveStatus = async () => {
    if (window.confirm(`Are you sure you want to ${tenant.isActive ? 'suspend' : 're-activate'} this company?`)) {
      setIsTogglingStatus(true);
      try {
        const res = await api.patch(`/super/tenants/${id}`, { isActive: !tenant.isActive });
        if (res.data.ok) {
          setTenant(res.data.data); // Update UI with new status
        }
      } catch (err) {
        alert("Failed to update status.");
      } finally {
        setIsTogglingStatus(false);
      }
    }
  };

  const handleDeleteTenant = async () => {
    if (window.confirm("DANGER: Are you sure you want to permanently delete this company and all its data? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await api.delete(`/super/tenants/${id}`);
        alert("Company deleted successfully.");
        navigate('/super'); // Redirect to dashboard
      } catch (err) {
        alert("Failed to delete company.");
      } finally {
        setIsDeleting(false);
      }
    }
  };
  // --- ✅ END: NEW ACTION HANDLERS ---


  if (loading) return <div className="p-6">Loading Tenant Profile...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!tenant) return <div className="p-6">Tenant not found.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-6">Super Admin</h1>
        <nav>
          <ul>
            <li><NavLink to="/super" end className={({ isActive }) => `block py-2 px-4 rounded transition ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>Dashboard</NavLink></li>
            <li><NavLink to="/super/tenants" className={({ isActive }) => `block py-2 px-4 rounded transition ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>Manage Companies</NavLink></li>
            <li><NavLink to="/super/users" className={({ isActive }) => `block py-2 px-4 rounded transition ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>Manage Users</NavLink></li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Link to="/super" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <p className="text-gray-500">Slug: {tenant.slug}</p>
          </div>
          <div className={`badge ${tenant.isActive ? 'badge-success' : 'badge-error'}`}>{tenant.isActive ? 'Active' : 'Suspended'}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Admin Accounts" value={tenant.stats?.adminCount ?? 0} />
            <StatCard label="Sales Accounts" value={tenant.stats?.salesCount ?? 0} />
            <StatCard label="Total Users" value={(tenant.stats?.adminCount ?? 0) + (tenant.stats?.salesCount ?? 0)} />
            <StatCard label="WhatsApp Accounts" value={tenant.stats?.waCount ?? 0} />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-bold text-lg mb-3">Subscription Details</h2>
            {isEditing ? (
              <form onSubmit={handleSubscriptionSave}>
                <div className="space-y-4">
                    <label className="label">Subscription Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="input"><option value="none">None</option><option value="trial">Trial</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
                    <label className="label">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="input"><option value="inactive">Inactive</option><option value="active">Active</option><option value="expired">Expired</option></select>
                    <label className="label">Expires On</label>
                    <input type="date" name="expiresAt" value={formData.expiresAt} onChange={handleInputChange} className="input"/>
                    <label className="label">Subscription Price</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="input" placeholder="e.g., 500"/>
                    <label className="label">Amount Paid</label>
                    <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleInputChange} className="input" placeholder="e.g., 250"/>
                </div>
                <div className="mt-6 flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                    <button type="button" className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <p><strong>Type:</strong> <span className="font-mono">{tenant.subscription?.type}</span></p>
                <p><strong>Status:</strong> <span className={`badge ${ tenant.subscription?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{tenant.subscription?.status}</span></p>
                <p><strong>Expires At:</strong> <span className="font-mono">{tenant.subscription?.expiresAt ? new Date(tenant.subscription.expiresAt).toLocaleDateString() : 'N/A'}</span></p>
                <hr className="my-2"/>
                <p><strong>Price:</strong> <span className="font-mono text-green-600 font-semibold">{formatCurrency(tenant.subscription?.price)}</span></p>
                <p><strong>Paid:</strong> <span className="font-mono text-blue-600 font-semibold">{formatCurrency(tenant.subscription?.paidAmount)}</span></p>
                <p><strong>Remaining:</strong> <span className="font-mono text-red-600 font-semibold">{formatCurrency(tenant.subscription?.remainingAmount)}</span></p>
                <button className="btn mt-4" onClick={() => setIsEditing(true)}>Edit Subscription</button>
              </div>
            )}
          </div>
          <div className="card">
            <h2 className="font-bold text-lg mb-3">Manage Company</h2>
            <div className="flex flex-col gap-2">
              <button className="btn" onClick={handleToggleActiveStatus} disabled={isTogglingStatus}>
                {isTogglingStatus ? 'Updating...' : (tenant.isActive ? 'Suspend Company' : 'Re-activate Company')}
              </button>
              <button className="btn btn-error" onClick={handleDeleteTenant} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Company'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}