import { wcApi, updateCustomerMeta, getCustomerById } from "@/lib/woocommerce";
import { persistMessage, getAdminId } from "@/lib/messages";
import { dokanApi } from "@/lib/dokan";

const META_KEY = "mahally_announcements_log";

/**
 * Fetch all announcements from the global log
 */
export async function getAnnouncements() {
  try {
    const adminId = await getAdminId();
    const admin = await getCustomerById(adminId);
    const logMeta = admin?.meta_data?.find(m => m.key === META_KEY);
    let announcements = logMeta ? (typeof logMeta.value === 'string' ? JSON.parse(logMeta.value) : logMeta.value) : [];
    
    // BACKFILL: ONLY run if log is totally missing (never initialized)
    if (!logMeta && admin?.meta_data) {
      const chatMeta = admin.meta_data.find(m => m.key === "mahally_chats");
      if (chatMeta) {
        const chats = typeof chatMeta.value === 'string' ? JSON.parse(chatMeta.value) : chatMeta.value;
        const extracted = [];
        
        // Announcements are broadcast to multiple users, so we find unique ones by text/title
        const seen = new Set();
        Object.values(chats).forEach(messages => {
          messages.forEach(msg => {
            if (msg.isAnnouncement && !seen.has(msg.text)) {
              seen.add(msg.text);
              extracted.push({
                id: msg.id || Date.now(),
                title: msg.announcementTitle || "Past Announcement",
                content: msg.text.replace(/📢 \*OFFICIAL ANNOUNCEMENT\*\n\n\*[^*]+\*\n\n/, ""), // Clean up the chat prefix
                channels: { sendChat: true, sendWhatsApp: false, dokanNotice: false },
                status: 'sent',
                senderId: "admin",
                isLegacy: true,
                createdAt: new Date(msg.timestamp || Date.now()).toISOString(),
                editedAt: null,
                stats: { vendorsReached: 'Legacy' }
              });
            }
          });
        });
        
        if (extracted.length > 0) {
          announcements = extracted.sort((a, b) => b.id - a.id);
          // Initialize the log with backfilled items so we don't scan again
          await updateCustomerMeta(adminId, { [META_KEY]: JSON.stringify(announcements) });
        } else {
          // Initialize an empty log so we don't scan again
          await updateCustomerMeta(adminId, { [META_KEY]: JSON.stringify([]) });
        }
      }
    }

    return Array.isArray(announcements) ? announcements : [];
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
}

/**
 * Add a new announcement to the log and trigger broadcast
 */
export async function createAnnouncement({ title, content, sendChat, sendWhatsApp, dokanNotice }) {
  const now = new Date().toISOString();
  const newAnnouncement = {
    id: Date.now(),
    title,
    content,
    channels: { sendChat, sendWhatsApp, dokanNotice },
    status: 'sent',
    createdAt: now,
    editedAt: null,
    events: [
      { type: 'created', timestamp: now, description: 'Announcement dispatched via Local Chat' }
    ],
    stats: { vendorsReached: 0 }
  };

  const adminId = await getAdminId();
  const currentLog = await getAnnouncements();
  const updatedLog = [newAnnouncement, ...currentLog];

  await updateCustomerMeta(adminId, { [META_KEY]: JSON.stringify(updatedLog) });
  
  return newAnnouncement;
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(id, updates) {
  const currentLog = await getAnnouncements();
  const idx = currentLog.findIndex(a => String(a.id) === String(id));
  
  if (idx === -1) throw new Error(`Announcement with ID ${id} not found`);

  const now = new Date().toISOString();
  const updatedLog = [...currentLog];
  const oldItem = updatedLog[idx];
  
  // Ensure events array exists
  const events = Array.isArray(oldItem.events) ? [...oldItem.events] : [];

  // Log specific changes
  if (updates.title && updates.title !== oldItem.title) {
    events.push({ 
      type: 'edited', 
      timestamp: now, 
      description: 'Title changed',
      from: oldItem.title,
      to: updates.title
    });
  }

  if (updates.content && updates.content !== oldItem.content) {
    events.push({ 
      type: 'edited', 
      timestamp: now, 
      description: 'Content changed',
      from: oldItem.content,
      to: updates.content
    });
  }

  // If generic update with no specific field change detect (shouldn't happen with current UI)
  if (events.length === (Array.isArray(oldItem.events) ? oldItem.events.length : 0)) {
    events.push({ type: 'edited', timestamp: now, description: 'Announcement metadata updated' });
  }

  updatedLog[idx] = {
    ...oldItem,
    ...updates,
    editedAt: now,
    events: events
  };

  const adminId = await getAdminId();
  await updateCustomerMeta(adminId, { [META_KEY]: JSON.stringify(updatedLog) });
  return updatedLog[idx];
}

/**
 * Delete an announcement and remove it from all vendor chats
 */
export async function deleteAnnouncement(id) {
  const adminId = await getAdminId();
  const currentLog = await getAnnouncements();
  const updatedLog = currentLog.filter(a => a.id !== id);
  
  // 1. Update the official log
  await updateCustomerMeta(adminId, { [META_KEY]: JSON.stringify(updatedLog) });

  // 2. Deep Cleanup: Remove the message from all vendor chats
  // This is expensive but necessary for full deletion
  try {
    const stores = await dokanApi.getStores({ per_page: 100 }); // Get recent vendors
    if (!stores || !Array.isArray(stores)) return;

    for (const vendor of stores) {
      try {
        const vendorData = await getCustomerById(vendor.id);
        const meta = vendorData?.meta_data || [];
        const chatMeta = meta.find(m => m.key === "mahally_chats");
        
        if (chatMeta) {
          let chats = typeof chatMeta.value === 'string' ? JSON.parse(chatMeta.value) : chatMeta.value;
          let changed = false;

          // Check the 'admin' thread in this vendor's chats
          if (chats["admin"]) {
            const originalLength = chats["admin"].length;
            chats["admin"] = chats["admin"].filter(msg => msg.announcementId !== id && msg.id !== id);
            if (chats["admin"].length !== originalLength) changed = true;
          }
          const adminKeyStr = String(adminId);
          if (chats[adminKeyStr]) {
            const originalLength = chats[adminKeyStr].length;
            chats[adminKeyStr] = chats[adminKeyStr].filter(msg => msg.announcementId !== id && msg.id !== id);
            if (chats[adminKeyStr].length !== originalLength) changed = true;
          }

          if (changed) {
            const updatedMeta = meta.filter(m => m.key !== "mahally_chats");
            updatedMeta.push({ key: "mahally_chats", value: JSON.stringify(chats) });
            await wcApi.put(`customers/${vendor.id}`, { meta_data: updatedMeta });
          }
        }
      } catch (e) {
        console.error(`Failed to clean chat for vendor ${vendor.id}:`, e.message);
      }
    }

    // Also clean the Admin side
    const adminData = await getCustomerById(adminId);
    const adminMeta = adminData?.meta_data || [];
    const adminChatMeta = adminMeta.find(m => m.key === "mahally_chats");
    if (adminChatMeta) {
      let chats = typeof adminChatMeta.value === 'string' ? JSON.parse(adminChatMeta.value) : adminChatMeta.value;
      let changed = false;
      Object.keys(chats).forEach(otherId => {
        const originalLength = chats[otherId].length;
        chats[otherId] = chats[otherId].filter(msg => msg.announcementId !== id && msg.id !== id);
        if (chats[otherId].length !== originalLength) changed = true;
      });
      if (changed) {
         const updatedMeta = adminMeta.filter(m => m.key !== "mahally_chats");
         updatedMeta.push({ key: "mahally_chats", value: JSON.stringify(chats) });
         await wcApi.put(`customers/${adminId}`, { meta_data: updatedMeta });
      }
    }

  } catch (err) {
    console.error("Critical error during announcement deep cleanup:", err.message);
  }
}
