import { useEffect, useState } from "react";
import axios from "../axios";
import { FaPlus, FaEdit, FaTrash, FaShippingFast, FaCheckCircle, FaBoxOpen } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// --- UI Components ---
function KpiCard({ label, value, icon, className }) {
  return (
    <div className={`kpi-card ${className || ''}`}>
      <div className="flex items-center gap-4">
        <div className="text-3xl text-gray-400">{icon}</div>
        <div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ShippingCompanyModal({ company, onClose, onSave }) {
    const [form, setForm] = useState({
        name: company?.name || "",
        contactPerson: company?.contactPerson || "",
        phone: company?.phone || "",
        trackingURL: company?.trackingURL || "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (company?._id) {
                await axios.patch(`${API_BASE}/shipping/${company._id}`, form);
            } else {
                await axios.post(`${API_BASE}/shipping`, form);
            }
            onSave();
        } catch (err) {
            console.error("Failed to save shipping company", err);
            alert("Error: " + (err.response?.data?.error || "Could not save company."));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{company?._id ? "Edit" : "Add"} Shipping Company</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="field">
                            <label className="field-label">Company Name</label>
                            <input name="name" value={form.name} onChange={handleChange} className="input" required />
                        </div>
                        <div className="field">
                            <label className="field-label">Contact Person</label>
                            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className="input" />
                        </div>
                        <div className="field">
                            <label className="field-label">Phone</label>
                            <input name="phone" value={form.phone} onChange={handleChange} className="input" />
                        </div>
                        <div className="field">
                            <label className="field-label">Tracking URL (optional)</label>
                            <input name="trackingURL" value={form.trackingURL} onChange={handleChange} className="input" placeholder="e.g., https://bosta.co/tracking/?tn=" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="btn secondary">Cancel</button>
                        <button type="submit" className="btn primary">Save Company</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ShippingPage() {
    const [companies, setCompanies] = useState([]);
    const [stats, setStats] = useState([]); // ✅ State for analytics
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch both companies and stats in parallel
            const [companiesRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE}/shipping`),
                axios.get(`${API_BASE}/shipping/stats`)
            ]);
            setCompanies(companiesRes.data.data);
            setStats(statsRes.data.data);
        } catch (err) {
            console.error("Failed to fetch shipping data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = () => {
        setIsModalOpen(false);
        setSelectedCompany(null);
        fetchData(); // Refresh both lists
    };

    const openAddModal = () => {
        setSelectedCompany(null);
        setIsModalOpen(true);
    };

    const openEditModal = (company) => {
        setSelectedCompany(company);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this shipping company?")) {
            try {
                await axios.delete(`${API_BASE}/shipping/${id}`);
                fetchData(); // Refresh both lists
            } catch (err) {
                console.error("Failed to delete company", err);
                alert("Error: Could not delete company.");
            }
        }
    };

    return (
        <div className="page">
            <div className="head">
                <h2>Shipping Analytics & Management</h2>
                <button onClick={openAddModal} className="btn primary">
                    <FaPlus className="mr-2" /> Add Company
                </button>
            </div>

            {isModalOpen && (
                <ShippingCompanyModal
                    company={selectedCompany}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            {/* ✅ --- START: Analytics Section --- ✅ */}
            <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">Performance Overview</h3>
                {loading ? <p>Loading stats...</p> : stats.length === 0 ? <p>No shipping data available to analyze.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.map(stat => (
                            <div key={stat.company} className="card p-4">
                                <h4 className="font-bold text-lg mb-3">{stat.company}</h4>
                                <div className="space-y-3">
                                    <KpiCard 
                                        label="Total Shipments" 
                                        value={stat.totalShipments} 
                                        icon={<FaBoxOpen />} 
                                    />
                                    <KpiCard 
                                        label="Shipped / Delivered" 
                                        value={(stat.stats.shipped || 0) + (stat.stats.delivered || 0)} 
                                        icon={<FaShippingFast />} 
                                    />
                                    <KpiCard 
                                        label="Pending / Processing" 
                                        value={(stat.stats.pending || 0) + (stat.stats.processing || 0)} 
                                        icon={<FaEdit />} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* ✅ --- END: Analytics Section --- ✅ */}


            {/* Companies Table */}
            <h3 className="text-xl font-bold mb-4 mt-8">Registered Shipping Companies</h3>
            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact Person</th>
                            <th>Phone</th>
                            <th>Tracking URL</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center p-4">Loading...</td></tr>
                        ) : companies.length === 0 ? (
                            <tr><td colSpan="5" className="text-center p-4">No shipping companies found. Click "Add Company" to start.</td></tr>
                        ) : (
                            companies.map(company => (
                                <tr key={company._id}>
                                    <td>{company.name}</td>
                                    <td>{company.contactPerson || '-'}</td>
                                    <td>{company.phone || '-'}</td>
                                    <td className="truncate max-w-xs">{company.trackingURL || '-'}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(company)} className="btn icon-btn" title="Edit"><FaEdit /></button>
                                            <button onClick={() => handleDelete(company._id)} className="btn icon-btn danger" title="Delete"><FaTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}