"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Search, Filter, Eye, Clock, CheckCircle, Package, ExternalLink } from "lucide-react";
import OrderDetailsModal from "@/components/merchant/OrderDetailsModal";
import Loader from "@/components/Loader";

export default function MerchantOrdersPage() {
  const { user, wooId } = useAuth();
  const [orders, setOrders] = useState([]);
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
      });
  }, [wooId]);

  const handleUpdateStatus = (orderId, updatedOrder = {}) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, ...updatedOrder, status: updatedOrder?.status || o.status }
        : o
    ));
  };

  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toString().includes(search) || 
                         o.billing?.first_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Syncing orders" />
    </div>
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Manage Orders</h1>
          <p className="text-[13px] text-zinc-500 font-medium">Track and process your customer sales in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[36px] bg-white border border-zinc-300 rounded-md pl-9 pr-3 text-[13px] outline-none focus:border-[#e77600] transition-all w-64 shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[36px] pl-9 pr-8 bg-white border border-zinc-300 rounded-md text-[13px] outline-none hover:bg-zinc-50 shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-100/50 border-b border-zinc-200">
              <tr className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Buyer Info</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Payment & Shipping</th>
                <th className="px-6 py-4">Order Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="text-[13px] font-bold text-[#007185] group-hover:text-[#c45500] transition-colors">#ORD-{order.id}</p>
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
                        <p className="text-[10px] text-[#007185] font-bold">+ {order.line_items.length - 2} more items</p>
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
                    <p className="text-[14px] font-bold text-zinc-900">JOD {parseFloat(order.total).toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                       <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border tracking-wider ${
                         order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                         order.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                         order.status === 'on-hold' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                         'bg-rose-50 text-rose-700 border-rose-200'
                       }`}>
                         {order.status}
                       </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                     {order.status === 'cancelled' || order.status === 'completed' ? (
                       <button 
                          onClick={() => setSelectedOrder(order)}
                          className="h-[32px] px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-300 rounded-md text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 ml-auto"
                       >
                          <Eye size={14} /> View Details
                       </button>
                     ) : (
                       <button 
                          onClick={() => setSelectedOrder(order)}
                          className="h-[32px] px-6 bg-[#FFD814] hover:bg-[#F7CA00] text-zinc-900 border border-[#FCD200] rounded-md text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 ml-auto"
                       >
                          <Eye size={14} /> Manage
                       </button>
                     )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                   <td colSpan="5" className="px-6 py-20 text-center text-zinc-400 italic">No matching orders found.</td>
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
