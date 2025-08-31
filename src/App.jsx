import { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import "./styles/theme.css";
import {
  FaChartLine, FaWhatsapp, FaUsers, FaUserTie, FaDollarSign,
  FaFileInvoice, FaChartPie, FaHeartbeat, FaUserCircle, FaBox, FaRegCommentDots
} from "react-icons/fa";
import axios from "./axios";

// Pages
import Dashboard from "./pages/Dashboard";
import WhatsApp from "./pages/WhatsApp";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import ContactProfile from "./pages/ContactProfile";
import NewLeadPage from "./components/NewLeadPage";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ProductsList from "./pages/ProductsList";
import ProductProfile from "./pages/ProductProfile";
import CannedResponsesPage from "./pages/CannedResponses";
import SuperLogin from "./pages/SuperLogin";
import SuperDashboard from "./pages/SuperDashboard";
import TenantsList from "./pages/TenantsList";
import UsersList from "./pages/UsersList";
import TenantProfile from "./pages/TenantProfile";
import NotificationBell from "./components/NotificationBell"; // 🟢 استيراد مكون الإشعارات

function useAuth() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get("/auth/me");
          if (res.data.ok) {
            setUser(res.data.data);
          } else {
            localStorage.removeItem("token");
            navigate("/login");
          }
        } catch (err) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };
    fetchUser();
  }, [navigate]);

  return user;
}

function useClickAway(ref, cb) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) cb?.();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, cb]);
}

function UserMenu({ onToggleDark, dark }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const user = useAuth();
  useClickAway(box, () => setOpen(false));
  const navigate = useNavigate();

  if (!user) {
    return <div className="user-btn">Loading...</div>;
  }
  
  const avatarInitial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="user-menu" ref={box}>
      <button className="user-btn" onClick={() => setOpen(v => !v)}>
        <div className="avatar">{avatarInitial}</div>
        <div className="hidden sm:block">
          <div style={{ fontWeight: 800 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{user.email}</div>
        </div>
        <span className="i">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="item" onClick={() => navigate("/profile")}>
            <span className="i">person</span> Profile
          </div>
          <div className="item"><span className="i">tune</span> Preferences</div>
          <div className="item" onClick={onToggleDark}>
            <span className="i">{dark ? "light_mode" : "dark_mode"}</span> Toggle Theme
          </div>
          <hr style={{ borderColor: "var(--border)", margin: "6px 0" }} />
          <div className="item" onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}>
            <span className="i">logout</span> Sign out
          </div>
        </div>
      )}
    </div>
  );
}

const THEME_PROFILES = [
  { id: "ocean", label: "Ocean" },
  { id: "violet", label: "Violet" },
  { id: "emerald", label: "Emerald" },
  { id: "rose", label: "Rose" },
];


function applyThemeClass(id) {
  const prefix = "theme-";
  const toRemove = Array.from(document.body.classList).filter(c => c.startsWith(prefix));
  toRemove.forEach(c => document.body.classList.remove(c));
  document.body.classList.add(`${prefix}${id}`);
}

function RequireSuperAuth({ children }) {
  const token = localStorage.getItem("superToken");
  if (!token) {
    window.location.href = "/super/login";
    return null;
  }
  return children;
}

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return null;
  }
  return children;
}

// ✅ تم فصل التصميم الرئيسي لسهولة القراءة
function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const savedDark = localStorage.getItem("ui.theme");
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
        setDark(savedDark ? savedDark === "dark" : prefersDark);
    }, []);

    const menuItems = [
        { name: "Dashboard", path: "/", icon: <FaChartLine /> },
        { name: "WhatsApp", path: "/whatsapp", icon: <FaWhatsapp /> },
        { name: "Leads", path: "/leads", icon: <FaUsers /> },
        { name: "Customers", path: "/customers", icon: <FaUserTie /> },
        { name: "Sales", path: "/sales", icon: <FaDollarSign /> },
        { name: "Expenses", path: "/expenses", icon: <FaFileInvoice /> },
        { name: "Products", path: "/products", icon: <FaBox /> },
        { name: "Reports", path: "/reports", icon: <FaChartPie /> },
        { name: "Canned Responses", path: "/canned-responses", icon: <FaRegCommentDots /> },
    ];

    const linkCls = ({ isActive }) =>
        [
        "group flex items-center w-full text-left px-3 py-2.5 rounded-xl transition",
        isActive
            ? "bg-gradient-to-r from-[color:var(--brand-600)] to-[color:var(--brand-700)] text-white shadow-md ring-1"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60",
        ].join(" ");

    return (
        <>
            <div className="aurora" aria-hidden="true" />
            <div className="min-h-screen flex relative">
                <aside className={[
                    "border-r border-[color:var(--border)] bg-[color:var(--surface)]/80 backdrop-blur-xl transition-all duration-200 p-4 flex flex-col gap-2",
                    sidebarOpen ? "w-64" : "w-20"
                ].join(" ")}>
                    <div className="flex items-center justify-between mb-4">
                        <NavLink to="/" className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl brand-tile text-white grid place-items-center font-bold">C</div>
                        {sidebarOpen && <span className="font-extrabold text-lg">CRM Beta</span>}
                        </NavLink>
                        <button className="icon-btn" onClick={() => setSidebarOpen(s => !s)} aria-label="Toggle sidebar">
                        <span className="i">{sidebarOpen ? "chevron_left" : "menu"}</span>
                        </button>
                    </div>
                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                        <NavLink key={item.path} to={item.path} className={linkCls}>
                            <span className="text-lg">{item.icon}</span>
                            {sidebarOpen && <span className="ml-3">{item.name}</span>}
                        </NavLink>
                        ))}
                    </nav>
                    <div className="mt-auto pt-4 border-t border-[color:var(--border)] grid gap-2">
                        <NavLink to="/health" className="btn secondary"><FaHeartbeat /> {sidebarOpen && "Health"}</NavLink>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col">
                    {/* ✅✅✅ **بداية الإضافة: الشريط العلوي الجديد** ✅✅✅ */}
                    <header className="sticky top-0 z-10 flex items-center justify-end h-16 px-6 border-b bg-white/70 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <UserMenu onToggleDark={() => setDark(d => !d)} dark={dark} />
                        </div>
                    </header>
                    {/* ✅✅✅ **نهاية الإضافة** ✅✅✅ */}
                    
                    <main className="flex-1 p-4 md:p-6 content-area">
                        <Routes>
                            {/* نفس المسارات الداخلية بدون تغيير */}
                            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                            <Route path="/whatsapp" element={<RequireAuth><WhatsApp /></RequireAuth>} />
                            <Route path="/leads" element={<RequireAuth><Leads /></RequireAuth>} />
                            <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                            <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
                            <Route path="/expenses" element={<RequireAuth><Expenses /></RequireAuth>} />
                            <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
                            <Route path="/health" element={<RequireAuth><div className="card" data-card>✅ Frontend Routes Loaded</div></RequireAuth>} />
                            <Route path="/contacts/:id" element={<RequireAuth><ContactProfile /></RequireAuth>} />
                            <Route path="/leads/new" element={<RequireAuth><NewLeadPage /></RequireAuth>} />
                            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                            <Route path="/products" element={<RequireAuth><ProductsList /></RequireAuth>} />
                            <Route path="/products/:id" element={<RequireAuth><ProductProfile /></RequireAuth>} />
                            <Route path="/canned-responses" element={<RequireAuth><CannedResponsesPage /></RequireAuth>} />
                            <Route path="/super/dashboard" element={<RequireSuperAuth><SuperDashboard /></RequireSuperAuth>} />
                            <Route path="/super/tenants" element={<RequireSuperAuth><TenantsList /></RequireSuperAuth>} />
                            <Route path="/super/users" element={<RequireSuperAuth><UsersList /></RequireSuperAuth>} />
                            <Route path="/super/tenants/:id" element={<RequireSuperAuth><TenantProfile /></RequireSuperAuth>} />
                        </Routes>
                    </main>
                </div>
            </div>
        </>
    );
}

export default function App() {
  // الكود الأصلي تم نقله إلى مكون MainLayout
  // المكون الرئيسي App أصبح مسؤول فقط عن التوجيه العام
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/super/login" element={<SuperLogin />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}