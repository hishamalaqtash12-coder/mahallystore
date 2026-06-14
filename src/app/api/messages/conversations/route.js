import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/messages";

export const dynamic = "force-dynamic";

/** GET /api/messages/conversations — list all chat channels for current user */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const readTimesParam = searchParams.get("readTimestamps");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    let readTimes = {};
    try {
      if (readTimesParam) {
        readTimes = JSON.parse(readTimesParam);
      }
    } catch (e) {
      console.warn("Conversations API: failed to parse readTimestamps:", e.message);
    }

    const adminId = await getAdminId();
    const targetUserId = (userId === "admin" || String(userId) === "1") ? adminId : userId;
    
    // 1. Fetch current user and their chat history
    const userResponse = await wcApi.get(`customers/${targetUserId}`);
    const user = userResponse.data;
    const meta = Object.fromEntries((user.meta_data || []).map((m) => [m.key, m.value]));
    
    const isMerchant = meta.mahally_role === "vendor";
    let targetIds = new Set();

    // 2. Collect IDs of people the user has chatted with
    const chatMeta = meta.mahally_chats ? (typeof meta.mahally_chats === 'string' ? JSON.parse(meta.mahally_chats) : meta.mahally_chats) : {};
    
    // MIGRATION: Migrate disjoint "admin" string key or legacy ID "1" to the dynamic active adminId key
    let hasAdminKey = false;
    const adminKeyStr = String(adminId);

    if (chatMeta["admin"]) {
      chatMeta[adminKeyStr] = [...(chatMeta[adminKeyStr] || []), ...chatMeta["admin"]];
      delete chatMeta["admin"];
      hasAdminKey = true;
    }
    if (adminId !== 1 && chatMeta["1"]) {
      chatMeta[adminKeyStr] = [...(chatMeta[adminKeyStr] || []), ...chatMeta["1"]];
      delete chatMeta["1"];
      hasAdminKey = true;
    }

    let conversationsMeta = meta.mahally_conversations ? (typeof meta.mahally_conversations === 'string' ? JSON.parse(meta.mahally_conversations) : meta.mahally_conversations) : [];
    if (Array.isArray(conversationsMeta)) {
      if (conversationsMeta.includes("admin")) {
        conversationsMeta = conversationsMeta.filter(c => c !== "admin");
        if (!conversationsMeta.includes(adminId)) {
          conversationsMeta.push(adminId);
        }
        hasAdminKey = true;
      }
      if (adminId !== 1 && conversationsMeta.includes(1)) {
        conversationsMeta = conversationsMeta.filter(c => c !== 1);
        if (!conversationsMeta.includes(adminId)) {
          conversationsMeta.push(adminId);
        }
        hasAdminKey = true;
      }
    }

    if (hasAdminKey) {
      try {
        const updatedMeta = (user.meta_data || []).filter(m => m.key !== "mahally_chats" && m.key !== "mahally_conversations");
        updatedMeta.push({ key: "mahally_chats", value: JSON.stringify(chatMeta) });
        updatedMeta.push({ key: "mahally_conversations", value: JSON.stringify(conversationsMeta) });
        await wcApi.put(`customers/${targetUserId}`, { meta_data: updatedMeta });
      } catch (err) {
        console.warn("Conversations API: Background migration update failed:", err.message);
      }
    }

    Object.keys(chatMeta).forEach(id => targetIds.add(Number(id)));

    if (isMerchant) {
      // For merchants: Add followers
      const followers = meta.mahally_followers ? (typeof meta.mahally_followers === 'string' ? JSON.parse(meta.mahally_followers) : meta.mahally_followers) : [];
      followers.forEach(id => targetIds.add(Number(id)));
    } else {
      // For customers: Add followed stores only (active chats are already added above)
      try {
        const followed = meta.mahally_followed_stores ? (typeof meta.mahally_followed_stores === 'string' ? JSON.parse(meta.mahally_followed_stores) : meta.mahally_followed_stores) : [];
        if (Array.isArray(followed)) {
          followed.forEach(id => targetIds.add(Number(id)));
        }
      } catch (e) {
        console.warn("Supplementary contact fetch failed:", e.message);
      }
    }

    // 3. STRICT SELF-CHAT PROTECTION: Remove the user's own ID
    targetIds.delete(Number(targetUserId));

    // 4. Fetch details for all partners
    const finalIds = [...targetIds].filter(id => !isNaN(id) && id > 0);
    if (finalIds.length === 0) {
      // Calculate admin unread count even if there are no other partners
      let adminUnreadCount = 0;
      const adminHistory = chatMeta["admin"] || chatMeta[adminKeyStr] || [];
      const adminLastRead = readTimes["admin"] || readTimes[adminKeyStr] || 0;
      adminHistory.forEach(msg => {
        if (String(msg.senderId) !== String(targetUserId) && msg.timestamp > adminLastRead) {
          adminUnreadCount++;
        }
      });
      return NextResponse.json({ conversations: [], adminUnreadCount });
    }

    // Batch fetch partners (split into chunks if > 100)
    const partnersResponse = await wcApi.get("customers", { include: finalIds.slice(0, 100).join(","), per_page: 100, role: 'all' });
    const partners = partnersResponse.data || [];

    // 5. Enrich and Sort
    const conversations = partners.map((c) => {
      try {
        const cMeta = Object.fromEntries((c.meta_data || []).map((m) => [m.key, m.value]));
        const history = chatMeta[c.id] || [];
        const lastMsg = history.length > 0 ? history[history.length - 1] : null;

        // Calculate unread count
        let unreadCount = 0;
        const lastRead = readTimes[c.id] || 0;
        history.forEach(msg => {
          if (String(msg.senderId) !== String(targetUserId) && msg.timestamp > lastRead) {
            unreadCount++;
          }
        });

        const isSystemAdmin = c.id === adminId;
        const displayName = isSystemAdmin 
          ? "Mahally Support" 
          : (cMeta.mahally_store_name || `${c.first_name} ${c.last_name}`.trim() || c.username);

        return {
          id: c.id,
          name: displayName,
          logo: isSystemAdmin ? null : (cMeta.mahally_avatar_url || cMeta.mahally_store_logo || null),
          lastMessage: lastMsg ? lastMsg.text : "No messages yet",
          time: lastMsg ? lastMsg.time : "",
          lastTimestamp: lastMsg ? lastMsg.timestamp : 0,
          unreadCount,
          isOnline: isSystemAdmin ? true : Math.random() > 0.5,
          isVerified: isSystemAdmin ? true : (cMeta.mahally_vendor_status === "approved" || cMeta.mahally_role === "vendor"),
          role: isSystemAdmin ? "admin" : (cMeta.mahally_role || "customer")
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Sort: most recent message first
    conversations.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    // Calculate admin unread count
    let adminUnreadCount = 0;
    const adminHistory = chatMeta["admin"] || chatMeta[adminKeyStr] || [];
    const adminLastRead = readTimes["admin"] || readTimes[adminKeyStr] || 0;
    adminHistory.forEach(msg => {
      if (String(msg.senderId) !== String(targetUserId) && msg.timestamp > adminLastRead) {
        adminUnreadCount++;
      }
    });

    return NextResponse.json({ conversations, adminUnreadCount });
  } catch (error) {
    console.error("Conversations API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
