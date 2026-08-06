import { wcApi } from "@/lib/woocommerce";
import fs from "fs/promises";
import path from "path";

let cachedAdminId = null;
let lastFetchTime = 0;

const SETTINGS_PATH = path.join(process.cwd(), "src/data/settings.json");

/** Call this after saving settings to force getAdminId() to re-read on the next request */
export function resetAdminIdCache() {
  cachedAdminId = null;
  lastFetchTime = 0;
}

/**
 * Dynamically resolves the designated support admin ID.
 * Priority:
 *   1. supportUserId in settings.json (set by admin dashboard — highest priority)
 *   2. SUPPORT_ADMIN_ID env variable (legacy fallback)
 *   3. First WooCommerce user with role=administrator (auto-detect fallback)
 * Uses a 1-minute memory cache to avoid repeated file/API calls.
 */
export async function getAdminId() {
  const now = Date.now();
  if (cachedAdminId && (now - lastFetchTime < 60000)) {
    return cachedAdminId;
  }

  // 1. Check dashboard-assigned support user from settings.json
  try {
    const fileContent = await fs.readFile(SETTINGS_PATH, "utf8");
    const settings = JSON.parse(fileContent);
    if (settings.supportUserId) {
      cachedAdminId = Number(settings.supportUserId);
      lastFetchTime = now;
      return cachedAdminId;
    }
  } catch (e) {
    // settings.json not readable, fall through
  }

  // 2. Legacy: SUPPORT_ADMIN_ID env variable
  if (process.env.SUPPORT_ADMIN_ID) {
    cachedAdminId = parseInt(process.env.SUPPORT_ADMIN_ID, 10);
    lastFetchTime = now;
    return cachedAdminId;
  }

  // 3. Auto-detect: first WooCommerce administrator
  try {
    const adminResponse = await wcApi.get("customers", { role: "administrator", per_page: 1 });
    if (adminResponse.data?.length > 0) {
      cachedAdminId = adminResponse.data[0].id;
      lastFetchTime = now;
      return cachedAdminId;
    }
  } catch (err) {
    console.error("getAdminId fetch error:", err.message);
  }
  return 1; // Fallback
}


/**
 * Shared utility to handle message/notification persistence
 */
export async function persistMessage({ fromId, toId, text, metadata = {} }) {
  const adminId = await getAdminId();

  // Normalize "admin" string or hardcoded ID 1 to the actual, active admin ID
  const normalizedFromId = (fromId === "admin" || String(fromId) === "1") ? adminId : fromId;
  const normalizedToId = (toId === "admin" || String(toId) === "1") ? adminId : toId;

  const newMessage = {
    id: Date.now(),
    senderId: normalizedFromId,
    text: text || "",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    ...metadata
  };

  const updateChatMeta = async (userId, otherId, msg) => {
    try {
      const targetId = (userId === "admin" || String(userId) === "1") ? adminId : userId;
      const res = await wcApi.get(`customers/${targetId}`);
      const user = res.data;
      if (!user.id) return;
      
      const meta = user.meta_data || [];
      
      let chats = {};
      const chatMeta = meta.find(m => m.key === "mahally_chats");
      if (chatMeta) {
        chats = typeof chatMeta.value === 'string' ? JSON.parse(chatMeta.value) : chatMeta.value;
      }

      if (!chats[otherId]) chats[otherId] = [];
      chats[otherId].push(msg);
      if (chats[otherId].length > 50) chats[otherId] = chats[otherId].slice(-50);

      const convMeta = meta.find(m => m.key === "mahally_conversations");
      let conversations = convMeta ? (typeof convMeta.value === 'string' ? JSON.parse(convMeta.value) : convMeta.value) : [];
      if (!Array.isArray(conversations)) conversations = [];
      if (!conversations.includes(Number(otherId))) {
        conversations.push(Number(otherId));
      }

      const updatedMeta = meta.filter(m => m.key !== "mahally_chats" && m.key !== "mahally_conversations");
      updatedMeta.push({ key: "mahally_chats", value: JSON.stringify(chats) });
      updatedMeta.push({ key: "mahally_conversations", value: JSON.stringify(conversations) });

      await wcApi.put(`customers/${targetId}`, { meta_data: updatedMeta });
    } catch (e) {
      console.error(`Error updating chat for ${userId}:`, e.message);
    }
  };

  if (String(normalizedFromId) === String(normalizedToId)) {
    await updateChatMeta(normalizedFromId, normalizedToId, newMessage);
  } else {
    // Update both sides
    await Promise.all([
      updateChatMeta(normalizedFromId, normalizedToId, newMessage),
      updateChatMeta(normalizedToId, normalizedFromId, newMessage)
    ]);
  }

  return newMessage;
}
