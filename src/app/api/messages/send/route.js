import { persistMessage, getAdminId } from "@/lib/messages";
import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { fromId, toId, text, mediaUrl, mediaType, customMeta, replyTo, locale } = await request.json();

    if (!fromId || !toId || (!text && !mediaUrl && !customMeta)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminId = await getAdminId();

    const message = await persistMessage({
      fromId,
      toId,
      text,
      metadata: {
        ...(replyTo   ? { replyTo }   : {}),
        ...(mediaUrl  ? { mediaUrl }  : {}),
        ...(mediaType ? { mediaType } : {}),
        ...(customMeta ? { customMeta } : {}),
      }
    });

    // Automated Support Auto-Reply
    const isTargetAdmin = (toId === "admin" || String(toId) === "1" || String(toId) === String(adminId));
    const isSenderAdmin = (fromId === "admin" || String(fromId) === "1" || String(fromId) === String(adminId));

    let autoReplyMessage = null;

    if (isTargetAdmin && !isSenderAdmin) {
      const hasRecentAutoReply = await checkRecentAutoReply(fromId, adminId);
      
      if (!hasRecentAutoReply) {
        const isEnglish = locale === "en" || (!/[\u0600-\u06FF]/.test(text) && /[a-zA-Z]/.test(text));
        const autoReplyText = isEnglish
          ? "👋 Welcome to Mahally!\nThank you for reaching out 🤍 We've received your message, and Mahally Support will get back to you as soon as possible. 🚀"
          : "👋 أهلًا وسهلًا بكم في محلي!\nشكرًا لتواصلكم معنا 🤍 وصلتنا رسالتكم، وسيقوم فريق Mahally Support بالرد عليكم في أقرب وقت. 🚀";

        autoReplyMessage = await persistMessage({
          fromId: adminId,
          toId: fromId,
          text: autoReplyText,
          metadata: { isAutoReply: true }
        });
      }
    }

    return NextResponse.json({ success: true, message, autoReplyMessage });
  } catch (error) {
    console.error("Send Message API error:", error.message);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

async function checkRecentAutoReply(customerId, adminId) {
  try {
    const targetId = (customerId === "admin" || String(customerId) === "1") ? adminId : customerId;
    const res = await wcApi.get(`customers/${targetId}`);
    const user = res.data;
    if (!user || !user.meta_data) return false;

    const chatMeta = user.meta_data.find(m => m.key === "mahally_chats");
    if (!chatMeta) return false;

    const chats = typeof chatMeta.value === 'string' ? JSON.parse(chatMeta.value) : chatMeta.value;
    const history = chats[adminId] || chats["1"] || chats["admin"] || [];

    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const recentAutoReply = history.find(m =>
      (m.senderId === adminId || m.senderId === 1 || String(m.senderId) === "admin") &&
      (m.isAutoReply === true || m.metadata?.isAutoReply === true) &&
      m.timestamp > fifteenMinsAgo
    );

    return Boolean(recentAutoReply);
  } catch (err) {
    console.warn("Check recent auto-reply error:", err.message);
    return false;
  }
}
