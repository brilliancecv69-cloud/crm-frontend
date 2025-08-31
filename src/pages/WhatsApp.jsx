// WhatsApp.jsx
import WhatsAppStatus from "../components/WhatsAppStatus";

export default function WhatsAppPage() {
  const tenantId = localStorage.getItem("tenantId");
  const tenantName = localStorage.getItem("tenantName");

  if (!tenantId) {
    return (
      <div style={{ padding: 20 }}>
        <h2>WhatsApp Dashboard</h2>
        <p>❌ No tenant selected. Please login again.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>WhatsApp Dashboard</h2>
      <WhatsAppStatus tenantId={tenantId} tenantName={tenantName} />
    </div>
  );
}
