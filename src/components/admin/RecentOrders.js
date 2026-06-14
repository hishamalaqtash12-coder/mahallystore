"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Loader2, Package } from "lucide-react";

function OrderRow({ order }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "processing": return "bg-blue-50 text-blue-700 border-blue-100";
      case "shipped": return "bg-violet-50 text-violet-700 border-violet-100";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-100";
    }
  };

  return (
    <Link
      href={`/admin/orders`}
      className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900">
          #{order.id.replace("ORD-", "")}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {order.customer}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-zinc-900">
          {order.total}
        </p>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>
    </Link>
  );
}

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/orders?per_page=5");
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
      } catch (e) {
        console.error("Failed to fetch recent orders:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentOrders();
  }, []);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-full">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <h2 className="font-semibold text-zinc-900">Recent Orders</h2>
        <Link
          href="/admin/orders"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
            <p className="text-xs text-zinc-400">Loading orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50">
              <ShoppingCart className="h-5 w-5 text-zinc-300" />
            </div>
            <p className="text-sm text-zinc-500">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
