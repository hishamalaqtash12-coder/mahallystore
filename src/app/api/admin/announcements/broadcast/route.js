import { NextResponse } from "next/server";
import { dokanApi } from "@/lib/dokan";
import { persistMessage } from "@/lib/messages";
import { createAnnouncement } from "@/lib/announcements";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, content, sendChat, sendWhatsApp, dokanNotice } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Persist in log first
    const announcement = await createAnnouncement({ title, content, sendChat: true, sendWhatsApp: false, dokanNotice: false });
    const announcementId = announcement.id;
    // Load vendor list (Dokan stores) for broadcast
    const allVendors = await dokanApi.getStores({ per_page: 100 }).catch(() => []);

    const adminId = "admin";
    const results = {
      totalVendors: Array.isArray(allVendors) ? allVendors.length : 0,
      chatsSent: 0,
      whatsAppTriggered: 0
    };

    // 3. Sequential Broadcast (Note: For large numbers, this should be a background job)
    for (const vendor of Array.isArray(allVendors) ? allVendors : []) {
      const vendorId = vendor.id;

      // Local Messaging System (Forced to true for now)
      try {
        await persistMessage({
          fromId: adminId,
          toId: vendorId,
          text: `📢 *OFFICIAL ANNOUNCEMENT*\n\n*${title.toUpperCase()}*\n\n${content}`,
          metadata: { 
            isAnnouncement: true, 
            announcementTitle: title,
            announcementId: announcementId // Crucial for deletion sync
          }
        });
        results.chatsSent++;
      } catch (e) {
        console.error(`Chat broadcast failed for vendor ${vendorId}:`, e.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Broadcast complete to ${results.totalVendors} vendors.`,
      details: results
    });

  } catch (error) {
    console.error("Broadcast API Critical Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
