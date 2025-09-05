import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";
import { debounce } from 'lodash';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper function to format date to YYYY-MM-DD for input fields
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

export default function Customers() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  const fetchCustomers = useMemo(
    () =>
      debounce(async (searchQuery, dates) => {
        try {
          setLoading(true);
          setErrorMsg("");
          const params = {
            stage: 'customer',
            q: searchQuery,
            isArchived: false,
            from: dates.from || undefined,
            to: dates.to || undefined,
          };
          const res = await axios.get(`${API_BASE}/contacts`, { params });
          const data = res.data?.data?.items ?? [];
          setContacts(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("❌ Error fetching customers:", err);
          const msg = err.response?.data?.error || err.message || "Unknown error";
          setErrorMsg(msg);
          setContacts([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    fetchCustomers(search, dateFilter);
  }, [search, dateFilter, fetchCustomers]);

  const setToday = () => {
    const today = formatDate(new Date());
    setDateFilter({ from: today, to: today });
  };

  const setThisMonth = () => {
      const today = new Date();
      const firstDay = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
      const currentDay = formatDate(today);
      setDateFilter({ from: firstDay, to: currentDay });
  };

  const hasRows = contacts && contacts.length > 0;

  const badgeClass = (stage) => {
    const s = String(stage || "").toLowerCase();
    if (s === "sales") return "bg-purple-100 text-purple-800";
    if (s === "customer") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="page">
      <div className="head">
          <h2>Customers</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 card">
          <div className="field md:col-span-4">
              <span>Search by Name, Phone, Email...</span>
              <input
                  type="text"
                  placeholder="Search all customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
              />
          </div>
          <div className="field">
              <span>From Date</span>
              <input type="date" value={dateFilter.from} onChange={e => setDateFilter(prev => ({ ...prev, from: e.target.value }))} className="input" />
          </div>
          <div className="field">
              <span>To Date</span>
              <input type="date" value={dateFilter.to} onChange={e => setDateFilter(prev => ({ ...prev, to: e.target.value }))} className="input" />
          </div>
          <div className="field md:col-span-2 flex items-end gap-2">
              <button onClick={setToday} className="btn w-full">Today</button>
              <button onClick={setThisMonth} className="btn w-full">This Month</button>
          </div>
      </div>
      
      {errorMsg && <div className="text-sm text-red-600 mt-2">{errorMsg}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Stage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
                 <tr><td colSpan={5} className="text-center p-6 text-gray-500">Loading customers...</td></tr>
            )}
            {!loading && !hasRows && (
              <tr>
                <td colSpan={5} className="text-center p-6 text-gray-500">
                   No customers found for the selected period.
                </td>
              </tr>
            )}
            {hasRows && contacts.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="border-b p-2">{c.name || "-"}</td>
                <td className="border-b p-2">{c.phone || "-"}</td>
                <td className="border-b p-2">{c.email || "-"}</td>
                <td className="border-b p-2">
                  <span className={`badge ${badgeClass(c.stage)}`}>
                    {(c.stage || "customer").toUpperCase()}
                  </span>
                </td>
                <td className="border-b p-2">
                  <Link
                    to={`/contacts/${c._id}`}
                    className="btn"
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}