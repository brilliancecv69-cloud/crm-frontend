import { useEffect, useMemo, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";

import "../styles/sales.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const PAGE_SIZE = 10;
const PIPELINE_STATUS_OPTIONS = ["new", "contacted", "qualified", "proposal", "won", "lost"];

// --- Helper Functions ---
function formatMoney(n) {
  if (n == null || isNaN(Number(n))) return "0";
  return new Intl.NumberFormat("en-US").format(Number(n));
}
function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}
const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

const formatDateForInput = (date) => {
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


// --- UI Components ---
function KpiCard({ label, value, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {sub && (
          <span className="kpi-sub" style={{ marginLeft: "8px", fontSize: "0.9em", fontWeight: "500" }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    new: { text: "New", class: "badge gray" },
    contacted: { text: "Contacted", class: "badge blue" },
    qualified: { text: "Qualified", class: "badge indigo" },
    proposal: { text: "Proposal", class: "badge amber" },
    won: { text: "Won", class: "badge green" },
    lost: { text: "Lost", class: "badge red" },
  };
  const meta = map[status] || { text: status, class: "badge gray" };
  const formattedText = meta.text.charAt(0).toUpperCase() + meta.text.slice(1);
  return <span className={meta.class}>{formattedText}</span>;
}

function ShippingStatusBadge({ status }) {
    const map = {
        pending: { text: "Pending", class: "badge gray" },
        processing: { text: "Processing", class: "badge blue" },
        shipped: { text: "Shipped", class: "badge indigo" },
        delivered: { text: "Delivered", class: "badge green" },
        returned: { text: "Returned", class: "badge amber" },
        cancelled: { text: "Cancelled", class: "badge red" },
    };
    const meta = map[status] || { text: status || 'N/A', class: "badge gray" };
    const formattedText = meta.text.charAt(0).toUpperCase() + meta.text.slice(1);
    return <span className={meta.class}>{formattedText}</span>;
}


const TextInput = forwardRef(({ label, ...props }, ref) => (
  <label className="field">
    <span>{label}</span>
    <input ref={ref} {...props} className="input" />
  </label>
));

const Select = ({ label, options, ...props }) => (
  <label className="field">
    <span>{label}</span>
    <select {...props} className="input">
      <option value="">All</option>
      {options.map((op) => (
        <option key={op.value || op} value={op.value || op}>
          {op.label || op.charAt(0).toUpperCase() + op.slice(1)}
        </option>
      ))}
    </select>
  </label>
);

// =============================
// Main Sales Page Component
// =============================
export default function Sales() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const [allProducts, setAllProducts] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    pipeline_status: "",
    productId: "",
    page: 1,
    from: "",
    to: "",
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const debouncedSearchChange = useMemo(
    () =>
      debounce((value) => {
        handleFilterChange("q", value);
      }, 400),
    []
  );

  useEffect(() => {
    axios
      .get(`${BASE_URL}/products`)
      .then((res) => {
        if (res.data.ok) setAllProducts(res.data.data);
      })
      .catch((err) => console.error("Fetch products error:", err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { 
            ...filters, 
            stage: "sales", 
            limit: PAGE_SIZE, 
            sortBy: "createdAt", 
            order: "desc",
            from: filters.from || undefined,
            to: filters.to || undefined,
        };
        const res = await axios.get(`${BASE_URL}/contacts`, { params });
        const data = res.data?.data;
        let items = Array.isArray(data?.items) ? data.items : [];

        if (filters.productId) {
          items = items.filter(
            (c) =>
              Array.isArray(c.products) &&
              c.products.some((p) => String(p.productId?._id || p.productId) === String(filters.productId))
          );
        }

        setDeals(items);
        setTotalCount(data?.total ?? 0);
      } catch (e) {
        const errorMsg = e.response?.data?.error || e.message || "Failed to load deals";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);
  
    const setToday = () => {
        const today = formatDateForInput(new Date());
        setFilters(prev => ({ ...prev, from: today, to: today, page: 1 }));
    };

    const setThisMonth = () => {
        const today = new Date();
        const firstDay = formatDateForInput(new Date(today.getFullYear(), today.getMonth(), 1));
        const currentDay = formatDateForInput(today);
        setFilters(prev => ({ ...prev, from: firstDay, to: currentDay, page: 1 }));
    };

  // KPIs
  const kpis = useMemo(() => {
    const dealsOnPage = Array.isArray(deals) ? deals : [];
    const pipelineValue = dealsOnPage.reduce((sum, deal) => sum + (deal.salesData?.amount || 0), 0);
    const wonDeals = dealsOnPage.filter((d) => d.salesData?.pipeline_status === "won");
    const wonCount = wonDeals.length;
    const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.salesData?.amount || 0), 0);
    const conversionRate = totalCount > 0 ? Math.round((wonDeals.length / totalCount) * 100) : 0;
    const avgDealValue = dealsOnPage.length > 0 ? pipelineValue / dealsOnPage.length : 0;

    const byStatus = {};
    PIPELINE_STATUS_OPTIONS.forEach((status) => {
      const stageDeals = dealsOnPage.filter((d) => d.salesData?.pipeline_status === status);
      byStatus[status] = {
        count: stageDeals.length,
        amount: stageDeals.reduce((sum, deal) => sum + (deal.salesData?.amount || 0), 0),
      };
    });

    return { total: totalCount, pipelineValue, wonCount, wonValue, conversionRate, avgDealValue, byStatus };
  }, [deals, totalCount]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="sales-page">
      <div className="head">
        <h2>Sales Pipeline</h2>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <KpiCard label="Total Deals (Filtered)" value={kpis.total} />
        <KpiCard label="Page Pipeline" value={`$${formatMoney(kpis.pipelineValue)}`} />
        <KpiCard label="Page Won" value={kpis.wonCount} sub={`($${formatMoney(kpis.wonValue)})`} />
        <KpiCard label="Total Conv. Rate" value={`${kpis.conversionRate}%`} />
        <KpiCard label="Page Avg. Deal" value={`$${formatMoney(kpis.avgDealValue)}`} />
      </div>

      <div className="kpis" style={{ marginTop: "1rem" }}>
        {kpis.byStatus &&
          Object.entries(kpis.byStatus).map(([status, data]) => (
            <KpiCard
              key={status}
              label={`${status.charAt(0).toUpperCase() + status.slice(1)} Deals`}
              value={data.count}
              sub={`($${formatMoney(data.amount)})`}
            />
          ))}
      </div>

      {/* Filters */}
      <div className="filters">
        <TextInput label="Search" placeholder="Search by name, phone, etc..." onChange={(e) => debouncedSearchChange(e.target.value)} />
        <Select
          label="Status"
          value={filters.pipeline_status}
          onChange={(e) => handleFilterChange("pipeline_status", e.target.value)}
          options={PIPELINE_STATUS_OPTIONS}
        />
        <Select
          label="Product"
          value={filters.productId}
          onChange={(e) => handleFilterChange("productId", e.target.value)}
          options={allProducts.map((p) => ({ value: p._id, label: p.name }))}
        />
        <div className="field">
            <span>From Date</span>
            <input type="date" value={filters.from} onChange={e => handleFilterChange("from", e.target.value)} className="input" />
        </div>
        <div className="field">
            <span>To Date</span>
            <input type="date" value={filters.to} onChange={e => handleFilterChange("to", e.target.value)} className="input" />
        </div>
        <div className="field flex items-end gap-2">
             <button onClick={setToday} className="btn w-full">Today</button>
             <button onClick={setThisMonth} className="btn w-full">This Month</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Contact Name</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Pipeline Status</th>
              <th>Shipping Status</th>
              <th>Products</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={8} className="center">Loading…</td></tr>
            ) : error ? (
                <tr><td colSpan={8} className="center error">{error}</td></tr>
            ) : deals.length === 0 ? (
                <tr><td colSpan={8} className="center">No deals found for the selected period.</td></tr>
            ) : (
                deals.map((deal) => (
                <tr key={deal._id}>
                    <td>{deal.name || "-"}</td>
                    <td>{deal.phone || "-"}</td>
                    <td>${formatMoney(deal.salesData?.amount)}</td>
                    <td><StatusBadge status={deal.salesData?.pipeline_status} /></td>
                    <td><ShippingStatusBadge status={deal.salesData?.shippingDetails?.status} /></td>
                    <td>
                    {Array.isArray(deal.products) && deal.products.length > 0
                        ? deal.products.map((p, idx) => {
                            let prodName = "";

                            if (p.productId && typeof p.productId === "object") {
                            prodName = p.productId.name;
                            } else {
                            const found = allProducts.find(ap => String(ap._id) === String(p.productId));
                            prodName = found ? found.name : p.productId;
                            }

                            return (
                            <span key={idx} className="badge gray" style={{ marginRight: "4px" }}>
                                {prodName} × {p.qty}
                            </span>
                            );
                        })
                        : "-"}
                    </td>
                    <td>{formatDate(deal.createdAt)}</td>
                    <td><Link to={`/contacts/${deal._id}`} className="btn">View Profile</Link></td>
                </tr>
                ))
            )}
            </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="btn" disabled={filters.page <= 1} onClick={() => handleFilterChange("page", filters.page - 1)}>Prev</button>
        <span>Page {filters.page} of {totalPages}</span>
        <button className="btn" disabled={filters.page >= totalPages} onClick={() => handleFilterChange("page", filters.page + 1)}>Next</button>
      </div>
    </div>
  );
}