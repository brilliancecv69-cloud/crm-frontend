import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/auth/login", form);
      if (res.data.ok) {
        // 🟢 خزن كل البيانات المهمة
        localStorage.setItem("token", res.data.data.token);
        localStorage.setItem("tenantId", res.data.data.tenantId);
        localStorage.setItem("tenantName", res.data.data.name || "My Company");

        // 🟢 بعد اللوجين يروح على صفحة الواتساب أو الداشبورد
        navigate("/whatsapp");
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Login
        </button>
      </form>
    </div>
  );
}
