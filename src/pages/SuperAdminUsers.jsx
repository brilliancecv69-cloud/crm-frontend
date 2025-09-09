import { useEffect, useState } from "react";
import axios from "../axios"; // Your configured axios instance
import UserEditModal from "./UserEditModal"; // We can reuse the same modal
import { formatDistanceToNow } from 'date-fns';

// Helper component to show time like "about 5 hours ago"
const TimeAgo = ({ date }) => {
    if (!date) return 'Never';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Form to add a new user, specific for Super Admin
const AddUserForm = ({ onUserAdded }) => {
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales", tenantId: "" });
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Fetch companies to populate the dropdown
        const fetchTenants = async () => {
            try {
                const res = await axios.get(`/super/tenants`);
                if (res.data.ok) setTenants(res.data.data);
            } catch (err) {
                console.error("Failed to fetch tenants", err);
            }
        };
        fetchTenants();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await axios.post(`/super/users`, form);
            setForm({ name: "", email: "", password: "", role: "sales", tenantId: "" }); // Reset form
            onUserAdded(); // Refresh the user list
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add user");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 card p-4">
            {error && <p className="text-red-500 col-span-full">{error}</p>}
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input" required/>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input" type="email" required/>
            <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" className="input" required/>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
                <option value="sales">Sales</option>
                <option value="admin">Admin</option>
            </select>
            <select value={form.tenantId} onChange={e => setForm({ ...form, tenantId: e.target.value })} className="input" required>
                <option value="">-- Select Company --</option>
                {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <button type="submit" className="btn primary w-full" disabled={loading}>
                {loading ? 'Adding...' : 'Add User'}
            </button>
        </form>
    );
};

// Main component for the Super Admin Users Page
export default function SuperAdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            // This is simple: always fetch from the super admin endpoint
            const res = await axios.get(`/super/users`);
            if (res.data.ok) {
                setUsers(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch users when the component loads
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user permanently?")) {
            try {
                await axios.delete(`/super/users/${userId}`);
                fetchUsers(); // Refresh list after delete
            } catch (err) {
                setError(err.response?.data?.error || "Failed to delete user");
            }
        }
    };
   
    const handleEditSuccess = () => {
        setEditingUser(null); // Close the modal
        fetchUsers(); // Refresh list after edit
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">👥 Manage All Users</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            <AddUserForm onUserAdded={fetchUsers} />

            <div className="card overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Last Seen</th>
                            <th>Company</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td>
                                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td><TimeAgo date={user.lastSeen} /></td>
                                <td>{user.tenantId?.name || 'N/A'}</td>
                                <td className="text-right">
                                    <button onClick={() => setEditingUser(user)} className="btn btn-sm btn-ghost">Edit</button>
                                    <button onClick={() => handleDelete(user._id)} className="btn btn-sm btn-ghost text-red-500">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <UserEditModal 
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}