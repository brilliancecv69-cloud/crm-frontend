import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  FaChartLine, FaWhatsapp, FaUsers, FaUserTie, FaDollarSign,
  FaFileInvoice, FaChartPie, FaBox, FaRegCommentDots, FaTruck,
  FaUserCog, FaHistory, FaBuilding, FaTasks
} from 'react-icons/fa';
import './index.css';
import './styles/theme.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import socket from './socketClient';

// Pages
import Dashboard from './pages/Dashboard';
import WhatsApp from './pages/WhatsApp';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import ContactProfile from './pages/ContactProfile';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ProductsList from './pages/ProductsList';
import ProductProfile from './pages/ProductProfile';
import CannedResponsesPage from './pages/CannedResponses';
import SuperLogin from './pages/SuperLogin';
import SuperDashboard from './pages/SuperDashboard';
import TenantsList from './pages/TenantsList';
import UsersList from './pages/UsersList';
import TenantProfile from './pages/TenantProfile';
import NotificationBell from './components/NotificationBell';
import NewLeadPage from './components/NewLeadPage';
import ShippingPage from './pages/ShippingPage';
import TaskManagement from './pages/admin/TaskManagement';
import SalesPerformanceReport from './pages/admin/SalesPerformanceReport';
import TeamSettings from './pages/admin/TeamSettings';
import FollowUpTemplates from './pages/FollowUpTemplates';
import SuperAdminUsers from './pages/SuperAdminUsers';
import MyTasks from './pages/MyTasks';

// Helper Hook for detecting clicks outside an element
function useClickAway(ref, cb) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) cb?.();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, cb]);
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const { user, logout } = useAuth();
  useClickAway(box, () => setOpen(false));

  if (!user) return null;
  const avatarInitial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="user-menu" ref={box}>
      <button className="user-btn" onClick={() => setOpen(v => !v)}>
        <div className="avatar">{avatarInitial}</div>
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
        </div>
        <span className="i">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="user-dropdown">
          <NavLink className="item" to="/profile"><span className="i">person</span> Profile</NavLink>
          <div className="item" onClick={logout}><span className="i">logout</span> Sign out</div>
        </div>
      )}
    </div>
  );
}

// Authentication Guard Components
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading Application...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoutes() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}

function RequireSuperAuth({ children }) {
  const isSuperAdmin = !!localStorage.getItem("superToken");
  return isSuperAdmin ? children : <Navigate to="/super/login" replace />;
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  console.log("Current User:", user);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      console.log("Attempting to connect socket...");
      socket.connect();
    }
    return () => {
      console.log("Disconnecting socket...");
      socket.disconnect();
    };
  }, [user]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // --- ✅ قائمة أساسية متغيرة حسب الدور ---
  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaChartLine />, roles: ['admin','sales'] },
    { name: "WhatsApp", path: "/whatsapp", icon: <FaWhatsapp />, roles: ['admin','sales'] },
    { name: "Leads", path: "/leads", icon: <FaUsers />, roles: ['admin','sales'] },
    { name: "Customers", path: "/customers", icon: <FaUserTie />, roles: ['admin','sales'] },
    { name: "Sales", path: "/sales", icon: <FaDollarSign />, roles: ['admin','sales'] },
    { name: "Expenses", path: "/expenses", icon: <FaFileInvoice />, roles: ['admin'] },
    { name: "Products", path: "/products", icon: <FaBox />, roles: ['admin'] },
    { name: "Shipping", path: "/shipping", icon: <FaTruck />, roles: ['admin'] },
    { name: "Reports", path: "/reports", icon: <FaChartPie />, roles: ['admin'] },
    { name: "Canned Responses", path: "/canned-responses", icon: <FaRegCommentDots />, roles: ['admin','sales'] },
    { name: "Follow-up Templates", path: "/follow-up-templates", icon: <FaHistory />, roles: ['admin','sales'] },
  ];

  const adminMenuItems = [
    { name: "Users", path: "/team/users", icon: <FaUserCog /> },
    { name: "Performance", path: "/team/performance", icon: <FaChartPie /> },
    { name: "Tasks", path: "/team/tasks", icon: <FaFileInvoice /> },
    { name: "Settings", path: "/team/settings", icon: <FaUserCog /> },
  ];

  const getLinkClassName = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  return (
    <div className="layout-wrapper">
      <aside className={`sidebar ${!sidebarOpen && "is-collapsed"}`}>
      <div className="sidebar-header bg-sidebar">
  {sidebarOpen && (
    <NavLink to="/" className="sidebar-brand-logo">
      <span>Wavoo CRM</span>
    </NavLink>
  )}
  <button
    className="icon-btn"
    onClick={() => setSidebarOpen(s => !s)}
    aria-label="Toggle sidebar"
  >
    <span className="i">{sidebarOpen ? "chevron_left" : "menu"}</span>
  </button>
</div>

        <nav className="sidebar-nav">
          {menuItems
            .filter(item => item.roles.includes(user?.role)) // ✅ فلترة حسب الدور
            .map((item) => (
              <NavLink key={item.path} to={item.path} className={getLinkClassName} title={item.name}>
                <span className="i">{item.icon}</span>
                <span className="link-text">{item.name}</span>
              </NavLink>
          ))}

          {user?.role === 'sales' && (
            <>
              <div className="sidebar-divider">My Space</div>
              <NavLink to="/my-tasks" className={getLinkClassName} title="My Tasks">
                  <span className="i"><FaTasks /></span>
                  <span className="link-text">My Tasks</span>
              </NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="sidebar-divider">Team Management</div>
              {adminMenuItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={getLinkClassName} title={item.name}>
                    <span className="i">{item.icon}</span>
                    <span className="link-text">{item.name}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
      <div className="main-content">
        <header className="main-header">
          <div></div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme">
              <span className="i">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SuperAdminLayout() {
  const getLinkClassName = ({ isActive }) => `block py-2 px-4 rounded transition ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`;

  const superLogout = () => {
    localStorage.removeItem("superToken");
    window.location.href = '/super/login';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Super Admin</h1>
            <button onClick={superLogout} title="Logout" className="hover:bg-gray-700 p-2 rounded-full">
                <span className="i">logout</span>
            </button>
        </div>
        <nav>
          <ul>
            <li>
              <NavLink to="/super/dashboard" className={getLinkClassName}>
                <FaChartLine className="inline mr-2" /> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/super/tenants" className={getLinkClassName}>
                <FaBuilding className="inline mr-2" /> Companies
              </NavLink>
            </li>
            <li>
              <NavLink to="/super/users" className={getLinkClassName}>
                <FaUsers className="inline mr-2" /> Users
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/super/login" element={<SuperLogin />} />

          <Route path="/super" element={<RequireSuperAuth><SuperAdminLayout /></RequireSuperAuth>}>
            <Route path="dashboard" element={<SuperDashboard />} />
            <Route path="tenants" element={<TenantsList />} />
            <Route path="tenants/:id" element={<TenantProfile />} />
            <Route path="users" element={<SuperAdminUsers />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Regular User Routes */}
          <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="leads" element={<Leads />} />
            <Route path="customers" element={<Customers />} />
            <Route path="sales" element={<Sales />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="contacts/:id" element={<ContactProfile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="products/:id" element={<ProductProfile />} />
            <Route path="canned-responses" element={<CannedResponsesPage />} />
            <Route path="leads/new" element={<NewLeadPage />} />
            <Route path="follow-up-templates" element={<FollowUpTemplates />} />
            
            <Route path="my-tasks" element={<MyTasks />} />
            
            {/* Admin Specific Routes */}
            <Route path="team/users" element={<UsersList />} />
            <Route element={<AdminRoutes />}>
              <Route path="team/performance" element={<SalesPerformanceReport />} />
              <Route path="team/tasks" element={<TaskManagement />} />
              <Route path="team/settings" element={<TeamSettings />} />
            </Route>

            <Route path="*" element={<div>Page Not Found</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
