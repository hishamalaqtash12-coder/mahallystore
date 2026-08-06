import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/messages";

export const dynamic = "force-dynamic";

/** GET /api/messages — Fetch chat history between two users */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const otherId = searchParams.get("otherId");

    if (!userId || !otherId) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    const adminId = await getAdminId();
    const targetUserId = (userId === "admin" || String(userId) === "1") ? adminId : userId;
    const targetOtherId = (otherId === "admin" || String(otherId) === "1") ? String(adminId) : otherId;
    const res = await wcApi.get(`customers/${targetUserId}`);
    const user = res.data;
    const chatMeta = (user.meta_data || []).find(m => m.key === "mahally_chats");
    
    if (!chatMeta) {
      return NextResponse.json({ messages: [] });
    }

    const chats = typeof chatMeta.value === 'string' ? JSON.parse(chatMeta.value) : chatMeta.value;
    
    // Migration logic to merge disjoint "admin" key to adminId key
    let hasAdminKey = false;
    if (chats["admin"]) {
      chats[String(adminId)] = [...(chats[String(adminId)] || []), ...chats["admin"]];
      delete chats["admin"];
      hasAdminKey = true;
    }

    if (hasAdminKey) {
      try {
        const meta = user.meta_data || [];
        const updatedMeta = meta.filter(m => m.key !== "mahally_chats");
        updatedMeta.push({ key: "mahally_chats", value: JSON.stringify(chats) });
        await wcApi.put(`customers/${targetUserId}`, { meta_data: updatedMeta });
      } catch (err) {
        console.warn("Messages API: Background migration update failed:", err.message);
      }
    }

    const history = chats[targetOtherId] || [];

    return NextResponse.json({ messages: history });
  } catch (error) {
    console.error("Fetch Messages API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
