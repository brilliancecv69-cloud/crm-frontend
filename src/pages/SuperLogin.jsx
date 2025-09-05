import { useState } from "react";
import axios from "../axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function SuperLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/super/login`, { email, password });

      if (res.data.ok && res.data.data?.token) {
        localStorage.setItem("superToken", res.data.data.token);
        console.log("✅ Super token saved:", res.data.data.token);
        window.location.href = "/super/dashboard";
      } else {
        setError(res.data.error || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex items-center justify-center h-screen">
      <form
        onSubmit={handleLogin}
        className="card w-full max-w-sm space-y-4 p-6 shadow-lg"
      >
        <h1 className="text-xl font-bold text-center">🔑 Super Admin Login</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input w-full"
        />

        <button
          type="submit"
          className="btn primary w-full"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
