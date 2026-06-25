"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { 
  Package, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Filter,
  Plus
} from "lucide-react";
import { Link } from "@/i18n/routing";

export default function MerchantInventoryPage() {
  const { wooId } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Quick Refill states
  const [refillId, setRefillId] = useState(null);
  const [refillValue, setRefillValue] = useState(0);
  const [updatingStock, setUpdatingStock] = useState(false);

  const fetchStats = async () => {
    if (!wooId) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/merchant/inventory-stats?vendorId=${wooId}`);
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch inventory stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickRefill = async () => {
    if (!refillId) return;
    setUpdatingStock(true);
    try {
      const res = await fetch("/api/merchant/products/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: refillId, stock_quantity: refillValue, wooId })
      });
      if (res.ok) {
        setRefillId(null);
        fetchStats();
      }
    } catch (err) {
      alert("Failed to update stock");
    } finally {
      setUpdatingStock(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [wooId]);

  const filteredStats = stats.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.sku && s.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-brand" />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Inventory & Sales Analytics</h1>
          <p className="text-zinc-500 text-sm">Detailed tracking of stock, orders, and fulfillment performance.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={fetchStats}
             className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-all"
             title="Refresh Data"
           >
             <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
           </button>
           <div className="relative">
             <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" />
             <input 
               type="text"
               placeholder="Search products..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pe-9 ps-4 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-brand w-64"
             />
           </div>
        </div>
      </div>

       {/* Summary Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
         <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
           <div className="flex items-center justify-between mb-2">
             <Package size={20} className="text-blue-500" />
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Products</span>
           </div>
           <p className="text-2xl font-bold text-zinc-900">{stats.length}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
           <div className="flex items-center justify-between mb-2">
             <CheckCircle2 size={20} className="text-emerald-500" />
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Confirmed Sold</span>
           </div>
           <p className="text-2xl font-bold text-zinc-900">{stats.reduce((acc, s) => acc + s.confirmedOrders, 0)}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm border-e-4 border-e-amber-400">
           <div className="flex items-center justify-between mb-2">
             <RefreshCw size={20} className="text-amber-500" />
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pending/On-Hold</span>
           </div>
           <p className="text-2xl font-bold text-zinc-900">{stats.reduce((acc, s) => acc + s.pendingOrders || 0, 0)}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
           <div className="flex items-center justify-between mb-2">
             <XCircle size={20} className="text-rose-500" />
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Canceled Items</span>
           </div>
           <p className="text-2xl font-bold text-zinc-900">{stats.reduce((acc, s) => acc + s.cancelledOrders, 0)}</p>
         </div>
       </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-end border-collapse min-w-[800px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-4 text-[12px] font-bold text-zinc-500 uppercase tracking-wider text-center">Confirmed</th>
                <th className="px-6 py-4 text-[12px] font-bold text-zinc-500 uppercase tracking-wider text-center">Pending</th>
                <th className="px-6 py-4 text-[12px] font-bold text-zinc-500 uppercase tracking-wider text-center">Canceled</th>
                <th className="px-6 py-4 text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStats.map(product => (
                <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900 group-hover:text-brand-dark transition-colors truncate max-w-[200px]">
                        {product.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono mt-0.5">SKU: {product.sku || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-sm font-bold ${product.currentStock <= 5 ? 'text-rose-600' : 'text-zinc-900'}`}>
                              {product.currentStock}
                            </span>
                            <span className="text-[11px] text-zinc-400">units</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setRefillId(product.id); setRefillValue(product.currentStock); }}
                          className="p-1.5 bg-zinc-100 hover:bg-brand-light hover:text-brand-dark rounded-md transition-all text-zinc-500"
                          title="Quick Stock Refill"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="w-24 h-1 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${product.currentStock <= 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min((product.currentStock / 50) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                      {product.confirmedOrders}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                      {product.pendingOrders || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                      {product.cancelledOrders}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      product.stockStatus === 'instock' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {product.stockStatus === 'instock' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStats.length === 0 && (
          <div className="p-12 text-center">
             <AlertCircle size={32} className="mx-auto text-zinc-300 mb-2" />
             <p className="text-zinc-500 text-sm italic">No products matching your search.</p>
          </div>
        )}
      </div>

      {/* QUICK REFILL MODAL */}
      {refillId && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRefillId(null)} />
           <div className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                 <h2 className="text-lg font-bold text-zinc-900 mb-1">Update Stock</h2>
                 <p className="text-xs text-zinc-500 mb-6">Enter the new total stock quantity for this product.</p>
                 
                 <div className="space-y-4">
                    <div className="relative">
                       <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">New Quantity</label>
                       <input 
                         type="number"
                         value={refillValue}
                         onChange={(e) => setRefillValue(parseInt(e.target.value) || 0)}
                         className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-lg font-bold outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                         autoFocus
                       />
                    </div>
                    <div className="flex gap-3 pt-2">
                       <button 
                         onClick={() => setRefillId(null)}
                         className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={handleQuickRefill}
                         disabled={updatingStock}
                         className="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                       >
                         {updatingStock ? <Loader2 size={16} className="animate-spin" /> : "Update Stock"}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
