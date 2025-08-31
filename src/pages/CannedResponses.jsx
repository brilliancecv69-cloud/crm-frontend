import { useEffect, useState } from "react";
import axios from "../axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function CannedResponsesPage() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({ id: null, title: "", text: "" });
  const [isEditing, setIsEditing] = useState(false);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/canned-responses`);
      setResponses(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ id: null, title: "", text: "" });
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, title, text } = form;
    if (!title.trim() || !text.trim()) {
      alert("Title and text are required.");
      return;
    }

    try {
      if (isEditing) {
        // Update existing response
        await axios.patch(`${API_BASE}/canned-responses/${id}`, { title, text });
      } else {
        // Create new response
        await axios.post(`${API_BASE}/canned-responses`, { title, text });
      }
      resetForm();
      fetchResponses(); // Refresh the list
    } catch (err) {
      alert("Error saving response: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (response) => {
    setIsEditing(true);
    setForm({ id: response._id, title: response.title, text: response.text });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this response?")) {
      try {
        await axios.delete(`${API_BASE}/canned-responses/${id}`);
        fetchResponses(); // Refresh the list
      } catch (err) {
        alert("Error deleting response: " + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="page">
      <div className="head">
        <h2>Manage Canned Responses</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="card p-4 space-y-4">
            <h3 className="font-bold text-lg">{isEditing ? "Edit Response" : "Add New Response"}</h3>
            <div className="field">
              <span>Title</span>
              <input name="title" value={form.title} onChange={handleChange} className="input" placeholder="e.g., Welcome Message" />
            </div>
            <div className="field">
              <span>Response Text</span>
              <textarea name="text" value={form.text} onChange={handleChange} className="input" rows="5" placeholder="Hello! How can I help you today?"></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn primary">{isEditing ? "Update" : "Save"}</button>
              {isEditing && <button type="button" onClick={resetForm} className="btn">Cancel</button>}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="md:col-span-2">
          {loading && <p>Loading responses...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <div className="space-y-3">
            {responses.map(res => (
              <div key={res._id} className="card p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{res.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{res.text}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <button onClick={() => handleEdit(res)} className="btn sm">Edit</button>
                    <button onClick={() => handleDelete(res._id)} className="btn sm danger">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}