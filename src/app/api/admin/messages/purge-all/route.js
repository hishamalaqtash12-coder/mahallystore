import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/messages/purge-all
 * Permanently clears all chat history from every user's meta.
 * Admin-only — should only be called from the admin dashboard.
 */
export async function DELETE(request) {
  try {
    // Fetch all customers paginated
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

    let cleared = 0;
    let errors = 0;

    // Process in parallel batches of 10 to avoid overwhelming the server
    const BATCH_SIZE = 10;
    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      const batch = allUsers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (u) => {
          const meta = u.meta_data || [];
          const hasChatMeta = meta.some(m => m.key === "mahally_chats" || m.key === "mahally_conversations");
          if (!hasChatMeta) return;

          try {
            const updatedMeta = meta.map(m => {
              if (m.key === "mahally_chats") return { key: "mahally_chats", value: "{}" };
              if (m.key === "mahally_conversations") return { key: "mahally_conversations", value: "[]" };
              return m;
            });
            await wcApi.put(`customers/${u.id}`, { meta_data: updatedMeta });
            cleared++;
          } catch (e) {
            console.warn(`Failed to clear chats for user ${u.id}:`, e.message);
            errors++;
          }
        })
      );
    }

    return NextResponse.json({ 
      success: true, 
      cleared, 
      errors,
      message: `Cleared chat history for ${cleared} users (${errors} errors).`
    });
  } catch (error) {
    console.error("Purge all messages error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
