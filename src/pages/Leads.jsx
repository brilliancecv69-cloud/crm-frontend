import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "../axios";
import { Link } from "react-router-dom";
import { debounce } from "lodash";
import { FaCheck } from 'react-icons/fa';

// Helper function to format date
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

// Modal Component - With new styling
const AssignModal = ({ isOpen, onClose, salesUsers, onAssign }) => {
    const [selectedSalesId, setSelectedSalesId] = useState('');

    if (!isOpen) return null;

    const handleAssign = () => {
        if (!selectedSalesId) {
            alert('Please select a sales person.');
            return;
        }
        onAssign(selectedSalesId);
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm card">
                <h3 className="text-lg font-bold mb-4">Assign to Sales</h3>
                <div className="field mb-4">
                    <span>Select Sales Person</span>
                    <select
                        value={selectedSalesId}
                        onChange={(e) => setSelectedSalesId(e.target.value)}
                        className="input"
                    >
                        <option value="" disabled>-- Select --</option>
                        {salesUsers.length > 0 ? (
                            salesUsers.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))
                        ) : (
                            <option disabled>No sales users found</option>
                        )}
                    </select>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="btn secondary">Cancel</button>
                    <button onClick={handleAssign} className="btn primary">
                        <FaCheck className="mr-2" />
                        Confirm Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function LeadsPage() {
    const [contacts, setContacts] = useState([]);
    const [salesUsers, setSalesUsers] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // pagination state
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    // Filters State
    const [filters, setFilters] = useState({
        query: "",
        fromDate: "",
        toDate: "",
        assignedTo: "all"
    });

    // Debounced fetch function
    const fetchLeads = useCallback(debounce(async (currentFilters, currentPage) => {
        try {
            setLoading(true);
            setErrorMsg("");
            const params = {
                stage: "lead",
                q: currentFilters.query || undefined,
                from: currentFilters.fromDate || undefined,
                to: currentFilters.toDate || undefined,
                assignedTo: currentFilters.assignedTo === 'all' ? undefined : currentFilters.assignedTo,
                page: currentPage,
                limit,
                sortBy: "createdAt",
                order: "desc",
            };
            const res = await axios.get(`/contacts`, { params });
            const items = res.data?.data?.items ?? [];
            const totalDocs = res.data?.data?.total ?? 0;
            setContacts(Array.isArray(items) ? items : []);
            setTotal(totalDocs);
        } catch (err) {
            console.error("Error fetching leads:", err);
            const msg = err.response?.data?.error || err.message || "Unknown error";
            setErrorMsg(msg);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    }, 300), []);

    // Fetch sales users on mount
    useEffect(() => {
        const fetchSalesUsers = async () => {
            try {
                const res = await axios.get('/auth/users?role=sales');
                setSalesUsers(res.data?.data || []);
            } catch (err) {
                console.error("Failed to fetch sales users:", err);
            }
        };
        fetchSalesUsers();
    }, []);

    // Fetch leads when filters or page change
    useEffect(() => {
        fetchLeads(filters, page);
        setSelectedLeads([]);
    }, [filters, page, fetchLeads]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // reset to first page when filters change
    };

    const setDateRange = (range) => {
        const today = new Date();
        let from = '';
        const to = formatDate(today);

        if (range === 'today') {
            from = to;
        } else if (range === 'month') {
            from = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
        }
        setFilters(prev => ({ ...prev, fromDate: from, toDate: to }));
        setPage(1);
    };

    const handleSelectLead = (leadId) => {
        setSelectedLeads(prev =>
            prev.includes(leadId)
                ? prev.filter(id => id !== leadId)
                : [...prev, leadId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLeads(contacts.map(c => c._id));
        } else {
            setSelectedLeads([]);
        }
    };

    const handleAssignLeads = async (salesId) => {
        if (selectedLeads.length === 0) {
            return alert("No leads selected.");
        }
        try {
            const res = await axios.put(`/leads/assign-bulk`, {
                leadIds: selectedLeads,
                salesId: salesId
            });
            alert(res.data.message || 'Leads assigned successfully!');
            setIsModalOpen(false);
            setSelectedLeads([]);
            fetchLeads(filters, page);
        } catch (err) {
            const msg = err.response?.data?.error || err.message || "Failed to assign leads.";
            alert(`Error: ${msg}`);
            console.error("Assignment error:", err);
        }
    };
    
    const handleExport = async () => {
        try {
            const res = await axios.get(`/contacts/export`, { responseType: 'blob' });
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

    const hasRows = contacts && contacts.length > 0;
    const isAllSelected = hasRows && selectedLeads.length === contacts.length;

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="flex flex-col h-[calc(100vh-8.5rem)]">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold">Leads ({total})</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="btn primary" 
                            disabled={selectedLeads.length === 0}
                        >
                            Assign Selected ({selectedLeads.length})
                        </button>
                        <button onClick={handleExport} className="btn secondary">Export</button>
                        <Link to="/leads/new" className="btn primary">+ Add Lead</Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-2 p-3 card text-sm">
                    <div className="field lg:col-span-2">
                        <span>Search...</span>
                        <input type="text" name="query" placeholder="Search by Name, Phone, Email..." value={filters.query} onChange={handleFilterChange} className="input input-sm" />
                    </div>
                    <div className="field">
                        <span>Assigned To</span>
                        <select name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange} className="input input-sm">
                            <option value="all">All Users</option>
                            <option value="unassigned">Unassigned</option>
                            {salesUsers.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <span>From Date</span>
                        <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="input input-sm" />
                    </div>
                    <div className="field">
                        <span>To Date</span>
                        <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="input input-sm" />
                    </div>
                    <div className="field flex items-end gap-1">
                        <button onClick={() => setDateRange('today')} className="btn btn-sm w-full">Today</button>
                        <button onClick={() => setDateRange('month')} className="btn btn-sm w-full">Month</button>
                    </div>
                </div>

                {errorMsg && <span className="text-danger self-center">{errorMsg}</span>}
            </div>

            <div className="table-wrap flex-grow min-h-0">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="w-10"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Assigned To</th>
                            <th>Created At</th>
                            <th>Stage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && ( <tr><td colSpan={7} className="text-center p-6">Loading...</td></tr> )}
                        {!loading && !hasRows && ( <tr><td colSpan={7} className="text-center p-6">No leads found.</td></tr> )}
                        {hasRows && contacts.map((contact) => (
                            <tr key={contact._id} className={selectedLeads.includes(contact._id) ? 'bg-blue-100' : ''}>
                                <td><input type="checkbox" checked={selectedLeads.includes(contact._id)} onChange={() => handleSelectLead(contact._id)} /></td>
                                <td>{contact.name || "-"}</td>
                                <td>{contact.phone}</td>
                                <td>
                                    {contact.assignedTo ? ( <span className="font-semibold">{contact.assignedTo.name}</span> ) : ( <span className="badge badge-gray">UNASSIGNED</span> )}
                                </td>
                                <td>{new Date(contact.createdAt).toLocaleString()}</td>
                                <td><span className="badge" data-stage={contact.stage || "lead"}>{(contact.stage || "lead").toUpperCase()}</span></td>
                                <td><Link to={`/contacts/${contact._id}`} className="btn btn-sm">View</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center items-center gap-4 p-4">
                <button 
                    className="btn secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Prev
                </button>
                <span>Page {page} of {totalPages || 1}</span>
                <button 
                    className="btn secondary"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                >
                    Next
                </button>
            </div>

            <AssignModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                salesUsers={salesUsers}
                onAssign={handleAssignLeads}
            />
        </div>
    );
}
