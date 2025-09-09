import React, { useEffect, useState } from "react";
import axios from "../axios";
import UserEditModal from "./UserEditModal";
import socket from "../socketClient";

// ✅ يعرض التاريخ والوقت بالصيغة النهائية التي طلبتها
const TimeAgo = ({ date }) => {
  if (!date) return "Never";
  
  const d = new Date(date);
  
  const time = d.toLocaleTimeString("en-US", {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  // صيغة en-GB تعطينا يوم/شهر/سنة
  const dateString = d.toLocaleDateString("en-GB");

  return `${time} (${dateString})`;
};

const SuperAdminAddUserForm = ({ onUserAdded }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales", tenantId: "" });
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await axios.get("/super/tenants");
        if (res.data.ok) setTenants(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch tenants");
      }
    };
    fetchTenants();
  }, []);

  const addUser = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("/super/users", form);
      setForm({ name: "", email: "", password: "", role: "sales", tenantId: "" });
      onUserAdded();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add user");
    }
  };

  return (
    <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 card p-4">
      {error && <p className="text-red-500 col-span-full">{error}</p>}
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input" required />
      <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input" type="email" required />
      <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" className="input" required />
      <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
        <option value="sales">Sales</option>
        <option value="admin">Admin</option>
      </select>
      <select value={form.tenantId} onChange={e => setForm({ ...form, tenantId: e.target.value })} className="input" required>
        <option value="">-- Select Company --</option>
        {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </select>
      <button type="submit" className="btn primary w-full">Add User</button>
    </form>
  );
};

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [sessions, setSessions] = useState({});

  const isSuperAdmin = window.location.pathname.startsWith("/super");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ تم تصحيح مسارات جلب المستخدمين
      const url = isSuperAdmin ? "/super/users" : "/users";
      const res = await axios.get(url);

      // Super admin response is { ok: true, data: [...] }
      // Admin response is [...]
      const usersData = isSuperAdmin ? res.data.data : res.data;
      setUsers(usersData || []);

    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (userId) => {
    if (!userId || sessions[userId]) return;
    try {
      // ✅ تم تصحيح مسار جلب الجلسات
      const res = await axios.get(`/users/${userId}/sessions`);
      if (res.data.ok) {
        setSessions((prev) => ({ ...prev, [userId]: res.data.sessions }));
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSuperAdmin]);

  useEffect(() => {
    const handleStatusChange = (data) => {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === data.userId ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen, status: data.isOnline ? 'online' : 'offline' } : user
        )
      );
    };
    socket.on("user:status_change", handleStatusChange);

    const handleIdleChange = (data) => {
        setUsers((current) =>
            current.map((u) => u._id === data.userId ? { ...u, status: "idle" } : u)
        );
    };
    socket.on("user:idle", handleIdleChange);

    return () => {
      socket.off("user:status_change", handleStatusChange);
      socket.off("user:idle", handleIdleChange);
    };
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user permanently?")) {
      try {
        await axios.delete(`/super/users/${userId}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.error || "Failed to delete user");
      }
    }
  };

  const handleEditSuccess = () => {
    setEditingUser(null);
    fetchUsers();
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">👥 Manage Users</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {isSuperAdmin && <SuperAdminAddUserForm onUserAdded={fetchUsers} />}

      <div className="card">
        <div className="table-wrap overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>First Login</th>
                <th>Last Active</th>
                <th>Last Seen</th>
                {isSuperAdmin && <th>Company</th>}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <React.Fragment key={user._id}>
                  <tr>
                    <td>
                      <button
                        onClick={() => {
                          if (expandedUser === user._id) {
                            setExpandedUser(null);
                          } else {
                            setExpandedUser(user._id);
                            fetchSessions(user._id);
                          }
                        }}
                      >
                        {expandedUser === user._id ? "▼" : "▶"}
                      </button>
                    </td>
                    <td>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td>{user.role}</td>
                    <td>
                      <div className="flex items-center">
                        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                            user.status === 'online' ? "bg-green-500" :
                            user.status === "idle" ? "bg-yellow-500" : "bg-gray-400"
                        }`}></div>
                        <span className="capitalize">{user.status}</span>
                      </div>
                    </td>
                    <td className="text-sm text-gray-500"><TimeAgo date={user.firstLogin} /></td>
                    <td className="text-sm text-gray-500"><TimeAgo date={user.lastActionAt} /></td>
                    <td className="text-sm text-gray-500"><TimeAgo date={user.lastSeen} /></td>
                    {isSuperAdmin && (
                      <td className="text-sm text-gray-500">{user.tenantId?.name || "N/A"}</td>
                    )}
                    <td className="text-right space-x-4">
                      <button onClick={() => setEditingUser(user)} className="action-link view">Edit</button>
                      {isSuperAdmin && (
                        <button onClick={() => handleDelete(user._id)} className="action-link delete">Delete</button>
                      )}
                    </td>
                  </tr>

                  {expandedUser === user._id && (
                    <tr>
                      <td colSpan={isSuperAdmin ? 9 : 8}>
                        <div className="p-3 bg-gray-50 rounded">
                          <h3 className="font-semibold mb-2">Session History</h3>
                          {!sessions[user._id] ? (
                            <p>Loading...</p>
                          ) : sessions[user._id].length === 0 ? (
                            <p>No sessions found (longer than 5 minutes)</p>
                          ) : (
                            <table className="table text-sm">
                              <thead>
                                <tr>
                                  <th>Login</th>
                                  <th>Logout</th>
                                  <th>Duration (min)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessions[user._id].map((s) => (
                                  <tr key={s._id}>
                                    <td><TimeAgo date={s.loginTime} /></td>
                                    <td>{s.logoutTime ? <TimeAgo date={s.logoutTime} /> : "Active"}</td>
                                    <td>{s.duration ? `${(s.duration / 60).toFixed(1)}` : "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
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