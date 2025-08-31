import { useEffect, useState } from "react";
import axios from "../axios";


const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    notes: ""
  });

  // fetch all expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.get(`${API_BASE}/expenses`);
      if (res.data.ok) {
        setExpenses(res.data.data.items);
      } else {
        setErrorMsg(res.data.error || "Error fetching expenses");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // handle form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // submit new expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/expenses`, form);
      if (res.data.ok) {
        setForm({ title: "", amount: "", category: "", date: "", notes: "" });
        fetchExpenses();
      } else {
        alert(res.data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // delete expense
  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await axios.delete(`${API_BASE}/expenses/${id}`);
      if (res.data.ok) {
        fetchExpenses();
      } else {
        alert(res.data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Expenses</h2>

      {/* add new expense form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-6">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="notes"
          placeholder="Notes"
          value={form.notes}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded col-span-1 sm:col-span-5">
          Add Expense
        </button>
      </form>

      {/* error */}
      {errorMsg && <div className="text-red-500 mb-4">{errorMsg}</div>}

      {/* loading */}
      {loading && <div>Loading...</div>}

      {/* expenses table */}
      {!loading && (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Notes</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp._id}>
                <td className="p-2 border">{exp.title}</td>
                <td className="p-2 border">{exp.amount}</td>
                <td className="p-2 border">{exp.category}</td>
                <td className="p-2 border">
                  {exp.date ? new Date(exp.date).toLocaleDateString() : ""}
                </td>
                <td className="p-2 border">{exp.notes}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleDelete(exp._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
