"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Search, Filter, Eye, Clock, CheckCircle, Package, ExternalLink } from "lucide-react";
import OrderDetailsModal from "@/components/merchant/OrderDetailsModal";
import Loader from "@/components/Loader";

export default function MerchantOrdersPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { user, wooId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [vendorProductIds, setVendorProductIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!wooId) return;

    fetch(`/api/merchant/orders?wooId=${wooId}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      }).catch(err => {
        console.error('Failed to fetch orders', err);
        setLoading(false);
      });
  }, [wooId]);

  useEffect(() => {
    if (!wooId) return;

    fetch(`/api/merchant/products?wooId=${wooId}&per_page=100`)
      .then(res => res.json())
      .then(data => {
        const productIds = Array.isArray(data) ? new Set(data.map(p => p.id).filter(Boolean)) : new Set();
        setVendorProductIds(productIds);
      }).catch(err => {
        console.error('Failed to fetch merchant products', err);
        setVendorProductIds(new Set());
      });
  }, [wooId]);

  const enrichedOrders = useMemo(() => {
    const allowDetection = vendorProductIds.size > 0;
    return orders.map(order => {
      const missingProductIds = allowDetection
        ? (order.line_items || []).filter(item => item.product_id && !vendorProductIds.has(item.product_id)).map(item => item.product_id)
        : [];

      return {
        ...order,
        hasMissingInventoryItems: missingProductIds.length > 0,
        missingProductIds
      };
    });
  }, [orders, vendorProductIds]);

  const handleUpdateStatus = (orderId, updatedOrder = {}) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, ...updatedOrder, status: updatedOrder?.status || o.status }
        : o
    ));
  };

  const [statusFilter, setStatusFilter] = useState("all");

  // Trashed/deleted orders should never be manageable — filter them out completely
  const NON_MANAGEABLE_STATUSES = ['trash', 'auto-draft'];

  const filteredOrders = enrichedOrders.filter(o => {
    const matchesSearch = (o.id && o.id.toString().includes(search)) || 
                         (o.billing?.first_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    // Always exclude trashed/deleted orders from view
    const isVisible = !NON_MANAGEABLE_STATUSES.includes(o.status);
    return matchesSearch && matchesStatus && isVisible;
  });

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text={isAr ? 'جارٍ مزامنة الطلبات' : 'Syncing orders'} />
    </div>
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{isAr ? 'الطلبات' : 'Manage Orders'}</h1>
          <p className="text-[13px] text-zinc-500 font-medium">{isAr ? 'تتبع ومعالجة مبيعات العملاء في الوقت الفعلي' : 'Track and process your customer sales in real-time'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder={isAr ? 'ابحث في الطلبات...' : 'Search orders...'} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[36px] bg-white border border-zinc-300 rounded-md pe-9 ps-3 text-[13px] outline-none focus:border-[#be374f] transition-all w-64 shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[36px] pe-9 ps-8 bg-white border border-zinc-300 rounded-md text-[13px] outline-none hover:bg-zinc-50 shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
              <option value="processing">{isAr ? 'قيد المعالجة' : 'Processing'}</option>
              <option value="on-hold">{isAr ? 'معلق' : 'On Hold'}</option>
              <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
              <option value="cancelled">{isAr ? 'ملغى' : 'Cancelled'}</option>
              <option value="refunded">{isAr ? 'مسترجع' : 'Refunded'}</option>
              <option value="failed">{isAr ? 'فشل' : 'Failed'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-end">
            <thead className="bg-zinc-100/50 border-b border-zinc-200">
              <tr className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">{isAr ? 'الطلب' : 'Order ID'}</th>
                <th className="px-6 py-4">{isAr ? 'معلومات المشتري' : 'Buyer Info'}</th>
                <th className="px-6 py-4">{isAr ? 'التفاصيل' : 'Details'}</th>
                <th className="px-6 py-4">{isAr ? 'الدفع والشحن' : 'Payment & Shipping'}</th>
                <th className="px-6 py-4">{isAr ? 'الإجمالي' : 'Order Total'}</th>
                <th className="px-6 py-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4 text-start">{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-zinc-50 transition-colors group ${
                    ['cancelled', 'failed', 'refunded'].includes(order.status) ? 'opacity-70' : ''
                  }`}>
                  <td className="px-6 py-5">
                    <p className="text-[13px] font-bold text-[#be374f] group-hover:text-[#8f2d4a] transition-colors">#ORD-{order.id}</p>
                    <p className="text-[11px] text-zinc-400 font-medium">{new Date(order.date_created).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[14px] font-bold text-zinc-900">{order.billing?.first_name} {order.billing?.last_name}</p>
                    <p className="text-[12px] text-zinc-500 font-medium">{order.billing?.email}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">{order.billing?.phone}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="max-w-[200px] space-y-1">
                      {order.line_items?.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-[12px] text-zinc-600 truncate font-medium">
                          <span className="text-zinc-400">x{item.quantity}</span> {item.name}
                        </p>
                      ))}
                      {order.line_items?.length > 2 && (
                        <p className="text-[10px] text-[#be374f] font-bold">+ {order.line_items.length - 2} more items</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[12px] font-bold text-zinc-700">{order.payment_method_title || "COD"}</p>
                    <p className="text-[11px] text-zinc-400 italic">
                      {order.shipping_lines?.[0]?.method_title || "Standard Shipping"}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[14px] font-bold text-zinc-900">JOD {parseFloat(order.total || 0).toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                       <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border tracking-wider ${
                         order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                         order.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                         order.status === 'on-hold' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                         order.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                         order.status === 'refunded' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                         'bg-rose-50 text-rose-700 border-rose-200'
                       }`}>
                         {isAr ? (
                           order.status === 'pending' ? 'قيد الانتظار' :
                           order.status === 'processing' ? 'قيد المعالجة' :
                           order.status === 'on-hold' ? 'معلق' :
                           order.status === 'completed' ? 'مكتمل' :
                           order.status === 'cancelled' ? 'ملغى' :
                           order.status === 'refunded' ? 'مسترجع' :
                           order.status === 'failed' ? 'فشل' : order.status
                         ) : order.status}
                       </span>
                  </td>
                  <td className="px-6 py-5 text-start">
                     {order.hasMissingInventoryItems ? (
                       <div className="space-y-2">
                         <button 
                           onClick={() => setSelectedOrder(order)}
                           className="h-[32px] px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-300 rounded-md text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 me-auto"
                         >
                           <Eye size={14} /> {isAr ? 'عرض فقط' : 'View Only'}
                         </button>
                         <p className="text-[11px] text-rose-600 font-semibold">{isAr ? 'يحتوي الطلب على منتج غير موجود' : 'Contains removed inventory item'}</p>
                       </div>
                     ) : ['cancelled', 'completed', 'failed', 'refunded'].includes(order.status) ? (
                       <button 
                          onClick={() => setSelectedOrder(order)}
                          className="h-[32px] px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-300 rounded-md text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 me-auto"
                       >
                          <Eye size={14} /> {isAr ? 'عرض فقط' : 'View Only'}
                       </button>
                     ) : (
                       <button 
                          onClick={() => setSelectedOrder(order)}
                          className="h-[32px] px-6 bg-brand hover:bg-brand-dark text-white border-brand rounded-md text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 me-auto"
                       >
                          <Eye size={14} /> {isAr ? 'إدارة' : 'Manage'}
                       </button>
                     )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                   <td colSpan="7" className="px-6 py-20 text-center text-zinc-400 italic">{isAr ? 'لا توجد طلبات مطابقة.' : 'No matching orders found.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
