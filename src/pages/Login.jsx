import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaWhatsapp, FaUsers, FaChartBar, FaShieldAlt } from 'react-icons/fa';

// Promotional feature component
const Feature = ({ icon, title, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-slate-400">{children}</p>
    </div>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "admin@crm.com", password: "123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/"); // Redirect on successful login
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/201062309848?text=${encodeURIComponent("أرغب في إنشاء حساب جديد أو الحصول على دعم فني.")}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-20 items-center">
        
        {/* Promotional Side */}
        <div className="space-y-8 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white grid place-items-center font-bold text-2xl">C</div>
            <h1 className="text-3xl font-bold tracking-tight">CRM Pro</h1>
          </div>
          <p className="text-slate-300 text-lg">
            قم بإدارة عملائك ومبيعاتك ومحادثات WhatsApp، كل ذلك في مكان واحد. نظامنا يمنحك القوة للسيطرة الكاملة على أعمالك.
          </p>
          <div className="space-y-6">
            <Feature icon={<FaWhatsapp size={24} />} title="تكامل كامل مع WhatsApp">
              أرسل واستقبل الرسائل مباشرة من النظام، مع ربطها بملفات العملاء.
            </Feature>
            <Feature icon={<FaUsers size={24} />} title="إدارة العملاء والمبيعات">
              تتبع عملائك المحتملين وحولهم إلى عملاء دائمين مع دورة مبيعات واضحة.
            </Feature>
            <Feature icon={<FaChartBar size={24} />} title="تقارير ذكية">
              احصل على رؤى قيمة حول أداء فريقك ومبيعاتك لاتخاذ قرارات أفضل.
            </Feature>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold mb-2 text-center">مرحباً بعودتك!</h2>
          <p className="text-slate-400 mb-8 text-center">سجل الدخول للمتابعة إلى لوحة التحكم.</p>
          
          {error && <p className="bg-red-500/10 text-red-400 text-center p-3 rounded-md mb-6">{error}</p>}
          
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="البريد الإلكتروني"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                required
              />
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="كلمة المرور"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-400">
            <p>تحتاج مساعدة أو ترغب في إنشاء حساب؟</p>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-emerald-400 hover:text-emerald-300 transition"
            >
              <FaWhatsapp />
              تواصل معنا عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}