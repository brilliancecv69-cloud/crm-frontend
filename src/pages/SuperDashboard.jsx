import { NavLink } from "react-router-dom";

export default function SuperDashboard() {
  return (
    <div className="page">
      <h1 className="text-2xl font-bold mb-6">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NavLink to="/super/tenants" className="card hover:shadow-lg transition p-6">
          <h2 className="font-bold text-lg">🏢 Manage Companies</h2>
          <p className="text-sm text-gray-600">Add, edit, or remove tenant companies.</p>
        </NavLink>
        <NavLink to="/super/users" className="card hover:shadow-lg transition p-6">
          <h2 className="font-bold text-lg">👥 Manage Users</h2>
          <p className="text-sm text-gray-600">Control admins and sales accounts per company.</p>
        </NavLink>
      </div>
    </div>
  );
}
