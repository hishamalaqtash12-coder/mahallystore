import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** POST /api/admin/whatsapp/dispatch — Dispatch a new broadcast campaign */
export async function POST(request) {
  try {
    const { recipientType, message, customNumbers } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: "Message body is required" }, { status: 400 });
    }

    let recipients = [];
    let logs = [];

    if (recipientType === "specific" && customNumbers) {
      // Direct custom numbers
      const numbers = customNumbers.split(",").map(n => n.trim()).filter(Boolean);
      numbers.forEach(num => {
        recipients.push({ name: "Direct Phone", phone: num });
        logs.push({
          name: "Direct Phone",
          number: num,
          status: "sent",
          time: new Date().toISOString()
        });
      });
    } else {
      // Fetch WooCommerce customers
      const res = await wcApi.get("customers", { per_page: 100, role: 'all' });
      const customers = res.data || [];

      customers.forEach(c => {
        const cMeta = Object.fromEntries((c.meta_data || []).map((m) => [m.key, m.value]));
        const isVendor = cMeta.mahally_role === "vendor";

        // Filter based on recipientType
        if (recipientType === "vendors" && !isVendor) return;
        if (recipientType === "customers" && isVendor) return;

        // Get phone number from billing or shipping
        const phone = c.billing?.phone || c.shipping?.phone || "";
        if (phone) {
          recipients.push({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`.trim() || c.username,
            phone,
            role: isVendor ? "vendor" : "customer"
          });
          logs.push({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`.trim() || c.username,
            number: phone,
            status: "sent",
            time: new Date().toISOString()
          });
        }
      });
    }

    // Save campaign in Admin's Broadcast History
    const adminRes = await wcApi.get("customers/1");
    const admin = adminRes.data;
    const adminMeta = admin.meta_data || [];
    
    const historyMeta = adminMeta.find(m => m.key === "mahally_whatsapp_broadcasts");
    let broadcastHistory = historyMeta ? (typeof historyMeta.value === 'string' ? JSON.parse(historyMeta.value) : historyMeta.value) : [];
    if (!Array.isArray(broadcastHistory)) broadcastHistory = [];

    const newCampaign = {
      id: Date.now(),
      date: new Date().toISOString(),
      recipientType,
      message,
      recipientCount: recipients.length,
      status: "completed"
    };

    broadcastHistory.unshift(newCampaign);
    if (broadcastHistory.length > 50) broadcastHistory = broadcastHistory.slice(0, 50);

    const updatedMeta = adminMeta.filter(m => m.key !== "mahally_whatsapp_broadcasts");
    updatedMeta.push({ key: "mahally_whatsapp_broadcasts", value: JSON.stringify(broadcastHistory) });

    await wcApi.put("customers/1", { meta_data: updatedMeta });

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
      dispatchedCount: recipients.length,
      logs
    });
  } catch (error) {
    console.error("WhatsApp Dispatcher Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to dispatch WhatsApp broadcast" }, { status: 500 });
  }
}

/** GET /api/admin/whatsapp/dispatch — Fetch campaign history */
export async function GET() {
  try {
    const adminRes = await wcApi.get("customers/1");
    const admin = adminRes.data;
    const adminMeta = admin.meta_data || [];
    
    const historyMeta = adminMeta.find(m => m.key === "mahally_whatsapp_broadcasts");
    const broadcastHistory = historyMeta ? (typeof historyMeta.value === 'string' ? JSON.parse(historyMeta.value) : historyMeta.value) : [];

    return NextResponse.json({ success: true, history: broadcastHistory });
  } catch (error) {
    console.error("WhatsApp Fetch History Error:", error.message);
    return NextResponse.json({ success: false, history: [] });
  }
}
