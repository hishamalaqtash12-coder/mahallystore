import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

/** POST /api/messages/react — Add or remove a reaction for BOTH sides */
export async function POST(request) {
  try {
    const { userId, otherId, messageId, emoji } = await request.json();

    if (!userId || !otherId || !messageId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");

    // Function to sync reaction for one user
    const syncReactionForUser = async (uId, partnerId) => {
      const targetId = uId === "admin" ? 1 : uId;
      if (isNaN(targetId)) return;
      
      try {
        const res = await wcApi.get(`customers/${targetId}`);
        const user = res.data;
        if (!user) return;

        const meta = user.meta_data || [];
        const chatMetaIdx = meta.findIndex(m => m.key === "mahally_chats");
        if (chatMetaIdx === -1) return;

        let chats = typeof meta[chatMetaIdx].value === 'string' 
          ? JSON.parse(meta[chatMetaIdx].value) 
          : meta[chatMetaIdx].value;

        const history = chats[partnerId] || [];
        const updatedHistory = history.map(msg => {
          if (String(msg.id) === String(messageId)) {
            return {
              ...msg,
              reaction: msg.reaction === emoji ? null : emoji
            };
          }
          return msg;
        });

        chats[partnerId] = updatedHistory;
        
        await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/customers/${targetId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`
          },
          body: JSON.stringify({
            meta_data: [{ key: "mahally_chats", value: JSON.stringify(chats) }]
          })
        });
      } catch (err) {
        console.warn(`Reaction sync failed for user ${uId}:`, err.message);
      }
    };

    // Update BOTH sides
    await Promise.all([
      syncReactionForUser(userId, otherId),
      syncReactionForUser(otherId, userId)
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Global React Message Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
