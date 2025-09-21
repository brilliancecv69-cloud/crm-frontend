import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";
import AddProduct from "./AddProduct";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${API_BASE}/products`, {
        params: q ? { q } : {}
      });
      if (data.ok) setProducts(data.data);
      else setError(data.error || "Error fetching products");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getStockClass = (p) => {
    if (p.stockQty <= 0) return "bg-red-100 text-red-700";
    if (p.stockQty <= p.minQty) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_BASE}/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete product.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Products Inventory</h1>

      {/* Search & Add */}
      <div className="flex mb-4 gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or SKU..."
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={fetchProducts}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Search
        </button>
        <button
          onClick={() => {
            setEditProduct(null);
            setShowAdd(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Product
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded shadow bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-center">Stock</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Updated</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link
                    to={`/products/${p._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{p.sku}</td>
                <td className="px-4 py-2">{p.category || "-"}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-sm ${getStockClass(p)}`}>
                    {p.stockQty}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">{p.price} EGP</td>
                <td className="px-4 py-2 text-right">
                  {new Date(p.updatedAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => {
                      setEditProduct(p);
                      setShowAdd(true);
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddProduct
          product={editProduct}
          onClose={() => {
            setShowAdd(false);
            setEditProduct(null);
          }}
          onAdded={fetchProducts}
        />
      )}
    </div>
  );
}
