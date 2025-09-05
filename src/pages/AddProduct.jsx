import { useState } from "react";
import axios from "../axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function AddProduct({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stockQty: "",
    minQty: "",
    notes: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API_BASE}/products`, form);
      if (data.ok) {
        onAdded();
        onClose();
      } else {
        setError(data.error || "Failed to add product");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add Product</h2>

        {error && <p className="text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            className="border p-2 rounded col-span-2"
          />
          <input
            name="sku"
            placeholder="SKU"
            value={form.sku}
            onChange={handleChange}
            required
            className="border p-2 rounded col-span-2"
          />
          <input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          />
          <input
            name="price"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            required
            className="border p-2 rounded"
          />
          <input
            name="stockQty"
            type="number"
            placeholder="Stock Qty"
            value={form.stockQty}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="minQty"
            type="number"
            placeholder="Min Qty"
            value={form.minQty}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          />
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
