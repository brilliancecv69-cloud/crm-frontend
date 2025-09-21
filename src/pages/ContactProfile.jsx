import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import { FaChevronDown } from "react-icons/fa";

import MessageList from "../components/MessageList";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const PIPELINE_STATUS_OPTIONS = [ 'negotiation', "proposal",'won', 'lost'];
const SHIPPING_STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'];

// ✅ --- مكون الأقسام القابلة للطي ---
function AccordionSection({ title, isOpen, onClick, children }) {
    return (
        <div className="card">
            <button
                className="w-full flex justify-between items-center text-left font-bold text-lg p-4 -m-4 mb-0"
                onClick={onClick}
            >
                <span>{title}</span>
                <FaChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] pt-4' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );
}

export default function ContactProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const [editProducts, setEditProducts] = useState(false);
  const [manualAmount, setManualAmount] = useState(false);

  // ✅ --- حالة لتتبع الأقسام المفتوحة ---
  const [openSections, setOpenSections] = useState({
      details: true,
      sales: false,
      shipping: false,
      management: false,
  });

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", notes: "", stage: "",
    pipeline_status: "", amount: 0, probability: 0,
    products: [],
    shippingDetails: {
        company: "",
        trackingNumber: "",
        cost: 0,
        address: { governorate: "", city: "", street: "" },
        status: "pending"
    }
  });

  const [allProducts, setAllProducts] = useState([]);
  const [shippingCompanies, setShippingCompanies] = useState([]);


  const fetchContact = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/contacts/${id}`);
      const data = res.data?.data;
      setContact(data);
      setForm({
        name: data?.name ?? "",
        phone: data?.phone ?? "",
        email: data?.email ?? "",
        address: data?.address ?? "",
        notes: data?.notes ?? "",
        stage: data?.stage ?? "lead",
        pipeline_status: data?.salesData?.pipeline_status ?? "new",
        amount: data?.salesData?.amount ?? 0,
        probability: data?.salesData?.probability ?? 0,
        products: data?.products ?? [],
        shippingDetails: data?.salesData?.shippingDetails ?? {
            company: "", 
            trackingNumber: "", 
            cost: 0,
            address: { 
                governorate: data?.salesData?.shippingDetails?.address?.governorate || "", 
                city: data?.salesData?.shippingDetails?.address?.city || "", 
                street: data?.salesData?.shippingDetails?.address?.street || data?.address || ""
            }, 
            status: "pending"
        }
      });
      setManualAmount(false);
    } catch (err) {
      console.error("Fetch contact error:", err);
      alert("فشل جلب بيانات العميل");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      if (res.data.ok) setAllProducts(res.data.data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  const fetchShippingCompanies = async () => {
    try {
        const res = await axios.get(`${API_BASE}/shipping`);
        if (res.data.ok) setShippingCompanies(res.data.data);
    } catch (err) {
        console.error("Fetch shipping companies error:", err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchContact();
      fetchProducts();
      fetchShippingCompanies();
    }
  }, [id]);

  useEffect(() => {
    if (!manualAmount) {
      const autoAmount = form.products.reduce(
        (sum, p) => sum + (Number(p.price) * Number(p.qty || 1)),
        0
      );
      setForm(prev => ({ ...prev, amount: autoAmount }));
    }
  }, [form.products, manualAmount]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };
  
  const handleShippingChange = (e) => {
      const { name, value } = e.target;
      setForm(prev => ({
          ...prev,
          shippingDetails: { ...prev.shippingDetails, [name]: value }
      }));
  };
  
  const handleShippingAddressChange = (e) => {
      const { name, value } = e.target;
      setForm(prev => ({
          ...prev,
          shippingDetails: {
              ...prev.shippingDetails,
              address: { ...prev.shippingDetails.address, [name]: value }
          }
      }));
  };

  const handleProductChange = (i, key, value) => {
    const updated = [...form.products];
    updated[i][key] = value;
    if (key === "productId") {
      const prod = allProducts.find(p => String(p._id) === String(value));
      if (prod) updated[i].price = prod.price;
    }
    setForm({ ...form, products: updated });
  };

  const addProductLine = () => {
    setForm(prev => ({
      ...prev,
      products: [...prev.products, { productId: "", qty: 1, price: 0 }]
    }));
  };

  const removeProductLine = (i) => {
    setForm(prev => ({
      ...prev,
      products: prev.products.filter((_, idx) => idx !== i)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        email: form.email,
        address: form.address,
        notes: form.notes,
        salesData: {
          pipeline_status: form.pipeline_status,
          amount: form.amount,
          probability: form.probability,
          shippingDetails: form.shippingDetails,
        },
        products: form.products.map(p => ({
          productId: p.productId?._id || p.productId,
          qty: p.qty,
          price: p.price
        }))
      };
      const res = await axios.patch(`${API_BASE}/contacts/${id}`, payload);
      setContact(res.data.data);
      setEditProducts(false);
      alert("تم الحفظ بنجاح ✅");
    } catch (err) {
      console.error("Save error:", err);
      alert("فشل الحفظ: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (newStage) => {
    if (!newStage || newStage === contact?.stage) return;
    if (!window.confirm(`هل أنت متأكد من تحويل هذا العميل إلى مرحلة "${newStage}"؟`)) return;
    setBusy(true);
    try {
      const res = await axios.patch(`${API_BASE}/contacts/${id}/stage`, { stage: newStage });
      setContact(res.data.data);
      setForm(prev => ({ ...prev, stage: res.data.data.stage }));
      alert(`تم التحويل بنجاح إلى ${newStage}!`);
    } catch (err) {
      console.error("Stage change error:", err);
      alert("فشل تغيير المرحلة: " + (err.response?.data?.error || err.message));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("هل أنت متأكد من حذف هذا العميل نهائيًا؟")) return;
    setBusy(true);
    try {
      await axios.delete(`${API_BASE}/contacts/${id}`);
      alert("تم الحذف بنجاح.");
      navigate("/leads");
    } catch (err) {
      console.error("Delete error:", err);
      alert("فشل الحذف: " + (err.response?.data?.error || err.message));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page">Loading profile...</div>;
  if (!contact) return <div className="page">Contact not found.</div>;

  const toggleSection = (section) => {
      setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{contact.name || contact.phone}</h1>
          <p className="text-sm text-gray-600">
            {contact.phone} {contact.email && `• ${contact.email}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge" data-stage={contact.stage}>
            {contact.stage.toUpperCase()}
          </div>
          {contact.assignedTo && (
            <div className="badge blue">
              Assigned: {contact.assignedTo.name}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Accordions */}
        <div className="md:col-span-2 space-y-4">
            <AccordionSection title="Contact Details" isOpen={openSections.details} onClick={() => toggleSection('details')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field"><span>Name</span><input name="name" value={form.name} onChange={handleChange} className="input" /></div>
                    <div className="field"><span>Phone</span><input name="phone" value={form.phone} disabled className="input bg-gray-100" /></div>
                    <div className="field"><span>Email</span><input name="email" value={form.email} onChange={handleChange} className="input" /></div>
                    <div className="field"><span>Address</span><input name="address" value={form.address} onChange={handleChange} className="input" /></div>
                    <div className="field sm:col-span-2"><span>Notes</span><textarea name="notes" value={form.notes} onChange={handleChange} className="input" rows="4" /></div>
                </div>
            </AccordionSection>

            {contact.stage === "sales" && (
                <>
                    <AccordionSection title="Sales Deal" isOpen={openSections.sales} onClick={() => toggleSection('sales')}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="field">
                                <span>Pipeline Status</span>
                                <select name="pipeline_status" value={form.pipeline_status} onChange={handleChange} className="input">
                                    {PIPELINE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <span>Amount (EGP)</span>
                                <input type="number" name="amount" value={form.amount} onChange={(e) => { setManualAmount(true); handleChange(e); }} className="input" />
                            </div>
                            <div className="field">
                                <span>Probability (%)</span>
                                <input type="number" name="probability" value={form.probability} min={0} max={100} onChange={handleChange} className="input" />
                            </div>
                        </div>
                        <h4 className="font-semibold mb-2">Products in Deal</h4>
                        <table className="table">
                            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th></th></tr></thead>
                            <tbody>
                            {form.products.map((line, i) => (
                                <tr key={i}>
                                    <td>
                                        {editProducts ? (
                                        <select value={line.productId?._id || line.productId || ""} onChange={(e) => handleProductChange(i, "productId", e.target.value)}>
                                            <option value="">-- Select --</option>
                                            {allProducts.map(p => (<option key={p._id} value={p._id}>{p.name}</option>))}
                                        </select>
                                        ) : ( <span>{line.productId?.name || "--"}</span> )}
                                    </td>
                                    <td>
                                        {editProducts ? (<input type="number" min="1" value={line.qty} onChange={(e) => handleProductChange(i, "qty", Number(e.target.value))} />) : (<span>{line.qty}</span>)}
                                    </td>
                                    <td>
                                        {editProducts ? (<input type="number" value={line.price} onChange={(e) => handleProductChange(i, "price", Number(e.target.value))} />) : (<span>{line.price}</span>)}
                                    </td>
                                    <td>{editProducts && (<button onClick={() => removeProductLine(i)}>✕</button>)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {editProducts && (<button onClick={addProductLine} className="btn mt-2">+ Add Product</button>)}
                        <div className="mt-2">
                            <button onClick={() => setEditProducts(!editProducts)} className="btn ghost">{editProducts ? "Done" : "Edit Products"}</button>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Shipping Details" isOpen={openSections.shipping} onClick={() => toggleSection('shipping')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="field">
                                <span>Shipping Company</span>
                                <select name="company" value={form.shippingDetails.company || ''} onChange={handleShippingChange} className="input">
                                    <option value="">-- Select Company --</option>
                                    {shippingCompanies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <span>Shipping Cost (EGP)</span>
                                <input type="number" name="cost" value={form.shippingDetails.cost} onChange={handleShippingChange} className="input" />
                            </div>
                            <div className="field">
                                <span>Tracking Number</span>
                                <input name="trackingNumber" value={form.shippingDetails.trackingNumber} onChange={handleShippingChange} className="input" />
                            </div>
                            <div className="field">
                                <span>Shipping Status</span>
                                <select name="status" value={form.shippingDetails.status} onChange={handleShippingChange} className="input">
                                    {SHIPPING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <span>Governorate</span>
                                <input name="governorate" value={form.shippingDetails.address.governorate} onChange={handleShippingAddressChange} className="input" />
                            </div>
                            <div className="field">
                                <span>City</span>
                                <input name="city" value={form.shippingDetails.address.city} onChange={handleShippingAddressChange} className="input" />
                            </div>
                            <div className="field sm:col-span-2">
                                <span>Street Address</span>
                                <textarea name="street" value={form.shippingDetails.address.street} onChange={handleShippingAddressChange} className="input" rows={2} />
                            </div>
                        </div>
                    </AccordionSection>
                </>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={handleSave} disabled={saving || busy} className="btn primary">
                    {saving ? "Saving..." : "Save All Changes"}
                </button>
                <button onClick={handleDelete} disabled={busy} className="btn danger">Delete Contact</button>
            </div>
        </div>

        {/* Right Side */}
        <div className="space-y-4">
            <AccordionSection title="Management & History" isOpen={openSections.management} onClick={() => toggleSection('management')}>
                <h3 className="font-bold mb-3">Stage Management</h3>
                <div className="flex flex-col gap-2">
                    {contact.stage === "lead" && <button onClick={() => handleStageChange("customer")} disabled={busy} className="btn primary w-full">Convert to Customer</button>}
                    {contact.stage === "customer" && <button onClick={() => handleStageChange("sales")} disabled={busy} className="btn primary w-full">Move to Sales</button>}
                    {(contact.stage === "customer" || contact.stage === "sales") && <button onClick={() => handleStageChange("lead")} disabled={busy} className="btn ghost w-full mt-2">Revert to Lead</button>}
                </div>
                <h3 className="font-bold mb-3 mt-4">History</h3>
                <ul className="text-sm space-y-1 text-gray-600">
  {contact.stageHistory.slice(-5).reverse().map((h, i) => (
      <li key={i}>
        <strong>{h.to}</strong> ← {h.from} 
        <span className="text-xs">({new Date(h.timestamp).toLocaleDateString()})</span>
      </li>
  ))}
  <li>Created <span className="text-xs">({new Date(contact.createdAt).toLocaleDateString()})</span></li>
</ul>

            </AccordionSection>
        </div>
      </div>

      {/* Chat Section */}
      <div className="mt-6 card">
        <h3 className="text-xl font-bold mb-4">Chat</h3>
        <div className="h-[60vh] max-h-[700px]">
             <MessageList contactId={id} tenantId={contact.tenantId} />
        </div>
      </div>
    </div>
  );
}