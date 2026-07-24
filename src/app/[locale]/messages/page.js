"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import {
  Send, Search, Loader2, ShieldCheck, BadgeCheck, Paperclip,
  Smile, Trash2, Reply, X, RefreshCw, ArrowLeft, Info,
  CheckCircle2, MessageCircle, Plus, ArrowRight, ShieldAlert,
  SendHorizontal, File, AlertCircle, Store, ShoppingBag,
  ChevronRight, Package
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const ALL_EMOJIS = ["😊", "😂", "❤️", "👍", "🙏", "🔥", "✨", "🙌", "😍", "🤔", "😎", "🚀", "😢", "😅", "🥳", "😤", "🫡", "💯", "👀", "🎉", "😬", "🤝", "💪", "🫶", "😮", "🥰", "😑", "🙃", "😏", "🤩", "😴", "🫠", "👏", "🌟", "💀", "🤯"];

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  const [vendor, setVendor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(searchParams.get("msg") || "");
  const msgParam = searchParams.get("msg");
  const [loading, setLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshingConvs, setRefreshingConvs] = useState(false);
  const [refreshingMsgs, setRefreshingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [enterToSend, setEnterToSend] = useState(true);

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
  const isSendingRef = useRef(false);

  const scrollToBottom = (behavior = "smooth") => {
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
      setMessages(data.messages || []);
      localStorage.setItem(`mahally_read_${wooId}_${vId}`, Date.now().toString());
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
      if (!vendorSearch) {
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
    if (!user) { router.push("/login?redirect=/messages"); return; }
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, [user, authLoading, wooId]);

  useEffect(() => {
    if (!vendorId || !wooId) return;
    if (String(vendorId) === String(wooId)) { router.push("/messages"); return; }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    }
  };

  const handleSend = async (text = newMessage, customMeta = null) => {
    if ((!text.trim() && !customMeta && !selectedFile) || !vendorId) return;
    
    isSendingRef.current = true;
    setSending(true);

    let mediaUrl = null, mediaType = null;
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const res = await fetch("/api/merchant/media", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) { mediaUrl = data.url; mediaType = selectedFile.type.startsWith("image/") ? "image" : "file"; }
      } catch (err) { console.error("Upload failed", err); }
    }

    const tempMsg = {
      id: Date.now(), senderId: wooId, text, customMeta, mediaUrl, mediaType,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage(""); setReplyTo(null); setSelectedFile(null); setPreviewUrl(null);

    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: wooId, toId: vendorId, text: tempMsg.text,
          mediaUrl: tempMsg.mediaUrl, mediaType: tempMsg.mediaType,
          customMeta: tempMsg.customMeta, replyTo: tempMsg.replyTo,
          locale: locale || "ar"
        }),
      });
      // Short delay to ensure backend committed
      await new Promise(r => setTimeout(r, 400));
    } catch { } finally {
      isSendingRef.current = false;
      setSending(false);
      // Fetch fresh messages now that sending lock is lifted
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
    <div className="mx-auto w-full h-[calc(100vh-140px)] bg-white flex font-sans text-zinc-900 border-x border-b border-zinc-200 shadow-sm overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className={`${vendorId ? "hidden lg:flex" : "flex"} w-full lg:w-[300px] bg-white border-r border-zinc-200 flex-col shrink-0`}>

        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[18px] font-semibold text-zinc-900 flex items-center gap-2">
              <MessageCircle size={18} className="text-[#be374f]" />
              {isAr ? "الرسائل" : "Messages"}
            </h1>
            <div className="flex gap-1.5">
              <button
                onClick={async () => { setRefreshingConvs(true); await fetchData(); setRefreshingConvs(false); }}
                className={`w-8 h-8 border border-zinc-200 rounded-md flex items-center justify-center text-zinc-500 hover:border-[#be374f] hover:text-[#be374f] transition-all ${refreshingConvs ? "animate-spin text-[#be374f]" : ""}`}
                title={isAr ? "تحديث المحادثات" : "Refresh conversations"}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-8 h-8 border border-zinc-300 rounded-md flex items-center justify-center text-zinc-600 hover:bg-brand-light hover:border-brand transition-all shadow-sm"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder={isAr ? "ابحث في المحادثات…" : "Search conversations…"}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-[31px] pe-9 ps-3 bg-zinc-50 border border-zinc-300 rounded-md text-[13px] outline-none focus:border-[#be374f] transition-all"
            />
          </div>
          <div className="flex items-center mt-3 px-0.5 select-none">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                showUnreadOnly 
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
          {!isAdmin && String(wooId) !== "1" && (!showUnreadOnly || adminUnreadCount > 0) && (
            <div
              onClick={() => router.push("/messages?to=1")}
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
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#be374f] text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse shrink-0 me-2">
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
            
            return uniqueList
              .filter(c => {
                if (String(c.id) === String(wooId)) return false;
                // If the pinned support thread is shown, exclude it from the Recent list to prevent duplicate listing
                const isPinnedSupportShown = !isAdmin && String(wooId) !== "1";
                if (isPinnedSupportShown && (String(c.id) === "1" || String(c.id) === "admin")) return false;
                return true;
              })
              .filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(c => !showUnreadOnly || (c.unreadCount && c.unreadCount > 0) || String(c.id) === String(vendorId))
              .map((conv, index) => {
                const isActive = String(conv.id) === String(vendorId);
                return (
                  <div
                    key={conv.id || `conv-${index}`}
                    onClick={() => router.push(`/messages?to=${conv.id}`)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all border ${isActive ? "bg-[#fde7ee] border-[#b2d8dc]" : "border-transparent hover:bg-zinc-50 hover:border-zinc-200"}`}
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
                        <p className={`text-[13px] font-medium truncate ${isActive ? "text-[#be374f]" : "text-zinc-900"}`}>{conv.name}</p>
                        <span className="text-[11px] text-zinc-400 shrink-0 me-2">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-[12px] truncate ${conv.unreadCount > 0 && !isActive ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
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
                  <ArrowLeft size={20} />
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[11px] text-emerald-600">{isAr ? "نشط الآن" : "Active now"}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => { setRefreshingMsgs(true); await fetchMessages(vendorId); setRefreshingMsgs(false); }}
                  className={`w-8 h-8 border border-zinc-200 rounded-md flex items-center justify-center text-zinc-500 hover:text-[#be374f] transition-all ${refreshingMsgs ? "animate-spin" : ""}`}
                  title={isAr ? "تحديث الرسائل" : "Refresh messages"}
                >
                  <RefreshCw size={15} />
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
            <div className="chat-background flex-1 overflow-y-auto px-5 py-5 bg-zinc-50 space-y-3 relative">
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
                      <div key={msg.id || `msg-${index}`} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative`}>
                        <span className="text-[10px] text-zinc-400 mb-1 px-1 font-semibold select-none">
                          {senderLabel}
                        </span>
                        <div
                          onClick={() => setSelectedMessageId(isSelected ? null : msg.id)}
                          className={`message-bubble-wrapper max-w-[75%] lg:max-w-[65%] px-4 py-2.5 rounded-lg text-[13px] leading-relaxed border relative transition-all ${isSelected ? "ring-2 ring-[#be374f] ring-offset-1" : ""
                            } ${isMe ? "bg-[#be374f] text-white border-[#be374f]" : "bg-white text-zinc-800 border-zinc-200 shadow-sm"}`}
                        >
                          {msg.replyTo && (
                            <div className={`mb-2 p-2 border-e-2 text-[11px] rounded-sm ${isMe ? "border-white/40 bg-white/10 text-white/60" : "border-[#be374f] bg-zinc-50 text-zinc-500"}`}>
                              ↩ {msg.replyTo.text}
                            </div>
                          )}

                          <p className={`whitespace-pre-wrap ${msg.isDeleted ? "italic text-zinc-400" : ""}`}>
                            {msg.isDeleted ? msg.text : formatMessageText(msg.text, isMe)}
                          </p>

                          {msg.mediaUrl && !msg.isDeleted && (
                            <div className="mt-2 rounded-md overflow-hidden border border-white/20">
                              {msg.mediaType === "image"
                                ? <img src={msg.mediaUrl} alt="media" className="max-w-full h-auto" />
                                : <div className="flex items-center gap-2 p-2.5 text-[12px]"><File size={14} /><span>{isAr ? "عرض المستند" : "View Document"}</span></div>
                              }
                            </div>
                          )}

                          {msg.customMeta?.type === "product" && !msg.isDeleted && (
                            <div className={`mt-2 p-2.5 rounded-md border flex gap-2.5 ${isMe ? "bg-white/10 border-white/20" : "bg-zinc-50 border-zinc-200"}`}>
                              <div className="w-10 h-10 bg-white rounded-md shrink-0 overflow-hidden relative border border-zinc-100">
                                <Image src={msg.customMeta.image || "https://placehold.co/100"} alt="product" fill className="object-contain p-1" />
                              </div>
                              <div>
                                <p className="text-[12px] font-medium leading-tight">{msg.customMeta.name}</p>
                                <p className={`text-[12px] font-semibold mt-0.5 ${isMe ? "text-white" : "text-[#be374f]"}`}>د.أ {msg.customMeta.price}</p>
                              </div>
                            </div>
                          )}

                          <div className={`flex items-center gap-1 mt-1.5 justify-end ${isMe ? "text-white/40" : "text-zinc-400"}`}>
                            <span className="text-[10px]">{msg.time}</span>
                            {isMe && <CheckCircle2 size={10} />}
                          </div>

                          {msg.reaction && !msg.isDeleted && (
                            <div className="absolute -bottom-2 -start-2 bg-white shadow border border-zinc-100 px-1.5 py-0.5 rounded-full text-[12px]">{msg.reaction}</div>
                          )}

                          {/* Action Dock */}
                          {!msg.isDeleted && (
                            <div className={`absolute -top-9 ${isMe ? "start-0" : "end-0"} flex gap-1 bg-white border border-zinc-200 p-1 shadow-md rounded-md z-50 transition-all ${isSelected ? "opacity-100 visible" : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"}`}>
                              <button onClick={(e) => { e.stopPropagation(); setReplyTo(msg); setSelectedMessageId(null); }} className="w-7 h-7 hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-[#be374f] rounded transition-all" title={isAr ? "الرد" : "Reply"}>
                                <Reply size={13} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id); }} className="w-7 h-7 hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-[#be374f] rounded transition-all" title={isAr ? "تفاعل" : "React"}>
                                <Smile size={13} />
                              </button>
                              {isMe && (
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }} className="w-7 h-7 hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-500 rounded transition-all" title={isAr ? "حذف" : "Delete"}>
                                  <Trash2 size={13} />
                                </button>
                              )}
                              {showReactionPicker === msg.id && (
                                <div className="absolute bottom-full mb-1 end-0 bg-white border border-zinc-200 shadow-xl p-1.5 flex gap-1 rounded-md z-[70]" onClick={e => e.stopPropagation()}>
                                  {REACTION_EMOJIS.map(e => (
                                    <button key={e} onClick={() => handleReact(msg, e)} className="text-[16px] hover:scale-125 transition-all p-0.5">{e}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
              </>
            </div>

            {/* Compose */}
            <div className="px-5 py-3 border-t border-zinc-200 bg-white shrink-0">
              {replyTo && (
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border border-b-0 border-zinc-200 rounded-t-md">
                  <span className="text-[12px] text-zinc-500 flex items-center gap-1.5">
                    <Reply size={12} /> {isAr ? "الرد على:" : "Replying to:"} <span className="text-zinc-700 truncate max-w-xs">{replyTo.text}</span>
                  </span>
                  <button onClick={() => setReplyTo(null)} className="text-zinc-400 hover:text-rose-500"><X size={14} /></button>
                </div>
              )}
              {selectedFile && (
                <div className="flex items-center justify-between px-3 py-2 bg-[#fde7ee] border border-b-0 border-[#b2d8dc] rounded-t-md">
                  <div className="flex items-center gap-2">
                    {previewUrl
                      ? <img src={previewUrl} className="w-7 h-7 object-cover rounded border border-white" alt="preview" />
                      : <File size={14} className="text-[#be374f]" />
                    }
                    <span className="text-[12px] text-[#be374f] truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="text-zinc-400 hover:text-rose-500"><X size={14} /></button>
                </div>
              )}
              <div className={`flex items-end gap-2 bg-zinc-50 border border-zinc-300 px-2 py-1.5 ${replyTo || selectedFile ? "rounded-b-md" : "rounded-md"}`}>
                <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#be374f] transition-colors">
                  <Paperclip size={16} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                <div className="relative shrink-0" ref={emojiRef}>
                  <button onClick={() => setShowEmoji(!showEmoji)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#be374f] transition-colors">
                    <Smile size={16} />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-full end-0 bg-white border border-zinc-200 shadow-xl p-3 grid grid-cols-6 gap-1.5 w-[240px] rounded-md z-50">
                      {ALL_EMOJIS.map(e => (
                        <button key={e} onClick={() => { setNewMessage(p => p + e); setShowEmoji(false); }} className="text-[20px] hover:scale-125 transition-all p-0.5">{e}</button>
                      ))}
                    </div>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  dir="auto"
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
                  className="flex-1 bg-transparent border-none py-1.5 px-1 text-[13px] outline-none resize-none text-zinc-800 placeholder:text-zinc-400 custom-scrollbar"
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
        <aside className="hidden xl:flex w-[260px] bg-white border-l border-zinc-200 flex-col shrink-0">
          {/* Tabs */}
          <div className={`flex border-b border-zinc-200 h-[56px] items-end px-4 shrink-0`}>
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
                  <p className="text-[12px] text-zinc-500 text-center leading-relaxed">{isAr ? "معالجة النزاعات في الطلبات والمشكلات التقنية وإعداد التجار في المنصة." : "Handles order disputes, technical issues, and merchant onboarding on the platform."}</p>
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
                          <button
                            onClick={() => window.open(`https://wa.me/${vendor?.phone || "962770000000"}`, "_blank")}
                            className="w-full h-[31px] bg-zinc-50 border border-zinc-300 rounded-md text-[12px] font-medium text-zinc-600 flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all"
                          >
                            WhatsApp
                          </button>
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
                    {productsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-4 border-zinc-200 border-t-[#febd69] rounded-full animate-spin" />
                      </div>
                    ) : vendorProducts.map((p, index) => (
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
                          onClick={() => handleSend(isAr ? `استفسار عن: ${p.name}` : `Inquiry about: ${p.name}`, { type: "product", id: p.id, name: p.name, price: p.price, image: p.images?.[0]?.src })}
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