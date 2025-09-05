import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  FaChartLine, FaWhatsapp, FaUsers, FaUserTie, FaDollarSign,
  FaFileInvoice, FaChartPie, FaBox, FaRegCommentDots, FaTruck 
} from 'react-icons/fa';
import './index.css';
import './styles/theme.css';
import { AuthProvider, useAuth } from './context/AuthContext';

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
import NewLeadPage from './components/NewLeadPage'; // ✅ ---  تمت إضافة هذا السطر ---
import ShippingPage from './pages/ShippingPage';
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
        {/* Container for user info with overflow handling */}
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

function RequireSuperAuth({ children }) {
  // This assumes you add `isSuperAdmin` to your AuthContext
  const isSuperAdmin = !!localStorage.getItem("superToken"); // Simplified check
  return isSuperAdmin ? children : <Navigate to="/super/login" replace />;
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaChartLine /> },
    { name: "WhatsApp", path: "/whatsapp", icon: <FaWhatsapp /> },
    { name: "Leads", path: "/leads", icon: <FaUsers /> },
    { name: "Customers", path: "/customers", icon: <FaUserTie /> },
    { name: "Sales", path: "/sales", icon: <FaDollarSign /> },
    { name: "Expenses", path: "/expenses", icon: <FaFileInvoice /> },
    { name: "Products", path: "/products", icon: <FaBox /> },
    { name: "Shipping", path: "/shipping", icon: <FaTruck /> },
    { name: "Reports", path: "/reports", icon: <FaChartPie /> },
    { name: "Canned Responses", path: "/canned-responses", icon: <FaRegCommentDots /> },
  ];

  const getLinkClassName = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  return (
    <div className="layout-wrapper">
      <aside className={`sidebar ${!sidebarOpen && "is-collapsed"}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <NavLink to="/" className="sidebar-brand-logo">
              <span>CRM</span>
            </NavLink>
          )}
          <button className="icon-btn" onClick={() => setSidebarOpen(s => !s)} aria-label="Toggle sidebar">
            <span className="i">{sidebarOpen ? "chevron_left" : "menu"}</span>
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={getLinkClassName} title={item.name}>
              <span className="i">{item.icon}</span>
              <span className="link-text">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="main-header">
          {/* Left side of header (can add breadcrumbs or search here later) */}
          <div></div>
          {/* Right side of header */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme">
              <span className="i">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        
        
        <main className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/contacts/:id" element={<ContactProfile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products" element={<ProductsList />} />
             <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/products/:id" element={<ProductProfile />} />
            <Route path="/canned-responses" element={<CannedResponsesPage />} />
            <Route path="/leads/new" element={<NewLeadPage />} /> {/* ✅ --- تمت إضافة هذا السطر --- */}

          </Routes>
        </main>
      </div>
    </div>
  );
}

// Super Admin Layout
function SuperAdminLayout() {
  return (
    <div>
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Super Admin</h1>
        <UserMenu />
      </header>
      <main className="p-6">
        <Routes>
          <Route path="/dashboard" element={<SuperDashboard />} />
          <Route path="/tenants" element={<TenantsList />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/tenants/:id" element={<TenantProfile />} />
        </Routes>
      </main>
    </div>
  );
}

// Main App Component with Routing
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/super/login" element={<SuperLogin />} />
          <Route path="/*" element={<RequireAuth><MainLayout /></RequireAuth>} />
          <Route path="/super/*" element={<RequireSuperAuth><SuperAdminLayout /></RequireSuperAuth>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}