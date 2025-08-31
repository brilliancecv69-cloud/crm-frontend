import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ProductProfile() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products/${id}`);
      if (res.data.ok) {
        setProduct(res.data.data);
      } else {
        setError(res.data.error || "Error fetching product");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/contacts`, {
        params: { stage: "sales", q: "" }
      });
      if (res.data.ok) {
        // نرشّح العملاء اللي في products عندهم هذا الـproductId
        const items = res.data.data.items.filter(c =>
        Array.isArray(c.products) && c.products.some(p => String(p.productId?._id || p.productId) === String(id))
        );

        setBuyers(items);
      }
    } catch (err) {
      console.error("Fetch buyers error:", err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchBuyers();
    }
  }, [id]);

  if (loading) return <div className="p-6">Loading product...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!product) return <div className="p-6">Product not found</div>;

  return (
    <div className="p-6">
      <Link to="/products" className="text-blue-600 hover:underline">
        ← Back to Products
      </Link>

      <h1 className="text-2xl font-bold mt-2">{product.name}</h1>
      <p className="text-gray-500">SKU: {product.sku}</p>

      <div className="mt-4 grid grid-cols-2 gap-4 bg-white p-4 rounded shadow">
        <div>
          <p className="font-semibold">Category:</p>
          <p>{product.category || "-"}</p>
        </div>
        <div>
          <p className="font-semibold">Price:</p>
          <p>{product.price} EGP</p>
        </div>
        <div>
          <p className="font-semibold">Stock:</p>
          <p>{product.stockQty}</p>
        </div>
        <div>
          <p className="font-semibold">Min Qty:</p>
          <p>{product.minQty}</p>
        </div>
        <div className="col-span-2">
          <p className="font-semibold">Notes:</p>
          <p>{product.notes || "—"}</p>
        </div>
      </div>

      <p className="mt-4 text-gray-500">
        Last updated: {new Date(product.updatedAt).toLocaleString()}
      </p>

      {/* المشترين */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Customers who bought this product</h2>
        {buyers.length === 0 ? (
          <p className="text-gray-500">No sales yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Deal Amount</th>
                <th>Pipeline Status</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((c) => (
                <tr key={c._id}>
                  <td>{c.name || "-"}</td>
                  <td>{c.phone}</td>
                  <td>{c.salesData?.amount}</td>
                  <td>{c.salesData?.pipeline_status}</td>
                  <td>
                    <Link to={`/contacts/${c._id}`} className="btn">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
