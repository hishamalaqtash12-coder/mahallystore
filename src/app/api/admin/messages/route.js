import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/messages";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/messages
 * Returns all conversations across all users in the system, flattened.
 * Each conversation thread is returned as: { userA, userB, messages[] }
 * Admin-only endpoint.
 */
export async function GET(request) {
  try {
    const adminId = await getAdminId();

    // Fetch all customers (paginated)
    let allUsers = [];
    let page = 1;
    while (true) {
      const res = await wcApi.get("customers", { per_page: 100, page, role: "all" });
      const batch = res.data || [];
      if (batch.length === 0) break;
      allUsers = [...allUsers, ...batch];
      if (batch.length < 100) break;
      page++;
    }

    // Build a user map for quick lookup
    const userMap = {};
    allUsers.forEach(u => {
      const meta = Object.fromEntries((u.meta_data || []).map(m => [m.key, m.value]));
      userMap[u.id] = {
        id: u.id,
        name: meta.mahally_store_name || `${u.first_name} ${u.last_name}`.trim() || u.username || u.email,
        email: u.email,
        role: meta.mahally_role || "customer",
        avatar: meta.mahally_avatar_url || meta.mahally_store_logo || null,
        isAdmin: u.id === adminId,
      };
    });

    // Collect all unique conversation threads
    const threadMap = new Map(); // key: "minId_maxId" => { userA, userB, messages }

    for (const u of allUsers) {
      const meta = Object.fromEntries((u.meta_data || []).map(m => [m.key, m.value]));
      if (!meta.mahally_chats) continue;

      let chats = {};
      try {
        chats = typeof meta.mahally_chats === "string" ? JSON.parse(meta.mahally_chats) : meta.mahally_chats;
      } catch { continue; }

      for (const [partnerId, messages] of Object.entries(chats)) {
        if (!Array.isArray(messages) || messages.length === 0) continue;

        const idA = u.id;
        const idB = String(partnerId) === "admin" ? adminId : Number(partnerId);

        // Deduplicate using a canonical key (lower id first)
        const key = `${Math.min(idA, idB)}_${Math.max(idA, idB)}`;
        if (!threadMap.has(key)) {
          const userAInfo = userMap[idA] || { id: idA, name: `User #${idA}`, email: "", role: "customer", avatar: null };
          const userBInfo = userMap[idB] || { id: idB, name: idB === adminId ? "Mahally Support" : `User #${idB}`, email: "", role: idB === adminId ? "admin" : "customer", avatar: null };
          threadMap.set(key, {
            id: key,
            userA: userAInfo,
            userB: userBInfo,
            messages,
            lastTimestamp: messages[messages.length - 1]?.timestamp || 0,
          });
        } else {
          // Merge messages from both sides (deduplicate by message id)
          const existing = threadMap.get(key);
          const existingIds = new Set(existing.messages.map(m => String(m.id)));
          const merged = [...existing.messages];
          messages.forEach(m => {
            if (!existingIds.has(String(m.id))) {
              merged.push(m);
            }
          });
          // Sort by timestamp
          merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          existing.messages = merged;
          existing.lastTimestamp = merged[merged.length - 1]?.timestamp || 0;
          threadMap.set(key, existing);
        }
      }
    }

    const threads = Array.from(threadMap.values())
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    return NextResponse.json({ threads, users: userMap });
  } catch (error) {
    console.error("Admin messages fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
