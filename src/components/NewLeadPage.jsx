import { useState } from "react";
import axios from "../axios";

import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function NewLeadPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ========== Handlers ==========
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/contacts`, { ...form });

      if (res.data?.ok) {
        navigate(`/contacts/${res.data.data._id}`);
      } else {
        setError(res.data?.error || "Unexpected error occurred");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Server error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/contacts/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.ok) {
        alert(res.data.data); // رسالة نجاح
        navigate("/leads");   // رجوع لقائمة الليدز
      } else {
        setError(res.data?.error || "Import failed");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Server error";
      setError(msg);
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  // ========== UI ==========
  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Add New Lead</h2>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      {/* Manual form */}
      <form onSubmit={handleSubmit} className="grid gap-3 mb-6">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          value={form.notes}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Saving..." : "Save Lead"}
        </button>
      </form>

      {/* Excel Import */}
      <div className="border-t pt-4">
        <h3 className="font-bold mb-2">Or Import Leads from Excel</h3>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block"
        />
        {uploading && <div className="text-gray-500 mt-2">Uploading...</div>}
      </div>
    </div>
  );
}
