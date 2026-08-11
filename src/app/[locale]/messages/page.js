"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import {
  Send, Search, Loader2, ShieldCheck, BadgeCheck, Paperclip,
  Smile, Trash2, Reply, X, RefreshCw, ArrowLeft, Info,
  CheckCircle2, MessageCircle, Plus, ArrowRight, ShieldAlert,
  SendHorizontal, File, AlertCircle, Store, ShoppingBag,
  ChevronRight, Package, Copy, MoreVertical, Clock, Check, XCircle,
  UserCog, Ban, Flag, Home, Menu
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getProductUrl } from "@/lib/product-utils";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const ALL_EMOJIS = ["😊", "😂", "❤️", "👍", "🙏", "🔥", "✨", "🙌", "😍", "🤔", "😎", "🚀", "😢", "😅", "🥳", "😤", "🫡", "💯", "👀", "🎉", "😬", "🤝", "💪", "🫶", "😮", "🥰", "😑", "🙃", "😏", "🤩", "😴", "🫠", "👏", "🌟", "💀", "🤯"];

// Allowed upload MIME types (must match what WordPress accepts)
const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
const ALLOWED_LABEL = "JPG, PNG, GIF, WEBP, PDF";
const MAX_FILE_MB = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateTime(timestamp, isAr = false) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = now.toDateString() === date.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

  const timeStr = date.toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `${isAr ? "اليوم" : "Today"}, ${timeStr}`;
  if (isYesterday) return `${isAr ? "أمس" : "Yesterday"}, ${timeStr}`;

  const dateStr = date.toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  return `${dateStr}, ${timeStr}`;
}

function getStatusLabel(status, isAr = true) {
  const map = isAr ? {
    completed: "تم التوصيل", processing: "قيد المعالجة", "on-hold": "في الانتظار",
    pending: "في انتظار الدفع", "pending payment": "في انتظار الدفع",
    cancelled: "ملغي", refunded: "مُسترد",
    shipped: "تم الشحن", "in-transit": "في الطريق",
  } : {
    completed: "Delivered", processing: "Processing", "on-hold": "On Hold",
    pending: "Pending Payment", "pending payment": "Pending Payment",
    cancelled: "Cancelled", refunded: "Refunded",
    shipped: "Shipped", "in-transit": "In Transit",
  };
  return map[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColors(status) {
  if (status === "completed") return { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (status === "cancelled" || status === "refunded") return { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200" };
  if (status === "shipped" || status === "in-transit") return { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" };
  return { dot: "bg-amber-400 animate-pulse", badge: "bg-amber-50 text-amber-700 border-amber-200" };
}

// ── Main Component ─────────────────────────────────────────────────────────────

import { Suspense } from "react";

// ── WhatsApp-Style Message Context Portal ─────────────────────────────
function MessageContextPortal({
  emojis, onReact, onReply, onCopy, onDelete,
  pos, isVisible, onClose, isMe, isAr, currentReaction
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [isVisible]);

  if (!isVisible || typeof window === "undefined") return null;

  const ease = "all 0.2s cubic-bezier(0.4,0,0.2,1)";

  const menuItems = [
    { icon: Reply, label: isAr ? "رد" : "Reply", onClick: onReply },
    { icon: Copy, label: isAr ? "نسخ" : "Copy", onClick: onCopy },
    ...(isMe ? [{ icon: Trash2, label: isAr ? "حذف" : "Delete", onClick: onDelete, danger: true }] : []),
  ];

  return createPortal(
    <>
      {/* ─ Dim backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          backgroundColor: "transparent",
          backdropFilter: "none",
        }}
      />

      {/* ─ Panel: emoji pill + context menu */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
          opacity: show ? 1 : 0,
          transform: show ? "scale(1) translateY(0)" : "scale(0.88) translateY(8px)",
          transition: ease,
          transformOrigin: isAr ? "top right" : "top left",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Emoji reaction pill — WhatsApp dark */}
        <div style={{
          background: "#1f2c33",
          border: "1px solid #2a3942",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          gap: 1,
          boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
          direction: "ltr",
        }}>
          {emojis.map(em => (
            <button
              key={em}
              onClick={() => onReact(em)}
              style={{
                fontSize: 18,
                padding: "3px 5px",
                borderRadius: 999,
                border: currentReaction === em ? "1.5px solid #00a884" : "1.5px solid transparent",
                background: currentReaction === em ? "rgba(0,168,132,0.18)" : "transparent",
                cursor: "pointer",
                lineHeight: 1,
                transition: "transform 0.14s ease, background 0.1s",
              }}
              onMouseEnter={ev => { ev.currentTarget.style.transform = "scale(1.28)"; ev.currentTarget.style.background = "#2a3942"; }}
              onMouseLeave={ev => { ev.currentTarget.style.transform = "scale(1)"; ev.currentTarget.style.background = currentReaction === em ? "rgba(0,168,132,0.18)" : "transparent"; }}
            >
              {em}
            </button>
          ))}
          <div style={{ width: 1, height: 18, background: "#2a3942", margin: "0 4px", flexShrink: 0 }} />
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "none", background: "transparent",
              color: "#8696a0", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.14s, color 0.14s", flexShrink: 0,
            }}
            onMouseEnter={ev => { ev.currentTarget.style.background = "#2a3942"; ev.currentTarget.style.color = "#e9edef"; }}
            onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#8696a0"; }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Context menu card — WhatsApp dark */}
        <div style={{
          background: "#233138",
          border: "1px solid #2a3942",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
          minWidth: 160,
          direction: isAr ? "rtl" : "ltr",
        }}>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); onClose(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 400,
                fontFamily: "inherit",
                color: item.danger ? "#f15c6d" : "#e9edef",
                background: "transparent",
                border: "none",
                borderBottom: i < menuItems.length - 1 ? "1px solid #2a3942" : "none",
                cursor: "pointer",
                textAlign: "start",
                transition: "background 0.12s",
              }}
              onMouseEnter={ev => { ev.currentTarget.style.background = "#2a3942"; }}
              onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; }}
            >
              <item.icon size={13} style={{ opacity: 0.8, flexShrink: 0 }} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale || "ar";
  const isAr = locale === "ar";
  const router = useRouter();
  const { user, wooId, loading: authLoading, messagingEnabled, isAdmin } = useAuth();

  useEffect(() => {
    if (!authLoading && messagingEnabled === false) {
      router.push("/");
    }
  }, [messagingEnabled, authLoading, router]);
  const rawVendorId = searchParams.get("to");
  const vendorId = rawVendorId ? rawVendorId.replace(/\/$/, "") : null; // Sanitize trailing slash

  // UI State
  const [conversations, setConversations] = useState([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [isDesignatedAdmin, setIsDesignatedAdmin] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(searchParams.get("msg") || "");
  const msgParam = searchParams.get("msg");
  const [loading, setLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshingConvs, setRefreshingConvs] = useState(false);
  const [refreshingMsgs, setRefreshingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [enterToSend, setEnterToSend] = useState(true);
  const [fileError, setFileError] = useState(null);   // inline file-type error
  const [uploadToast, setUploadToast] = useState(null); // { type: 'uploading'|'error'|'success', msg }
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const mainMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mainMenuRef.current && !mainMenuRef.current.contains(e.target)) {
        setShowMainMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReplyClick = (e, replyMsgId) => {
    e.stopPropagation();
    if (!replyMsgId) return;
    const el = document.getElementById(`message-${replyMsgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(replyMsgId);
    }
  };

  // Automatically clear message highlight after 3 seconds of being rendered
  useEffect(() => {
    if (highlightedMessageId && messages.length > 0) {
      const el = document.getElementById(`message-${highlightedMessageId}`);
      if (el) {
        const timer = setTimeout(() => {
          setHighlightedMessageId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedMessageId, messages]);

  // Load user preference for Enter to send
  useEffect(() => {
    const saved = localStorage.getItem("mahally_enter_to_send");
    if (saved !== null) {
      setEnterToSend(saved === "true");
    }
  }, []);

  const toggleEnterToSend = (val) => {
    setEnterToSend(val);
    localStorage.setItem("mahally_enter_to_send", val.toString());
  };

  // Info Panel Tabs
  const [activeTab, setActiveTab] = useState("info");
  const [vendorProducts, setVendorProducts] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // New Chat Modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [allVendors, setAllVendors] = useState([]);
  const [isSearchingVendors, setIsSearchingVendors] = useState(false);

  // Refs
  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const isSendingRef = useRef(false);
  const [reactionPickerPos, setReactionPickerPos] = useState({ top: 0, left: 0 });

  // Close reaction picker on chat scroll (like WhatsApp)
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const close = () => { if (showReactionPicker) setShowReactionPicker(null); };
    el.addEventListener("scroll", close, { passive: true });
    return () => el.removeEventListener("scroll", close);
  }, [showReactionPicker]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const scrollToBottom = (behavior = "smooth") => {
    if (highlightedMessageId) {
      const el = document.getElementById(`message-${highlightedMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    }
  };

  const safeFetchJson = async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.warn(`Safe fetch error [${url}]:`, err);
      return null;
    }
  };

  // ── Data Fetching ────────────────────────────────────────────────────────────

  const fetchData = async () => {
    if (!wooId) return;
    try {
      setError(null);
      // Gather local storage read timestamps for all chats
      const readTimes = {};
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`mahally_read_${wooId}_`)) {
            const partnerId = key.replace(`mahally_read_${wooId}_`, "");
            readTimes[partnerId] = Number(localStorage.getItem(key)) || 0;
          }
        }
      }
      const readTimesEncoded = encodeURIComponent(JSON.stringify(readTimes));
      const data = await safeFetchJson(`/api/messages/conversations?userId=${wooId}&readTimestamps=${readTimesEncoded}`);
      if (!data) throw new Error("Could not sync conversations.");
      const filtered = (data.conversations || []).filter(c => String(c.id) !== String(wooId));
      setConversations(filtered);
      setAdminUnreadCount(data.adminUnreadCount || 0);
      setIsDesignatedAdmin(data.isDesignatedAdmin || false);

      // Restore any read timestamps from the server that the client is missing
      // (This fixes the bug where messages appear unread after logout/login)
      if (data.syncedReadTimes && typeof window !== "undefined") {
        Object.entries(data.syncedReadTimes).forEach(([partnerId, ts]) => {
          const lsKey = `mahally_read_${wooId}_${partnerId}`;
          const existing = Number(localStorage.getItem(lsKey)) || 0;
          if (ts > existing) {
            localStorage.setItem(lsKey, ts);
          }
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMessages = async (vId, isForce = false) => {
    if (!wooId || !vId) return;

    // Prevent background polling from overwriting optimistic messages while sending
    if (!isForce && isSendingRef.current) return;

    const data = await safeFetchJson(`/api/messages?userId=${wooId}&otherId=${vId}`);
    if (data) {
      if (!isForce && isSendingRef.current) return; // double check after async

      const now = Date.now().toString();
      // Save read stamp for this chat
      localStorage.setItem(`mahally_read_${wooId}_${vId}`, now);
      // If this is the admin thread, save under BOTH key formats so the API counts it as read
      if (String(vId) === "1" || String(vId) === "admin") {
        localStorage.setItem(`mahally_read_${wooId}_1`, now);
        localStorage.setItem(`mahally_read_${wooId}_admin`, now);
        const subtract = adminUnreadCount;
        // Clear admin unread badge immediately in UI state
        setAdminUnreadCount(0);
        // Notify the Header to immediately re-fetch unread count and optimistically subtract
        window.dispatchEvent(new CustomEvent("mahally_read_updated", { detail: { subtract } }));
      } else {
        // If it's a regular conversation, we might need to subtract its unread count
        const conv = conversations.find(c => String(c.id) === String(vId));
        const subtract = conv ? (conv.unreadCount || 0) : 0;
        if (subtract > 0) {
          setConversations(prev => prev.map(c => String(c.id) === String(vId) ? { ...c, unreadCount: 0 } : c));
          window.dispatchEvent(new CustomEvent("mahally_read_updated", { detail: { subtract } }));
        } else {
          window.dispatchEvent(new CustomEvent("mahally_read_updated"));
        }
      }

      // Preserve replyTo from any in-flight optimistic messages (they're `temp-*` ids)
      setMessages(prev => {
        const incoming = data.messages || [];
        // Build a lookup of existing messages that have replyTo set (in case API omits it)
        const existingById = {};
        prev.forEach(m => { if (m.replyTo) existingById[m.id] = m.replyTo; });

        return incoming.map(m => ({
          ...m,
          // If the API message already has replyTo, keep it; otherwise fall back to cached
          replyTo: m.replyTo || existingById[m.id] || null,
        }));
      });

      // Instantly refresh other chats / unread counts
      fetchData();
    }
  };


  const fetchVendorProducts = async (vId) => {
    if (!vId) return;
    setProductsLoading(true);
    const data = await safeFetchJson(`/api/products?vendor=${vId}&per_page=12`);
    if (data) {
      setVendorProducts(data.products || []);
    }
    setProductsLoading(false);
  };

  const fetchCustomerOrders = async (targetId) => {
    if (!targetId || !wooId) return;
    setOrdersLoading(true);
    try {
      const isTargetVendor = vendor?.role === "vendor" || !vendor?.role;
      const fetchId = isTargetVendor ? wooId : targetId;
      const filterVendorId = isTargetVendor ? targetId : wooId;

      const data = await safeFetchJson(`/api/orders?userId=${fetchId}`);
      if (data) {
        const vOrders = (data.orders || []).filter(order =>
          order.line_items.some(item => {
            const itemVendorId = item.meta_data?.find(m => m.key === "_vendor_id")?.value;
            return String(itemVendorId) === String(filterVendorId);
          })
        );
        setCustomerOrders(vOrders);
      }
    } catch { } finally { setOrdersLoading(false); }
  };

  const fetchAllVendors = async () => {
    if (!wooId) return;
    setIsSearchingVendors(true);
    const data = await safeFetchJson(`/api/vendors?search=${vendorSearch}&excludeId=${wooId}`);
    if (data) {
      const list = data.vendors || [];
      if (!vendorSearch && !isDesignatedAdmin) {
        list.unshift({ id: "admin", storeName: "Mahally Support", role: "admin", isVerified: true });
      }
      setAllVendors(list);
    }
    setIsSearchingVendors(false);
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (showNewChat) fetchAllVendors();
  }, [showNewChat, vendorSearch]);

  useEffect(() => {
    if (msgParam) {
      setNewMessage(msgParam);
      // Remove msg parameter from URL so it doesn't stay if the user refreshes
      const url = new URL(window.location.href);
      url.searchParams.delete('msg');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [msgParam, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?redirect=/messages"); return; }
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, [user, authLoading, wooId]);

  useEffect(() => {
    if (!vendorId || !wooId) return;
    if (String(vendorId) === String(wooId)) { router.replace("/messages"); return; }
    if ((vendorId === "admin" || String(vendorId) === "1") && (isDesignatedAdmin || isAdmin)) {
      router.replace("/messages");
      return;
    }
    const switchConv = async () => {
      setIsChatLoading(true);
      await fetchMessages(vendorId);
      if (vendorId === "admin" || String(vendorId) === "1") {
        setVendor({ id: 1, storeName: "Mahally Support", role: "admin", isVerified: true });
      } else {
        try {
          // 1. Try Vendor API
          const vData = await safeFetchJson(`/api/vendors/${vendorId}`);
          if (vData?.vendor) {
            const vObj = { ...vData.vendor, role: "vendor" };
            setVendor(vObj);
            fetchVendorProducts(vendorId);
            fetchCustomerOrders(vendorId);
          } else {
            // 2. Try Customer API if Vendor fails
            const cData = await safeFetchJson(`/api/customers?id=${vendorId}`);
            if (cData?.id) {
              const isPartnerAdmin = cData.id === 1 || String(cData.id) === "admin" || (Array.isArray(cData.roles) && cData.roles.includes("administrator")) || cData.role === "admin";
              const cObj = {
                id: cData.id,
                storeName: isPartnerAdmin ? "Mahally Support" : (`${cData.first_name} ${cData.last_name}`.trim() || cData.username),
                storeLogo: isPartnerAdmin ? null : cData.avatar_url,
                role: isPartnerAdmin ? "admin" : "customer",
                email: cData.email,
                phone: cData.billing?.phone || "",
                isVerified: true,
                dateCreated: cData.date_created
              };
              setVendor(cObj);
              setActiveTab("info");
              fetchCustomerOrders(vendorId);
            }
          }
        } catch (err) {
          console.error("Switch conv error:", err);
        }
      }
      setIsChatLoading(false);
      setTimeout(() => scrollToBottom("auto"), 100);
    };
    switchConv();
  }, [vendorId, wooId]);



  // Only scroll to bottom when a NEW message is added, not when one is updated (reaction/delete)
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
      if (e.target.closest(".chat-background") && !e.target.closest(".message-bubble-wrapper")) {
        setSelectedMessageId(null);
        setShowReactionPicker(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatMessageText = (text, isMe) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            className={`underline transition-colors hover:opacity-80 ${isMe ? 'text-blue-100 font-medium' : 'text-[#be374f] font-medium'}`}
            onClick={e => e.stopPropagation()}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [newMessage]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const showToast = (type, msg, durationMs = 4000) => {
    setUploadToast({ type, msg });
    if (type !== "uploading") setTimeout(() => setUploadToast(null), durationMs);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    // Reset
    e.target.value = "";
    setFileError(null);
    if (!file) return;

    // 1. Check MIME type
    if (!ALLOWED_MIME.includes(file.type)) {
      setFileError(
        isAr
          ? `نوع الملف غير مدعوم. الأنواع المسموح بها: ${ALLOWED_LABEL}`
          : `File type not supported. Allowed: ${ALLOWED_LABEL}`
      );
      return;
    }
    // 2. Check size
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(
        isAr
          ? `حجم الملف كبير جداً. الحد الأقصى ${MAX_FILE_MB} ميغابايت`
          : `File too large. Max size is ${MAX_FILE_MB} MB`
      );
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  };

  const handleSend = async (text = newMessage, customMeta = null) => {
    if ((!text.trim() && !customMeta && !selectedFile) || !vendorId) return;

    isSendingRef.current = true;
    setSending(true);

    // ── 1. Upload media first (with progress toast) ──────────────────────────
    let mediaUrl = null, mediaType = null;
    const fileToSend = selectedFile;
    if (fileToSend) {
      showToast("uploading",
        isAr ? "⬆️ جارٍ رفع الملف..." : "⬆️ Uploading file..."
      );
      const formData = new FormData();
      formData.append("file", fileToSend);
      try {
        const res = await fetch("/api/merchant/media", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          mediaUrl = data.url;
          mediaType = fileToSend.type.startsWith("image/") ? "image" : "file";
          showToast("success", isAr ? "✅ تم رفع الملف" : "✅ File uploaded", 2000);
        } else {
          // Upload failed — show error and ABORT sending
          showToast("error",
            data.error || (isAr ? "❌ فشل رفع الملف. الرجاء التحقق من نوع الملف." : "❌ Upload failed. Please check the file type.")
          );
          isSendingRef.current = false;
          setSending(false);
          return;
        }
      } catch (err) {
        showToast("error", isAr ? "❌ خطأ في الشبكة أثناء رفع الملف" : "❌ Network error during upload");
        isSendingRef.current = false;
        setSending(false);
        return;
      }
    }

    // ── 2. Optimistic message with 'pending' status ──────────────────────────
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      senderId: wooId,
      text,
      customMeta,
      mediaUrl,
      mediaType,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      status: "pending",  // ← WhatsApp-style: clock icon
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");
    setReplyTo(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);

    // ── 3. Send to API, update status ────────────────────────────────────────
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: wooId, toId: vendorId, text: tempMsg.text,
          mediaUrl: tempMsg.mediaUrl, mediaType: tempMsg.mediaType,
          customMeta: tempMsg.customMeta, replyTo: tempMsg.replyTo,
          locale: locale || "ar"
        }),
      });
      if (res.ok) {
        // Mark as sent ✓✓
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, status: "sent" } : m
        ));
      } else {
        // Mark as failed ✗
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, status: "failed" } : m
        ));
        showToast("error", isAr ? "❌ فشل إرسال الرسالة" : "❌ Message failed to send");
      }
      await new Promise(r => setTimeout(r, 300));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: "failed" } : m
      ));
      showToast("error", isAr ? "❌ تعذر إرسال الرسالة" : "❌ Could not send message");
    } finally {
      isSendingRef.current = false;
      setSending(false);
      fetchMessages(vendorId, true);
    }
  };

  const handleReact = async (msg, emoji) => {
    setShowReactionPicker(null); setSelectedMessageId(null);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reaction: m.reaction === emoji ? null : emoji } : m));
    try {
      await fetch("/api/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: wooId, otherId: vendorId, messageId: msg.id, emoji }),
      });
    } catch { }
  };

  const handleDelete = async (msgId) => {
    if (!confirm("هل تريد حذف هذه الرسالة للجميع؟")) return;
    setSelectedMessageId(null);
    setMessages(prev => prev.map(m => m.id === msgId
      ? { ...m, text: "تم حذف الرسالة", isDeleted: true, mediaUrl: null, mediaType: null, customMeta: null, reaction: null }
      : m
    ));
    try {
      await fetch("/api/messages/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: wooId, otherId: vendorId, messageId: msgId }),
      });
    } catch { }
  };

  const isAdminAccount = vendorId === "admin" || String(vendorId) === "1" || vendor?.role === "admin";

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#febd69] rounded-full animate-spin" />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex-1 h-full bg-white flex font-sans text-zinc-900 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className={`${vendorId ? "hidden lg:flex" : "flex"} w-full lg:w-[300px] bg-white border-r border-zinc-200 flex-col shrink-0`}>

        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative" ref={mainMenuRef}>
                <button
                  onClick={() => setShowMainMenu(!showMainMenu)}
                  className={`p-1.5 -ms-1.5 rounded-md transition-colors ${showMainMenu ? 'text-[#be374f] bg-[#be374f]/10' : 'text-zinc-400 hover:text-[#be374f] hover:bg-zinc-100'}`}
                  title={isAr ? "القائمة" : "Menu"}
                >
                  <Menu size={18} />
                </button>
                {showMainMenu && (
                  <div className={`absolute ${isAr ? 'right-0' : 'left-0'} top-full mt-2 w-48 bg-white border border-zinc-200 shadow-xl rounded-xl z-50 overflow-hidden`}>
                    <div className="py-1">
                      <Link href="/" className="flex items-center gap-2 px-4 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 hover:text-[#be374f]">
                        <Home size={15} />
                        {isAr ? "الرئيسية" : "Home"}
                      </Link>
                      <Link href="/vendors" className="flex items-center gap-2 px-4 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 hover:text-[#be374f]">
                        <Store size={15} />
                        {isAr ? "تصفح المتاجر" : "Browse Stores"}
                      </Link>
                      <Link href="/browse" className="flex items-center gap-2 px-4 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 hover:text-[#be374f]">
                        <Package size={15} />
                        {isAr ? "تصفح المنتجات" : "Browse Products"}
                      </Link>
                      <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 hover:text-[#be374f]">
                        <UserCog size={15} />
                        {isAr ? "حسابي" : "My Profile"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <h1 className="text-[18px] font-semibold text-zinc-900 flex items-center gap-2">
                {isAr ? "الرسائل" : "Messages"}
              </h1>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={async () => { setRefreshingConvs(true); await fetchData(); setRefreshingConvs(false); }}
                className={`w-8 h-8 border border-zinc-200 rounded-md flex items-center justify-center text-zinc-500 hover:border-[#be374f] hover:text-[#be374f] transition-all ${refreshingConvs ? "text-[#be374f]" : ""}`}
                title={isAr ? "تحديث المحادثات" : "Refresh conversations"}
              >
                <RefreshCw size={14} className={refreshingConvs ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-8 h-8 border border-zinc-300 rounded-md flex items-center justify-center text-zinc-600 hover:bg-brand-light hover:border-brand transition-all shadow-sm"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="relative group">
            <div className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-colors ${searchQuery ? "text-[#be374f]" : "text-zinc-400 group-focus-within:text-[#be374f]"}`}>
              <Search size={15} />
            </div>

            <input
              type="text"
              dir={isAr ? "rtl" : "ltr"}
              placeholder={isAr ? "ابحث في المحادثات أو الرسائل..." : "Search conversations or messages..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-[13px] rounded-xl py-2.5 ${isAr ? 'pr-9 pl-10' : 'pl-9 pr-10'} focus:outline-none focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f]/30 transition-all placeholder:text-zinc-400 shadow-sm group-hover:border-zinc-300`}
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#be374f] hover:bg-zinc-200/50 p-1 rounded-full transition-all`}
                title={isAr ? "مسح البحث" : "Clear search"}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <div className="flex items-center mt-3 px-0.5 select-none">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${showUnreadOnly
                ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm"
                : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showUnreadOnly ? "bg-[#be374f] animate-pulse" : "bg-zinc-300"}`} />
              {isAr ? "غير المقروءة فقط" : "Unread only"}
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {error && (
            <div className="mb-3 p-2.5 bg-zinc-50 border border-zinc-200 rounded-md flex items-start gap-2">
              <AlertCircle size={14} className="text-[#be374f] shrink-0 mt-0.5" />
              <p className="text-[12px] text-zinc-500">{error}</p>
            </div>
          )}

          {/* Support thread */}
          {!searchQuery && !isDesignatedAdmin && (!showUnreadOnly || adminUnreadCount > 0) && (
            <div
              onClick={() => {
                const subtract = adminUnreadCount;
                setAdminUnreadCount(0); // immediate clear in messages sidebar
                // Write the read stamp NOW so the header's re-fetch sees it as zero
                const now = Date.now().toString();
                localStorage.setItem(`mahally_read_${wooId}_1`, now);
                localStorage.setItem(`mahally_read_${wooId}_admin`, now);
                // Notify the Header navbar to immediately re-fetch unread
                window.dispatchEvent(new CustomEvent("mahally_read_updated", { detail: { subtract } }));
                router.push("/messages?to=1");
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all ${(vendorId === "admin" || String(vendorId) === "1") ? "bg-[#fde7ee] border border-[#b2d8dc]" : "hover:bg-zinc-50 border border-transparent"}`}
            >
              <div className="w-9 h-9 rounded-md bg-zinc-900 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-[#be374f]" />
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <p className={`text-[13px] font-medium ${(vendorId === "admin" || String(vendorId) === "1") ? "text-[#be374f]" : "text-zinc-900"}`}>Mahally Support</p>
                  <p className="text-[12px] text-zinc-500 truncate mt-0.5">{isAr ? "فريق الدعم الفني" : "Customer Support"}</p>
                </div>
                {adminUnreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#be374f] text-white text-[10px] font-bold rounded-full shadow-sm shrink-0 me-2">
                    {adminUnreadCount}
                  </span>
                )}
              </div>
            </div>
          )}

          {conversations.length > 0 && (
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide px-3 pt-3 pb-1">{isAr ? "المحادثات الأخيرة" : "Recent Conversations"}</p>
          )}

          {/* Merged list ensures active vendor is always shown */}
          {(() => {
            let list = [...conversations];
            if (vendorId && vendorId !== "admin" && !list.some(c => String(c.id) === String(vendorId)) && vendor) {
              list.unshift({
                id: vendor.id,
                name: vendor.storeName,
                logo: vendor.storeLogo,
                lastMessage: isAr ? "متصل" : "Connected",
                time: "Now",
                lastTimestamp: Date.now()
              });
            }

            // Deduplicate to enforce unique keys in case the API returned overlapped data
            const uniqueList = [];
            const seen = new Set();
            for (const c of list) {
              if (!seen.has(String(c.id))) {
                seen.add(String(c.id));
                uniqueList.push(c);
              }
            }

            // Build the base filtered list
            const baseList = uniqueList
              .filter(c => {
                if (String(c.id) === String(wooId)) return false;
                // If the pinned support thread is shown, exclude it from the Recent list to prevent duplicate listing
                if (!searchQuery && !isDesignatedAdmin && (String(c.id) === "1" || String(c.id) === "admin" || c.role === "admin")) return false;
                return true;
              })
              .filter(c => !showUnreadOnly || (c.unreadCount && c.unreadCount > 0) || String(c.id) === String(vendorId));

            // Apply search and flat map results
            let finalRenderList = [];

            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              baseList.forEach(conv => {
                const nameMatch = conv.name?.toLowerCase().includes(q);
                const msgs = conv.messages || [];
                const matchedMsgs = msgs.filter(m => m.text?.toLowerCase().includes(q));

                if (nameMatch && matchedMsgs.length === 0) {
                  finalRenderList.push({ type: 'conv', conv });
                } else {
                  matchedMsgs.forEach(m => {
                    finalRenderList.push({ type: 'msg', conv, message: m });
                  });
                  if (nameMatch && matchedMsgs.length > 0) {
                    finalRenderList.push({ type: 'conv', conv });
                  }
                }
              });
              // Sort matches by time descending
              finalRenderList.sort((a, b) => {
                const tA = a.type === 'msg' ? a.message.timestamp : a.conv.lastTimestamp;
                const tB = b.type === 'msg' ? b.message.timestamp : b.conv.lastTimestamp;
                return tB - tA;
              });
            } else {
              finalRenderList = baseList.map(c => ({ type: 'conv', conv: c }));
            }

            return finalRenderList.map((item, index) => {
              const { type, conv, message } = item;
              const isActive = String(conv.id) === String(vendorId);

              return (
                <div
                  key={`${conv.id}-${type === 'msg' ? message.id : 'c'}-${index}`}
                  onClick={() => {
                    const subtract = conv.unreadCount || 0;
                    // Immediately clear unread badge (optimistic)
                    setConversations(prev => prev.map(c =>
                      String(c.id) === String(conv.id) ? { ...c, unreadCount: 0 } : c
                    ));
                    // Write read stamp immediately and notify header
                    const now = Date.now().toString();
                    localStorage.setItem(`mahally_read_${wooId}_${conv.id}`, now);
                    window.dispatchEvent(new CustomEvent("mahally_read_updated", { detail: { subtract } }));

                    // Highlight and navigate
                    if (type === 'msg') {
                      setHighlightedMessageId(message.id);
                    }

                    if (!isActive) {
                      router.push(`/messages?to=${conv.id}`);
                    } else if (type === 'msg') {
                      // Already in this conversation, scroll immediately
                      setTimeout(() => {
                        const el = document.getElementById(`message-${message.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all border ${isActive && type === 'conv' ? "bg-[#fde7ee] border-[#b2d8dc]" : "border-transparent hover:bg-zinc-50 hover:border-zinc-200"}`}
                >
                  <div className="w-9 h-9 rounded-md overflow-hidden border border-zinc-200 bg-white shrink-0 relative">
                    {conv.logo ? (
                      <Image src={conv.logo} alt="logo" fill className="object-contain p-1" />
                    ) : (
                      <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                        <Store size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={`text-[13px] font-medium truncate ${isActive && type === 'conv' ? "text-[#be374f]" : "text-zinc-900"}`}>{conv.name}</p>
                      <span className="text-[11px] text-zinc-400 shrink-0 me-2">
                        {type === 'msg' ? (message.timestamp ? formatDateTime(message.timestamp, isAr) : message.time) : (conv.lastTimestamp ? formatDateTime(conv.lastTimestamp, isAr) : conv.time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-[12px] truncate ${conv.unreadCount > 0 && !isActive ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>
                        {type === 'msg' ? (
                          <>
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1 rounded inline-block me-1">{isAr ? "رسالة:" : "Match:"}</span>
                            {message.text}
                          </>
                        ) : conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && type === 'conv' && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#be374f] text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse shrink-0 me-2">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </aside>

      {/* ── CHAT & INFO WRAPPER ── */}
      <div className="flex-1 flex min-w-0 relative">
        {/* Loading Overlay */}
        {isChatLoading && vendorId && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[60] flex flex-col items-center justify-center transition-all duration-300">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#be374f] rounded-full animate-spin mb-3"></div>
            <p className="text-[13px] font-medium text-zinc-600">{isAr ? "جارٍ تحميل المحادثة..." : "Loading conversation..."}</p>
          </div>
        )}

        {/* ── CHAT VIEW ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {vendorId ? (
            <>
              {/* Chat Header */}
              <header className="h-[56px] flex items-center justify-between px-5 border-b border-zinc-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => router.push("/messages")} className="lg:hidden p-1 text-zinc-500">
                    {!isAr ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                  </button>
                  <div className="w-8 h-8 rounded-md bg-zinc-50 border border-zinc-200 overflow-hidden relative flex items-center justify-center">
                    {isAdminAccount
                      ? <ShieldCheck size={16} className="text-[#be374f]" />
                      : <Image src={vendor?.storeLogo || "https://placehold.co/100"} alt="logo" fill className="object-contain p-1" />
                    }
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-zinc-900 flex items-center gap-1.5">
                      {isAdminAccount ? "Mahally Support" : (vendor?.storeName || (isAr ? "المحادثة" : "Conversation"))}
                      {vendor?.isVerified && <BadgeCheck size={14} className="text-[#be374f]" />}
                    </h2>

                  </div>
                </div>
                <div className="flex items-center gap-1.5 relative">
                  <button
                    onClick={async () => { setRefreshingMsgs(true); await fetchMessages(vendorId); setRefreshingMsgs(false); }}
                    className="w-8 h-8 border border-zinc-200 rounded-md flex items-center justify-center text-zinc-500 hover:text-[#be374f] transition-all"
                    title={isAr ? "تحديث الرسائل" : "Refresh messages"}
                  >
                    <RefreshCw size={15} className={refreshingMsgs ? "animate-spin" : ""} />
                  </button>
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`w-8 h-8 border rounded-md flex items-center justify-center transition-all ${showInfo ? "bg-[#fde7ee] border-[#b2d8dc] text-[#be374f]" : "border-zinc-200 text-zinc-500 hover:text-[#be374f]"}`}
                  >
                    <Info size={15} />
                  </button>

                </div>
              </header>

              {/* Messages */}
              <div ref={chatScrollRef} className="chat-background flex-1 overflow-y-auto px-5 py-5 bg-zinc-50 space-y-3 relative">
                <>
                  {messages.map((msg, index) => {
                    const isMe = String(msg.senderId) === String(wooId);
                    const isSelected = selectedMessageId === msg.id;

                    // Determine sender name label
                    let senderLabel = "";
                    if (isMe) {
                      senderLabel = isAdmin
                        ? (isAr ? "Mahally Support (أنت)" : "Mahally Support (You)")
                        : (isAr ? "أنت" : "You");
                    } else {
                      const isSenderAdmin = msg.senderId === 1 || String(msg.senderId) === "admin" || vendor?.role === "admin";
                      senderLabel = isSenderAdmin
                        ? "Mahally Support"
                        : (vendor?.storeName || (isAr ? "العميل" : "Customer"));
                    }

                    return (
                      <div id={`message-${msg.id}`} key={msg.id || `msg-${index}`} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative ${isSelected || showReactionPicker === msg.id ? "z-40" : "z-1"}`}>
                        <span className="text-[10px] text-zinc-400 mb-1 px-1 font-semibold select-none">
                          {senderLabel}
                        </span>
                        <div
                          onClick={() => setSelectedMessageId(isSelected ? null : msg.id)}
                          className={`message-bubble-wrapper max-w-[75%] lg:max-w-[65%] px-4 py-2.5 rounded-lg text-[13px] leading-relaxed border relative transition-all duration-500 ${isSelected ? "ring-2 ring-[#be374f] ring-offset-1" : ""} ${highlightedMessageId === msg.id ? "bg-amber-100 border-amber-300 ring-2 ring-amber-400 shadow-md transform scale-[1.02]" :
                            isMe ? "bg-[#be374f] text-white border-[#be374f]" : "bg-white text-zinc-800 border-zinc-200 shadow-sm"
                            }`}
                        >
                          {msg.replyTo && (
                            <div
                              onClick={(e) => handleReplyClick(e, msg.replyTo.id)}
                              className={`mb-2 p-2 border-e-2 text-[11px] rounded-sm cursor-pointer hover:opacity-80 transition-opacity ${isMe ? "border-white/40 bg-white/10 text-white/60" : "border-[#be374f] bg-zinc-50 text-zinc-500"}`}>
                              ↩ {msg.replyTo.text}
                            </div>
                          )}

                          {msg.mediaUrl && !msg.isDeleted && (
                            <div className="mb-2 rounded-md overflow-hidden border border-white/20">
                              {msg.mediaType === "image"
                                ? (
                                  <img
                                    src={msg.mediaUrl}
                                    alt="media"
                                    onClick={() => setLightboxMedia(msg.mediaUrl)}
                                    className="max-w-full sm:max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-sm bg-black/5"
                                  />
                                )
                                : <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 text-[12px] hover:bg-black/5 transition-colors"><File size={14} /><span>{isAr ? "عرض المستند" : "View Document"}</span></a>
                              }
                            </div>
                          )}

                          {msg.text && (
                            <p className={`whitespace-pre-wrap ${msg.isDeleted ? "italic text-zinc-400" : ""}`}>
                              {msg.isDeleted ? msg.text : formatMessageText(msg.text, isMe)}
                            </p>
                          )}

                          {msg.customMeta?.type === "product" && !msg.isDeleted && (() => {
                            const pUrl = msg.customMeta.url || getProductUrl({ id: msg.customMeta.id, name: msg.customMeta.name }, { storeName: vendor?.storeName || "", storeId: vendorId || "" });
                            return (
                              <Link href={pUrl} className={`group mt-3 p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3.5 transition-all shadow-sm hover:shadow-md ${isMe ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-white border-zinc-200 hover:border-[#be374f]"}`}>
                                <div className="w-16 h-16 sm:w-14 sm:h-14 bg-white rounded-lg shrink-0 overflow-hidden relative border border-zinc-100 shadow-sm">
                                  <Image src={msg.customMeta.image || "https://placehold.co/100"} alt="product" fill className="object-cover" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <p className={`text-[13px] font-semibold leading-snug line-clamp-2 ${isMe ? "text-white" : "text-zinc-900 group-hover:text-[#be374f] transition-colors"}`}>{msg.customMeta.name}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <p className={`text-[14px] font-bold ${isMe ? "text-white" : "text-[#be374f]"}`}>د.أ {msg.customMeta.price}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isMe ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                                      {isAr ? "عرض المنتج" : "View Product"}
                                    </span>
                                  </div>
                                </div>
                                <div className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${isMe ? "bg-white/20 text-white" : "bg-zinc-50 text-zinc-400 group-hover:bg-[#be374f] group-hover:text-white"} transition-colors`}>
                                  <ChevronRight size={16} className={isAr ? "rotate-180" : ""} />
                                </div>
                              </Link>
                            );
                          })()}

                          <div className={`flex items-center gap-1 mt-1.5 justify-end ${isMe ? "text-white/50" : "text-zinc-400"}`}>
                            <span className="text-[10px]">{msg.timestamp ? formatDateTime(msg.timestamp, isAr) : msg.time}</span>
                            {isMe && (
                              msg.status === "pending" ? (
                                /* Sending — animated clock */
                                <Clock size={10} className="animate-pulse opacity-70" />
                              ) : msg.status === "failed" ? (
                                /* Failed — red X */
                                <XCircle size={11} className="text-red-300" title={isAr ? "فشل الإرسال" : "Failed to send"} />
                              ) : (
                                /* Sent / Delivered — double check like WhatsApp */
                                <span className="flex items-center -space-x-1">
                                  <Check size={10} className="opacity-80" strokeWidth={2.5} />
                                  <Check size={10} className="opacity-80" strokeWidth={2.5} />
                                </span>
                              )
                            )}
                          </div>

                          {msg.reaction && !msg.isDeleted && (
                            <div className="absolute -bottom-2 -start-2 bg-white shadow border border-zinc-100 px-1.5 py-0.5 rounded-full text-[12px]">{msg.reaction}</div>
                          )}

                          {/* ─ WhatsApp ⋯ options button (top-right LTR / top-left RTL) */}
                          {!msg.isDeleted && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const bubble = e.currentTarget.closest(".message-bubble-wrapper");
                                const rect = bubble.getBoundingClientRect();
                                const panelW = 190;
                                // emoji pill ~42px + gap 6px + context menu ~(items*34px)
                                const panelH = 42 + 6 + 34 * 3;

                                // Vertical: place ABOVE the bubble. If not enough room, place below.
                                let topPos = rect.top - panelH - 8;
                                if (topPos < 8) topPos = rect.bottom + 8;
                                // clamp to viewport bottom
                                if (topPos + panelH > window.innerHeight - 8)
                                  topPos = window.innerHeight - panelH - 8;

                                // Horizontal: align to bubble edge
                                let leftPos;
                                if (isAr) {
                                  // RTL: align panel right edge to bubble right edge
                                  leftPos = rect.right - panelW;
                                  if (leftPos < 8) leftPos = 8;
                                } else {
                                  // LTR: align panel left edge to bubble left edge
                                  leftPos = rect.left;
                                  if (leftPos + panelW > window.innerWidth - 8)
                                    leftPos = window.innerWidth - panelW - 8;
                                }

                                setReactionPickerPos({ top: topPos, left: Math.max(8, leftPos) });
                                setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id);
                              }}
                              className={`absolute -top-2.5 ${isAr ? "-left-2.5" : "-right-2.5"
                                } w-5 h-5 bg-[#1f2c33] border border-[#2a3942] shadow-md rounded-full items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition-all z-50 ${isSelected || showReactionPicker === msg.id ? "flex" : "hidden group-hover:flex"
                                }`}
                              title={isAr ? "خيارات" : "Options"}
                            >
                              <MoreVertical size={10} />
                            </button>
                          )}
                          <MessageContextPortal
                            emojis={REACTION_EMOJIS}
                            isVisible={showReactionPicker === msg.id}
                            pos={reactionPickerPos}
                            onReact={(e) => handleReact(msg, e)}
                            onReply={() => { setReplyTo(msg); setSelectedMessageId(null); }}
                            onCopy={() => { if (msg.text) navigator.clipboard.writeText(msg.text).catch(() => { }); }}
                            onDelete={() => handleDelete(msg.id)}
                            onClose={() => setShowReactionPicker(null)}
                            isMe={isMe}
                            isAr={isAr}
                            currentReaction={msg.reaction}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              </div>

              {/* Upload toast — fixed top-center */}
              {uploadToast && (
                <div
                  style={{
                    position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
                    zIndex: 99999, minWidth: 260, maxWidth: 400,
                    background: uploadToast.type === "error" ? "#7f1d1d" : uploadToast.type === "success" ? "#14532d" : "#1f2c33",
                    color: "#f4f4f5",
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    animation: "fadeSlideIn 0.2s ease",
                  }}
                >
                  {uploadToast.type === "uploading" && <Loader2 size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                  <span>{uploadToast.msg}</span>
                </div>
              )}

              {/* Compose */}
              <div className="px-5 py-3 border-t border-zinc-200 bg-white shrink-0">
                {replyTo && (
                  <div className="flex items-center justify-between px-3 py-2 bg-[#fde7ee]/60 border border-b-0 border-[#be374f]/30 border-s-4 border-s-[#be374f] rounded-t-md transition-colors">
                    <span className="text-[12px] text-zinc-500 flex items-center gap-1.5">
                      <Reply size={12} className="text-[#be374f]" /> <span className="font-semibold text-[#be374f]">{isAr ? "الرد على:" : "Replying to:"}</span> <span className="text-zinc-700 truncate max-w-xs">{replyTo.text}</span>
                    </span>
                    <button onClick={() => setReplyTo(null)} className="text-zinc-400 hover:text-rose-500"><X size={14} /></button>
                  </div>
                )}
                {fileError ? (
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-b-0 border-red-200 rounded-t-md">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-600 leading-snug">{fileError}</p>
                    <button onClick={() => setFileError(null)} className="ms-auto text-zinc-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ) : null}
                <div className={`flex items-end gap-2 px-2 py-1.5 transition-colors ${replyTo ? "bg-[#fde7ee]/20 border border-[#be374f]/30 rounded-b-md" : fileError ? "bg-zinc-50 border border-zinc-300 rounded-b-md" : "bg-zinc-50 border border-zinc-300 rounded-md"}`}>
                  <button
                    onClick={() => { setFileError(null); fileInputRef.current?.click(); }}
                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#be374f] transition-colors"
                    title={isAr ? `الأنواع المسموحة: ${ALLOWED_LABEL}` : `Allowed: ${ALLOWED_LABEL}`}
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={ALLOWED_EXT.join(",")}
                    onChange={handleFileChange}
                  />

                  <div className="relative shrink-0" ref={emojiRef}>
                    <button onClick={() => setShowEmoji(!showEmoji)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#be374f] transition-colors">
                      <Smile size={16} />
                    </button>
                    {showEmoji && (
                      <div className="absolute bottom-full start-0 bg-white border border-zinc-200 shadow-xl p-3 grid grid-cols-6 gap-1.5 w-[240px] rounded-md z-50 mb-2">
                        {ALL_EMOJIS.map(e => (
                          <button key={e} onClick={() => { setNewMessage(p => p + e); setShowEmoji(false); }} className="text-[20px] hover:scale-125 transition-all p-0.5">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    dir={newMessage ? "auto" : (isAr ? "rtl" : "ltr")}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        if (enterToSend && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        } else if (!enterToSend && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleSend();
                        }
                      }
                    }}
                    placeholder={isAr ? "اكتب رسالة..." : "Write a message..."}
                    className="flex-1 bg-transparent border-none py-1.5 px-1 text-[13px] outline-none resize-none text-zinc-800 placeholder:text-zinc-400 overflow-y-auto max-h-[96px] custom-scrollbar"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={sending}
                    className="h-[34px] px-4 bg-brand hover:bg-brand-dark border-brand rounded-md text-[13px] font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> {isAr ? "إرسال" : "Send"}</>}
                  </button>
                </div>

                <div className="flex justify-end mt-1.5 px-1">
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={enterToSend}
                      onChange={e => toggleEnterToSend(e.target.checked)}
                      className="rounded border-zinc-300 w-3 h-3 text-[#be374f] focus:ring-[#be374f]"
                    />
                    {isAr ? "اضغط Enter للإرسال" : "Press Enter to send"}
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <MessageCircle size={40} className="text-zinc-300 mb-4" />
              <h2 className="text-[22px] font-semibold text-zinc-900 mb-2">{isAr ? "الرسائل" : "Messages"}</h2>
              <p className="text-zinc-500 text-[14px] max-w-xs mb-6 leading-relaxed">
                {isAr ? "تواصل بأمان مع البائعين الموثوقين حول طلباتك واستفساراتك." : "Safely communicate with trusted sellers about your orders and inquiries."}
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="h-[34px] px-6 bg-brand hover:bg-brand-dark border-brand rounded-md text-[13px] font-medium shadow-sm transition-all"
              >
                {isAr ? "ابحث عن جهة اتصال" : "Find a contact"}
              </button>
            </div>
          )}
        </main>

        {/* ── INFO PANEL ── */}
        {showInfo && vendorId && (
          <>
            {/* Mobile Backdrop */}
            <div
              className="xl:hidden fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={() => setShowInfo(false)}
            />
            <aside className={`fixed xl:static inset-y-0 ${isAr ? 'left-0 border-r' : 'right-0 border-l'} z-[101] w-[280px] xl:w-[260px] bg-white border-zinc-200 flex flex-col shrink-0 shadow-2xl xl:shadow-none animate-in ${isAr ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} xl:animate-none`}>
              {/* Tabs */}
              <div className={`flex border-b border-zinc-200 h-[56px] items-end px-4 shrink-0 relative`}>
                <button
                  onClick={() => setShowInfo(false)}
                  className="xl:hidden absolute top-1/2 -translate-y-1/2 end-3 p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
                {isAdminAccount ? (
                  <div className="pb-2 text-[13px] font-medium text-zinc-900">{isAr ? "معلومات الدعم" : "Support Info"}</div>
                ) : (
                  ["info", "products", "orders"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-2.5 text-[13px] font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? "border-[#be374f] text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"} ${tab === "products" && (vendor?.role === "customer" || vendorProducts.length === 0) ? "hidden" : ""}`}
                    >
                      {tab === "info" ? (isAr ? "معلومات" : "Info") : tab === "products" ? (isAr ? "المنتجات" : "Products") : (isAr ? "الطلبات" : "Orders")}
                    </button>
                  ))
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {isAdminAccount ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-3 border border-zinc-800">
                        <ShieldAlert size={28} className="text-[#be374f]" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-zinc-900">Mahally Support</h3>
                      <span className="inline-flex items-center gap-1 mt-1.5 bg-[#fde7ee] text-[#be374f] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[#b2d8dc]">
                        <BadgeCheck size={11} /> {isAr ? "فريق الدعم الرسمي" : "Verified Support Team"}
                      </span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                      <p className="text-[12px] text-zinc-500 text-center leading-relaxed">{isAr ? "تقديم الدعم الفني والتشغيلي للمشترين والبائعين، والإجابة عن الاستفسارات، والمساعدة في استخدام المنصة." : "Handles order disputes, technical issues, and merchant onboarding on the platform."}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === "info" && (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-lg border border-zinc-200 p-1.5 mx-auto mb-3 bg-white relative shadow-sm flex items-center justify-center overflow-hidden">
                              {vendor?.storeLogo ? (
                                <Image src={vendor.storeLogo} alt="logo" fill className="object-contain p-1" />
                              ) : (
                                <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                  <ShoppingBag size={24} />
                                </div>
                              )}
                            </div>
                            <h2 className="text-[15px] font-semibold text-zinc-900">{vendor?.storeName}</h2>
                            <span className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${vendor?.role === "customer" ? "bg-zinc-100 text-zinc-600 border-zinc-200" : "bg-[#fde7ee] text-[#be374f] border-[#b2d8dc]"}`}>
                              <BadgeCheck size={11} /> {vendor?.role === "customer" ? (isAr ? "مشتري موثوق" : "Verified Buyer") : (isAr ? "متجر رسمي" : "Official Store")}
                            </span>
                          </div>

                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md space-y-2">
                            <div className="flex justify-between text-[12px]">
                              <span className="text-zinc-500">{isAr ? "عضو منذ" : "Member since"}</span>
                              <span className="text-zinc-700 font-medium">{vendor?.dateCreated ? new Date(vendor.dateCreated).getFullYear() : "2024"}</span>
                            </div>
                            {vendor?.role === "customer" && (
                              <div className="flex justify-between text-[12px]">
                                <span className="text-zinc-500">{isAr ? "إجمالي الطلبات" : "Total Orders"}</span>
                                <span className="text-[#be374f] font-medium">{customerOrders.length}</span>
                              </div>
                            )}
                          </div>

                          {vendor?.role === "vendor" && (
                            <div className="space-y-1.5">
                              {isDesignatedAdmin && (
                                <button
                                  onClick={() => window.open(`/${locale}/vendor/${vendor.storeSlug || vendor.id}`, "_blank")}
                                  className="w-full h-[31px] bg-[#fde7ee] border border-[#b2d8dc] rounded-md text-[12px] font-medium text-[#be374f] flex items-center justify-center gap-2 hover:bg-[#fcd0dd] transition-all"
                                >
                                  <Store size={14} /> {isAr ? "زيارة المتجر" : "Visit Store"}
                                </button>
                              )}
                              {vendor?.whatsappNumber && vendor?.showWhatsapp && (
                                <button
                                  onClick={() => window.open(`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, '')}`, "_blank")}
                                  className="w-full h-[31px] bg-zinc-50 border border-zinc-300 rounded-md text-[12px] font-medium text-zinc-600 flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all"
                                >
                                  WhatsApp
                                </button>
                              )}
                              <button
                                onClick={() => window.open("https://t.me/mahally", "_blank")}
                                className="w-full h-[31px] bg-zinc-50 border border-zinc-300 rounded-md text-[12px] font-medium text-zinc-600 flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all"
                              >
                                Telegram
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "products" && (
                      <div className="space-y-2">
                        <div className="relative mb-3">
                          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            placeholder={isAr ? "ابحث في منتجات المتجر..." : "Search store products..."}
                            className="w-full h-9 border border-zinc-300 rounded-md ps-9 pe-3 text-[12px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                          />
                        </div>
                        {productsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-4 border-zinc-200 border-t-[#febd69] rounded-full animate-spin" />
                          </div>
                        ) : vendorProducts.filter(p => (p.name || "").toLowerCase().includes(productSearchQuery.toLowerCase())).map((p, index) => (
                          <div key={p.id || `prod-${index}`} className="p-2.5 border border-zinc-200 rounded-md hover:border-[#be374f] transition-all bg-white">
                            <div className="flex gap-2.5 mb-2">
                              <div className="w-10 h-10 bg-white rounded-md border border-zinc-200 shrink-0 relative overflow-hidden">
                                <Image src={p.images?.[0]?.src || "https://placehold.co/100"} alt={p.name} fill className="object-contain p-1" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-medium text-zinc-800 truncate leading-tight">{p.name}</p>
                                <p className="text-[12px] text-[#be374f] font-semibold mt-0.5">د.أ {p.price}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSend(isAr ? `استفسار عن: ${p.name}` : `Inquiry about: ${p.name}`, {
                                type: "product",
                                id: p.id,
                                name: p.name,
                                price: p.price,
                                image: p.images?.[0]?.src,
                                url: getProductUrl(p),
                                slug: p.slug
                              })}
                              className="w-full h-[26px] bg-brand hover:bg-brand-dark border-brand rounded-md text-[11px] font-medium transition-all"
                            >
                              {isAr ? "إرفاق بطاقة المنتج" : "Attach Product Card"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === "orders" && (
                      <div className="space-y-3">
                        {ordersLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-4 border-zinc-200 border-t-[#febd69] rounded-full animate-spin" />
                          </div>
                        ) : customerOrders.map((order, index) => {
                          const colors = getStatusColors(order.status);
                          return (
                            <div key={order.id || `order-${index}`} className="border border-zinc-200 rounded-md overflow-hidden">
                              <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-2 flex items-center justify-between">
                                <p className="text-[12px] font-medium text-zinc-700">{isAr ? `طلب رقم #${order.id}` : `Order #${order.id}`}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.badge}`}>
                                  {getStatusLabel(order.status, isAr)}
                                </span>
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                  <span className="text-[12px] text-zinc-600">د.أ {parseFloat(order.total || 0).toFixed(2)}</span>
                                </div>
                                <button
                                  onClick={() => handleSend(isAr ? `طلب تحديث حول الطلب #${order.id}` : `Request update for Order #${order.id}`, { type: "order", id: order.id, status: order.status, total: order.total })}
                                  className="w-full h-[28px] bg-brand hover:bg-brand-dark border-brand rounded-md text-[11px] font-medium transition-all"
                                >
                                  {isAr ? "اطلب تحديث هذا الطلب" : "Request order update"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* ── NEW CHAT MODAL ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60" onClick={() => setShowNewChat(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-lg overflow-hidden shadow-2xl border border-zinc-200">
            <div className="p-5 border-b border-zinc-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] font-semibold text-zinc-900">{isAr ? "محادثة جديدة" : "New Conversation"}</h2>
                <button onClick={() => setShowNewChat(false)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 border border-zinc-200 rounded-md">
                  <X size={16} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input
                  type="text"
                  dir={isAr ? "rtl" : "ltr"}
                  placeholder={isAr ? "ابحث عن البائعين…" : "Search sellers…"}
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="w-full h-[34px] pe-9 ps-4 bg-zinc-50 border border-zinc-300 rounded-md text-[13px] outline-none focus:border-[#be374f] transition-all"
                />
              </div>
            </div>
            <div className="h-[360px] overflow-y-auto p-2 bg-white">
              {isSearchingVendors ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-4 border-zinc-200 border-t-[#febd69] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-1">
                  {allVendors.filter((v, i, a) => a.findIndex(t => String(t.id) === String(v.id)) === i).map((v, index) => (
                    <div
                      key={v.id || `vendor-${index}`}
                      onClick={() => { router.push(`/messages?to=${v.id}`); setShowNewChat(false); }}
                      className={`flex items-center gap-3 p-3 rounded-md hover:bg-zinc-50 cursor-pointer group border border-transparent hover:border-zinc-200 transition-all ${v.role === "admin" ? "bg-[#fde7ee]" : ""}`}
                    >
                      <div className="w-10 h-10 rounded-md bg-white border border-zinc-200 shrink-0 relative flex items-center justify-center overflow-hidden">
                        {v.role === "admin"
                          ? <ShieldCheck size={18} className="text-[#be374f]" />
                          : <Image src={v.logo || "https://placehold.co/100"} alt="logo" fill className="object-contain p-1.5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-900 group-hover:text-[#be374f] transition-colors">{v.storeName}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{v.role === "admin" ? (isAr ? "دعم النظام" : "System Support") : (isAr ? "تاجر رسمي" : "Official Seller")}</p>
                      </div>
                      <ChevronRight size={14} className="text-zinc-300 group-hover:text-[#be374f] transition-all group-hover:translate-x-0.5" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxMedia && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightboxMedia(null)}
        >
          {/* Top Controls */}
          <div className="absolute top-0 inset-x-0 p-4 flex justify-end gap-3 z-[1000000] bg-gradient-to-b from-black/50 to-transparent">
            <a
              href={lightboxMedia}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={e => e.stopPropagation()}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors backdrop-blur-md"
              title={isAr ? "فتح في علامة تبويب جديدة" : "Open in new tab"}
            >
              <ArrowRight size={20} className={isAr ? "" : "-rotate-45"} />
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxMedia(null); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors backdrop-blur-md"
              title={isAr ? "إغلاق" : "Close"}
            >
              <X size={24} />
            </button>
          </div>

          {/* Image */}
          <div className="w-full h-full p-4 md:p-12 flex items-center justify-center pointer-events-none">
            <img
              src={lightboxMedia}
              alt="fullscreen media"
              className="max-w-full max-h-full object-contain drop-shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── ATTACHMENT PREVIEW OVERLAY (WHATSAPP STYLE) ── */}
      {selectedFile && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999998] bg-[#0b141a] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="h-16 px-4 flex items-center shrink-0">
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); setFileError(null); setNewMessage(""); }}
              className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 min-h-0 flex items-center justify-center p-4">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
            ) : (
              <div className="w-64 h-64 bg-[#202c33] rounded-2xl flex flex-col items-center justify-center text-zinc-300 shadow-2xl">
                <File size={80} className="mb-6 text-brand" />
                <span className="text-[16px] font-medium text-center px-6 break-all line-clamp-2">{selectedFile.name}</span>
                <span className="text-[14px] text-zinc-500 mt-3">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            )}
          </div>

          {/* Caption Input & Send */}
          <div className="p-4 bg-[#202c33] flex items-center justify-center shrink-0">
            <div className="w-full max-w-3xl flex items-end gap-3">
              <div className="flex-1 bg-[#2a3942] rounded-xl flex items-end gap-2 px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
                <div className="relative shrink-0 mb-0.5">
                  <button onClick={() => setShowEmoji(!showEmoji)} className="text-[#8696a0] hover:text-white transition-colors">
                    <Smile size={26} />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-full start-0 bg-[#2a3942] border border-[#202c33] shadow-xl p-3 grid grid-cols-6 gap-1.5 w-[280px] rounded-lg z-50 mb-4">
                      {ALL_EMOJIS.map(e => (
                        <button key={e} onClick={() => { setNewMessage(p => p + e); setShowEmoji(false); }} className="text-[22px] hover:scale-125 transition-all p-0.5">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  rows={1}
                  dir={newMessage ? "auto" : (isAr ? "rtl" : "ltr")}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (enterToSend && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      } else if (!enterToSend && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSend();
                      }
                    }
                  }}
                  placeholder={isAr ? "إضافة تعليق..." : "Add a caption..."}
                  className="flex-1 bg-transparent border-none text-[15px] text-[#d1d7db] placeholder:text-[#8696a0] outline-none resize-none max-h-[120px] custom-scrollbar py-1"
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={sending}
                className="w-[50px] h-[50px] rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 hover:bg-[#008f6f] transition-colors shadow-lg active:scale-95 disabled:opacity-50"
              >
                {sending ? <Loader2 size={22} className="animate-spin" /> : <Send size={20} className={isAr ? "rotate-180" : "ms-1"} />}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-zinc-200 border-t-[#febd69] rounded-full animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}