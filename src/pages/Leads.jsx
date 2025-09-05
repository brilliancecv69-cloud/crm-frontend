import { useEffect, useState, useMemo } from "react";
import axios from "../axios";
import { Link } from "react-router-dom";
import { debounce } from "lodash";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper function to format date
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

export default function LeadsPage() {
    const [contacts, setContacts] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

    const fetchLeads = useMemo(
        () =>
            debounce(async (searchQuery, dates) => {
                try {
                    setLoading(true);
                    setErrorMsg("");
                    const params = {
                        stage: "lead",
                        q: searchQuery,
                        page: 1,
                        limit: 500,
                        sortBy: "createdAt",
                        order: "desc",
                        from: dates.from || undefined,
                        to: dates.to || undefined,
                    };
                    const res = await axios.get(`${API_BASE}/contacts`, { params });
                    const data = res.data?.data?.items ?? [];
                    setContacts(Array.isArray(data) ? data : []);
                } catch (err) {
                    console.error("Error fetching leads:", err);
                    const msg = err.response?.data?.error || err.message || "Unknown error";
                    setErrorMsg(msg);
                    setContacts([]);
                } finally {
                    setLoading(false);
                }
            }, 300),
        []
    );

    useEffect(() => {
        fetchLeads(query, dateFilter);
    }, [query, dateFilter, fetchLeads]);

    // ✅ --- دالة تصدير الإكسل ---
    const handleExport = async () => {
        try {
            const res = await axios.get(`${API_BASE}/contacts/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to export data.');
            console.error("Export error:", err);
        }
    };
    
    const setToday = () => {
        const today = formatDate(new Date());
        setDateFilter({ from: today, to: today });
    };

    const setThisMonth = () => {
        const today = new Date();
        const firstDay = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
        const currentDay = formatDate(today);
        setDateFilter({ from: firstDay, to: currentDay });
    };

    const hasRows = contacts && contacts.length > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 8.5rem)' }}>
            <div style={{ flexShrink: 0 }}>
                <div className="head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Leads</h2>
                    {/* ✅ --- زر التصدير الجديد --- */}
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="btn secondary">Export to Excel</button>
                        <Link to="/leads/new" className="btn primary">+ Add Lead</Link>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-4 card">
                    <div className="field md:col-span-4">
                        <span>Search by Name, Phone, Email...</span>
                        <input
                            type="text"
                            placeholder="Search all leads..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div className="field">
                        <span>From Date</span>
                        <input type="date" value={dateFilter.from} onChange={e => setDateFilter(prev => ({ ...prev, from: e.target.value }))} className="input" />
                    </div>
                    <div className="field">
                        <span>To Date</span>
                        <input type="date" value={dateFilter.to} onChange={e => setDateFilter(prev => ({ ...prev, to: e.target.value }))} className="input" />
                    </div>
                    <div className="field md:col-span-2 flex items-end gap-2">
                        <button onClick={setToday} className="btn w-full">Today</button>
                        <button onClick={setThisMonth} className="btn w-full">This Month</button>
                    </div>
                </div>

                {errorMsg && <span className="text-danger self-center">{errorMsg}</span>}
            </div>

            <div className="table-wrap" style={{ flexGrow: 1, minHeight: 0 }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Created At</th>
                            <th>Stage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                                    Loading...
                                </td>
                            </tr>
                        )}
                        {!loading && !hasRows && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                                    No leads found for the selected period.
                                </td>
                            </tr>
                        )}
                        {hasRows &&
                            contacts.map((contact) => (
                                <tr key={contact._id}>
                                    <td>{contact.name || "-"}</td>
                                    <td>{contact.phone}</td>
                                    <td>{contact.email || "-"}</td>
                                    <td>
                                        {contact.createdAt
                                            ? new Date(contact.createdAt).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td>
                                        <span className="badge" data-stage={contact.stage || "lead"}>
                                            {(contact.stage || "lead").toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/contacts/${contact._id}`} className="btn">
                                            View Profile
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}