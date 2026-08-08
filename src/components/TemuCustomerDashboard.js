"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from "@/i18n/routing";
import Image from 'next/image';
import { getProductUrl } from "@/lib/product-utils";
import { 
  RotateCcw, 
  Star, 
  User, 
  Ticket, 
  Wallet, 
  Store, 
  History, 
  MapPin, 
  Globe, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Bell, 
  PackageSearch,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Edit3,
  Search,
  Plus,
  Trash2,
  ShoppingBag,
  Package,
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import TrackingModal from "@/components/TrackingModal";
import ReviewSubmissionModal from "@/components/ReviewSubmissionModal";
import ReturnRequestModal from "@/components/ReturnRequestModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import UserAvatar from "@/components/UserAvatar";

const STATUS_TABS = {
  "all":      null,
  "processing": ["processing", "on-hold", "pending", "pending payment"],
  "shipped":         ["shipped", "in-transit"],
  "delivered":       ["completed"],
  "returns":         ["refunded"],
};

const TemuCustomerDashboard = ({ user, logout }) => {
  const { wooId, avatarUrl, avatarBgColor } = useAuth();
  
  // Dashboard State
  const [activeSection, setActiveSection] = useState('orders');
  const [activeOrderTab, setActiveOrderTab] = useState('all');
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  
  // Data State
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [recentViews, setRecentViews] = useState([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [reviewedProducts, setReviewedProducts] = useState(new Set());
  const [isProcessingAction, setIsProcessingAction] = useState(null);

  useEffect(() => {
    // Load recently viewed
    const stored = localStorage.getItem("mahally_recently_viewed");
    if (stored) {
      try {
        setRecentViews(JSON.parse(stored));
      } catch (e) {}
    }

    if (user && (wooId || user.email)) {
      setIsLoadingData(true);
      const orderQuery = wooId
        ? `customerId=${wooId}`
        : `email=${encodeURIComponent(user.email)}`;

      // 1. Fetch Orders
      fetch(`/api/orders?${orderQuery}`)
        .then(r => r.json())
        .then(data => { setOrders(Array.isArray(data) ? data : []); })
        .catch(err => console.error("Orders fetch error:", err))
        .finally(() => setIsLoadingData(false));

      // 2. Fetch Reviews
      if (wooId) {
        fetch(`/api/reviews?user_id=${wooId}`)
          .then(r => r.json())
          .then(data => {
            if (data.reviews) {
              setReviews(data.reviews);
              const ids = new Set(data.reviews.map(r => r.product_id));
              setReviewedProducts(ids);
            }
          })
          .catch(() => {});
      }

      // 3. Fetch Coupons
      fetch(`/api/merchant/coupons?wooId=${wooId || '0'}`) // Using merchant API but might need generic customer one later
        .then(r => r.json())
        .then(data => setCoupons(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [user, wooId]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status Tab
    const targets = STATUS_TABS[activeOrderTab];
    if (targets) result = result.filter(o => targets.includes(o.status));

    // Search
    const q = orderSearchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(o =>
        o.id.toString().includes(q) ||
        (o.line_items || []).some(i => i.name?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, activeOrderTab, orderSearchQuery]);

  const handleLogoutClick = async () => {
    await logout();
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setIsProcessingAction(selectedOrder.id);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.id, email: user.email })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: "cancelled" } : o));
        setIsCancelOpen(false);
      }
    } catch (e) {}
    finally { setIsProcessingAction(null); }
  };

  const sidebarItems = [
    { 
      id: 'orders', 
      icon: RotateCcw, 
      label: 'Your orders', 
      expandable: true,
      subItems: [
        { id: 'all', label: 'All orders' },
        { id: 'processing', label: 'Processing' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'delivered', label: 'Delivered' },
        { id: 'returns', label: 'Returns' },
      ]
    },
    { id: 'reviews', icon: Star, label: 'Your reviews' },
    { id: 'profile', icon: User, label: 'Your profile' },
    { id: 'coupons', icon: Ticket, label: 'Coupons & offers' },
    { id: 'balance', icon: Wallet, label: 'Credit balance' },
    { id: 'stores', icon: Store, label: 'Followed stores' },
    { id: 'history', icon: History, label: 'Browsing history' },
    { id: 'addresses', icon: MapPin, label: 'Addresses' },
    { id: 'language', icon: Globe, label: 'Country/Region & Language' },
    { id: 'payments', icon: CreditCard, label: 'Your payment methods' },
    { id: 'security', icon: ShieldCheck, label: 'Account security' },
    { id: 'permissions', icon: Lock, label: 'Permissions' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'orders':
        return (
          <div className="w-full">
            {/* Orders Header Tabs */}
            <div className="flex items-center gap-8 mb-6 border-b border-gray-100 pb-0.5 overflow-x-auto">
              {sidebarItems[0].subItems.map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveOrderTab(tab.id)}
                  className={`pb-3 text-[15px] whitespace-nowrap font-medium relative ${activeOrderTab === tab.id ? 'text-black' : 'text-gray-500'}`}
                >
                  {tab.label}
                  {activeOrderTab === tab.id && <div className="absolute bottom-0 end-0 w-full h-[2px] bg-black"></div>}
                </button>
              ))}
              
              <div className="me-auto relative mb-2">
                <input 
                  type="text" 
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Item name / Order ID / Tracking No." 
                  className="w-72 h-9 bg-gray-50 border border-gray-200 rounded-full pe-4 ps-10 text-[13px] outline-none focus:border-[#be374f] focus:bg-white transition-all" 
                />
                <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>


            {/* List */}
            {isLoadingData ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-100 border-t-[#be374f] rounded-full animate-spin" />
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="bg-gray-50/50 px-6 py-3 flex items-center justify-between border-b border-gray-50 text-[12px] text-gray-500">
                      <div className="flex gap-8">
                        <div>
                          <p className="uppercase tracking-tight mb-0.5">Order Placed</p>
                          <p className="text-gray-900 font-medium">{new Date(order.date_created).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-tight mb-0.5">Total</p>
                          <p className="text-gray-900 font-bold">JOD {parseFloat(order.total).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-tight mb-0.5">Order ID</p>
                          <p className="text-gray-900 font-medium">#{order.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }} className="text-gray-900 hover:text-[#be374f] font-medium flex items-center gap-1">
                          View details
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                       <div className="flex items-center gap-2 mb-6">
                          <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <span className="text-[15px] font-bold capitalize">{order.status}</span>
                       </div>
                       <div className="flex gap-6">
                         <div className="flex-1 space-y-6">
                           {order.line_items?.map((item, idx) => (
                             <div key={idx} className="flex gap-4">
                               <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-50 flex items-center justify-center p-1">
                                 {item.image?.src ? <img src={item.image.src} alt={item.name} className="w-full h-full object-contain" /> : <Package size={24} className="text-gray-200" />}
                               </div>
                               <div className="flex-1">
                                  <Link href={getProductUrl(item)} className="text-[14px] text-gray-800 hover:text-[#be374f] font-medium line-clamp-1 mb-1">{item.name}</Link>
                                  <p className="text-[12px] text-gray-500 mb-2">Qty: {item.quantity}</p>
                                  <div className="flex items-center gap-3">
                                     <button className="h-8 px-4 bg-[#be374f] text-white rounded-full text-[12px] font-bold hover:bg-[#8f2d4a] transition-colors">Buy it again</button>
                                     <button onClick={() => { setSelectedOrder(order); setIsTrackingOpen(true); }} className="h-8 px-4 border border-gray-200 rounded-full text-[12px] font-bold hover:bg-gray-50 transition-colors">Track package</button>
                                  </div>
                               </div>
                             </div>
                           ))}
                         </div>
                         <div className="w-48 border-l border-gray-50 pe-6 space-y-2">
                            <button onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }} className="w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-[13px] font-bold transition-colors">Order details</button>
                            {order.status === 'completed' && (
                              <button onClick={() => { setSelectedOrder(order); setIsReviewOpen(true); }} className="cursor-pointer w-full py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-[13px] font-bold transition-colors">Write a review</button>
                            )}
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl md:shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
                <div className="w-28 h-28 relative flex items-center justify-center mb-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-gray-100" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="20" y="30" width="60" height="45" rx="2" />
                    <path d="M20 40 L80 40" />
                    <path d="M50 30 L50 40" />
                    <path d="M40 50 L60 50" strokeWidth="0.5" />
                    <path d="M45 45 L55 55" strokeWidth="0.5" />
                    <path d="M55 45 L45 55" strokeWidth="0.5" />
                  </svg>
                </div>
                <h2 className="text-[18px] font-bold mb-2">You don't have any orders</h2>
                <p className="text-[14px] text-gray-500 mb-12">Search or browse to start shopping!</p>
                
                <div className="w-full max-w-2xl">
                  <h3 className="text-[16px] font-bold mb-4">Can't find your order?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:border-[#be374f] hover:shadow-md transition-all group cursor-pointer">
                      <div className="flex flex-col gap-4">
                        <span className="text-[14px] text-gray-800 font-medium">Try signing in with another account</span>
                        <div className="flex items-center gap-2">
                           {/* Social icons */}
                           <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                             <svg viewBox="0 0 24 24" className="w-3 h-3"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                           </div>
                           <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                             <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M17.05 20.28c-.96 0-2.04-.6-3.23-.6s-2.27.56-3.23.56c-1.38 0-2.69-.8-3.51-2.22-1.64-2.85-.42-7.06 1.17-9.35.79-1.14 1.73-1.87 2.76-1.87 1.03 0 1.6.54 2.81.54 1.21 0 1.73-.54 2.81-.54 1.03 0 1.91.68 2.64 1.74-.15.09-1.57.91-1.57 2.68 0 2.12 1.73 2.87 1.73 2.87-.01.04-.27.93-.91 1.86-.55.81-1.11 1.61-2.01 1.61zM13.03 5.07c.56-.68.94-1.62.94-2.57 0-.13-.01-.26-.04-.4-.88.04-1.94.59-2.57 1.33-.56.65-.95 1.62-.95 2.53 0 .14.02.27.04.38.97.08 1.96-.54 2.58-1.27z"/></svg>
                           </div>
                           <div className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
                             <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                           </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                    <div className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:border-[#be374f] hover:shadow-md transition-all group cursor-pointer">
                      <span className="text-[14px] text-gray-800 font-medium">Self-service to find order</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'reviews':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-8">Your Reviews</h2>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                        <Package size={24} className="text-gray-200" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-1">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} size={14} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                             ))}
                           </div>
                           <span className="text-[12px] text-gray-400">{new Date(review.date_created).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[15px] font-bold text-gray-900 mb-1">Product ID: {review.product_id}</p>
                        <p className="text-[14px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: review.review }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl md:shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
                 <Star size={48} className="text-gray-100 mb-4" />
                 <h3 className="text-[18px] font-bold mb-2">You haven't added any reviews yet</h3>
                 <p className="text-gray-500">Share your experience with others by reviewing your purchases!</p>
              </div>
            )}
          </div>
        );
      case 'coupons':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-8">Coupons & offers</h2>
            <div className="flex items-center gap-8 border-b border-gray-100 mb-8 pb-1 overflow-x-auto">
              {['Unused', 'Used', 'Expired'].map((tab) => (
                <button key={tab} className={`pb-3 text-[16px] font-medium relative whitespace-nowrap ${tab === 'Unused' ? 'text-black' : 'text-gray-500'}`}>
                  {tab} ({tab === 'Unused' ? coupons.length : 0})
                  {tab === 'Unused' && <div className="absolute bottom-0 end-0 w-full h-[3px] bg-black"></div>}
                </button>
              ))}
            </div>
            {coupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 start-0 w-16 h-16 bg-[#be374f]/5 rounded-bl-full flex items-center justify-end ps-4 pt-4 text-[#be374f]">
                       <Ticket size={24} />
                    </div>
                    <div className="flex flex-col gap-1 mb-4">
                       <span className="text-2xl font-black text-[#be374f]">{coupon.amount}{coupon.discount_type.includes('percent') ? '%' : ' JOD'} OFF</span>
                       <span className="text-[14px] font-bold text-gray-900 uppercase tracking-widest">{coupon.code}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 mb-6 line-clamp-2">{coupon.description || 'Valid on all items storewide.'}</p>
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                       <span className="text-[11px] text-gray-400 font-medium">Expires: {coupon.date_expires ? new Date(coupon.date_expires).toLocaleDateString() : 'Never'}</span>
                       <button className="text-[13px] font-bold text-black hover:text-[#be374f] transition-colors">Apply Coupon</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl md:shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
                 <Ticket size={48} className="text-gray-100 mb-4" />
                 <h3 className="text-[18px] font-bold mb-2">No coupons found</h3>
                 <p className="text-gray-500">Check back later for exclusive deals!</p>
              </div>
            )}
          </div>
        );
      case 'profile':
        return (
          <div className="w-full">
            <div className="flex items-center gap-6 mb-8">
              <UserAvatar 
                user={user}
                avatarUrl={avatarUrl}
                avatarBgColor={avatarBgColor}
                className="w-20 h-20 rounded-full text-3xl font-normal shrink-0"
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{user?.displayName || 'User'}</h2>
                  <Edit3 size={16} className="text-gray-400 cursor-pointer hover:text-black" />
                </div>
                <div className="flex items-center gap-8 text-[14px]">
                  <div className="flex flex-col items-center">
                    <span className="font-bold">{reviews.length}</span>
                    <span className="text-gray-500">Total reviews</span>
                  </div>
                  <div className="w-[1px] h-8 bg-gray-200"></div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold">0</span>
                    <span className="text-gray-500">Helpfuls</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-emerald-600 mb-8 font-medium">
              <ShieldCheck size={16} />
              <span>Your information and privacy will be kept secure and uncompromised.</span>
            </div>
            <div className="bg-white rounded-2xl md:shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center mb-6">
                 <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" strokeWidth="1"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 8h16M4 12h16M4 16h16"/></svg>
              </div>
              <h3 className="text-[18px] font-bold mb-2">Review is empty</h3>
              <p className="text-[14px] text-gray-500 mb-8 text-center max-w-sm">You have no completed reviews or the reviews have been deleted.</p>
              <button onClick={() => setActiveSection('reviews')} className="px-12 py-3 bg-[#be374f] text-white rounded-full font-bold text-[16px] hover:bg-[#8f2d4a] transition-all">
                Go to your reviews
              </button>
            </div>
          </div>
        );
      case 'addresses':
        return (
          <div className="w-full flex flex-col items-center py-12">
            <div className="w-24 h-24 relative mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full text-gray-100" fill="currentColor">
                <path d="M50 0C30.67 0 15 15.67 15 35c0 23.33 35 65 35 65s35-41.67 35-65c0-19.33-15.67-35-35-35zm0 50c-8.28 0-15-6.72-15-15s6.72-15 15-15 15 6.72 15 15-6.72 15-15 15z" />
              </svg>
              <div className="absolute top-1/2 end-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
            </div>
            <h2 className="text-[18px] font-bold mb-2">You don't have any shipping addresses saved</h2>
            <div className="flex items-center gap-2 text-[14px] text-emerald-600 mb-8">
              <ShieldCheck size={16} />
              <span>All data you added will be encrypted</span>
            </div>
            <button className="px-16 py-3 bg-[#be374f] text-white rounded-full font-bold text-[16px] hover:bg-[#8f2d4a] transition-all">
              Add a new address
            </button>
          </div>
        );
      case 'notifications':
        return (
          <div className="w-full">
            <div className="bg-[#e7f5ed] p-4 rounded-lg flex items-center gap-3 mb-8">
              <ShieldCheck size={20} className="text-emerald-600" />
              <p className="text-[14px] text-emerald-800">Temu does not ask customers for additional fees via SMS or email.</p>
            </div>
            <div className="space-y-12">
              {[
                { title: 'Promotions', desc: 'Be the first to learn about promotions, daily deals, and other exclusive savings.', meta: 'On: Email' },
                { title: 'Order updates', desc: 'Receive notifications about order confirmations and shipment updates.', meta: 'On: Email' },
                { title: 'Chat messages', desc: 'Never miss important messages from sellers.', meta: 'On: Email | Off: SMS' },
                { title: 'Customers\' activity', desc: 'Keep up with the latest shopping trends. Showing others\' shopping activities.', meta: 'On: Email' },
                { title: 'Avatar and username sharing', desc: 'Share your user profile avatar and username with other users when you add a product to cart, purchase a product, or participate in a promotion and event, but it won\'t affect your reviews for product.', meta: '' }
              ].map((item) => (
                <div key={item.title} className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 max-w-2xl">
                    <h3 className="text-[18px] font-bold">{item.title}</h3>
                    <p className="text-[14px] text-gray-500 leading-relaxed">{item.desc}</p>
                    {item.meta && <p className="text-[14px] text-gray-400 mt-2 font-medium">{item.meta}</p>}
                  </div>
                  <button className="px-10 py-2 bg-white border border-gray-200 rounded-full text-[14px] font-bold hover:bg-gray-50 transition-all">Edit</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold">Your Browsing History</h2>
               {recentViews.length > 0 && (
                 <button onClick={() => { localStorage.removeItem("mahally_recently_viewed"); setRecentViews([]); }} className="text-[14px] text-gray-500 hover:text-black">Clear all</button>
               )}
            </div>
            {recentViews.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {recentViews.map((item) => (
                  <div key={item.id} className="group relative flex flex-col bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all">
                    <div className="aspect-square relative mb-4 flex items-center justify-center overflow-hidden rounded-lg">
                      {item.image && <Image src={item.image} alt={item.name || "Viewed Item"} fill className="object-contain" />}
                    </div>
                    <h4 className="text-[14px] text-gray-800 line-clamp-2 mb-2 h-10">{item.name}</h4>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold text-[18px]">JOD {item.price}</span>
                      <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer">
                        <ShoppingBag size={18} />
                      </div>
                    </div>
                    <button onClick={() => { const updated = recentViews.filter(p => p.id !== item.id); setRecentViews(updated); localStorage.setItem("mahally_recently_viewed", JSON.stringify(updated)); }} className="absolute top-2 start-2 p-2 text-gray-300 hover:text-rose-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center">
                 <History size={64} className="text-gray-100 mb-6" />
                 <p className="text-gray-500">Your browsing history is empty.</p>
              </div>
            )}
          </div>
        );
      case 'payments':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-8">Your payment methods</h2>
            <div className="bg-white rounded-2xl md:shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
              <div className="w-20 h-12 bg-gray-50 rounded border border-gray-100 flex items-center justify-center mb-6">
                 <CreditCard size={32} className="text-gray-200" />
              </div>
              <h3 className="text-[18px] font-bold mb-2">No payment methods saved</h3>
              <p className="text-[14px] text-gray-500 mb-8 text-center max-w-sm">Add a credit or debit card for faster checkout.</p>
              <button className="px-12 py-3 bg-black text-white rounded-full font-bold text-[16px] hover:bg-gray-800 transition-all flex items-center gap-2">
                <Plus size={20} />
                Add a card
              </button>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-8">Country/Region & Language</h2>
            <div className="bg-white rounded-2xl md:shadow-sm border border-gray-100 p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[16px] font-bold">Country/Region</h4>
                  <p className="text-[14px] text-gray-500">Jordan</p>
                </div>
                <button className="px-6 py-2 border border-gray-200 rounded-full text-[14px] font-bold hover:bg-gray-50 transition-all">Change</button>
              </div>
              <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                <div>
                  <h4 className="text-[16px] font-bold">Language</h4>
                  <p className="text-[14px] text-gray-500">English</p>
                </div>
                <button className="px-6 py-2 border border-gray-200 rounded-full text-[14px] font-bold hover:bg-gray-50 transition-all">Change</button>
              </div>
              <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                <div>
                  <h4 className="text-[16px] font-bold">Currency</h4>
                  <p className="text-[14px] text-gray-500">JOD (Jordanian Dinar)</p>
                </div>
                <button className="px-6 py-2 border border-gray-200 rounded-full text-[14px] font-bold hover:bg-gray-50 transition-all">Change</button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400">
             <PackageSearch size={64} className="mb-4 opacity-20" />
             <p>This section is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col md:flex-row font-sans text-[#222]">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white md:min-h-screen border-r border-gray-100 py-6 px-4 shrink-0 sticky top-0 h-fit">
        <div className="mb-8 px-3">
          <div className="flex items-center gap-3 mb-6">
            <UserAvatar 
              user={user}
              avatarUrl={avatarUrl}
              avatarBgColor={avatarBgColor}
              className="w-12 h-12 rounded-full text-lg font-normal shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[16px] font-bold leading-tight">{user?.displayName || 'User'}</span>
              <span className="text-[12px] text-gray-500">View profile</span>
            </div>
          </div>
        </div>
        <nav className="space-y-0.5">
          {sidebarItems.map((item) => (
            <div key={item.id}>
              <button 
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.expandable) setIsOrdersExpanded(!isOrdersExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-[14px] transition-colors group ${activeSection === item.id && !item.expandable ? 'bg-[#f4f4f4] font-bold' : 'hover:bg-gray-50 font-normal'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={activeSection === item.id ? 'text-black' : 'text-gray-500 group-hover:text-black'} strokeWidth={activeSection === item.id ? 2 : 1.2} />
                  <span>{item.label}</span>
                </div>
                {item.expandable && (
                  isOrdersExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              
              {item.expandable && isOrdersExpanded && (
                <div className="me-9 mt-1 space-y-1 mb-2">
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveSection('orders');
                        setActiveOrderTab(sub.id);
                      }}
                      className={`w-full text-end px-3 py-2 rounded-lg text-[13.5px] transition-colors ${activeSection === 'orders' && activeOrderTab === sub.id ? 'text-[#be374f] font-bold bg-[#be374f]/5' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <button 
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] text-rose-600 font-normal hover:bg-rose-50 transition-colors group"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white md:bg-[#f9f9f9] p-6 md:p-12 lg:px-8 lg:py-16 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-6xl">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-8 font-medium">
             <Link href="/" className="hover:text-black">Home</Link>
             <ChevronRight size={12} />
             {activeSection === 'orders' && activeOrderTab !== 'all' ? (
               <>
                 <button onClick={() => setActiveOrderTab('all')} className="hover:text-black">Your orders</button>
                 <ChevronRight size={12} />
                 <span className="text-black capitalize">{activeOrderTab}</span>
               </>
             ) : (
               <span className="text-black">{sidebarItems.find(i => i.id === activeSection)?.label}</span>
             )}
          </div>

          <div className="min-h-[600px]">
            {renderSectionContent()}
          </div>
        </div>
      </main>

      {/* Action Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
      <TrackingModal
        order={selectedOrder}
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />
      <ReviewSubmissionModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        order={selectedOrder}
        user={user}
        userId={wooId}
        reviewedProducts={[...reviewedProducts]}
        onReviewSubmitted={(productId) => setReviewedProducts(prev => new Set([...prev, productId]))}
      />
      <ReturnRequestModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        order={selectedOrder}
        user={user}
        onSubmitted={() => {}}
      />
      <ConfirmationModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Order?"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        type="danger"
        isLoading={isProcessingAction === selectedOrder?.id}
      />

    </div>
  );
};

export default TemuCustomerDashboard;
