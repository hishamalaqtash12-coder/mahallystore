"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Package, Search, PlusCircle, Edit, Trash2, Zap, Star, Eye, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AddProductForm from "@/components/merchant/AddProductForm";
import Loader from "@/components/Loader";

// Utility to decode HTML entities like &amp;
const decodeEntities = (text) => {
  if (!text) return "";
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&ndash;': '-',
    '&mdash;': '—'
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
};

export default function MerchantProductsPage() {
  const { user, wooId, customerName } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [categories, setCategories] = useState([]);

  // Filter States
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("All");

  const fetchProducts = async () => {
    if (!wooId) {
      console.warn("[Merchant Products Page] wooId not yet available, skipping fetch.");
      return;
    }

    try {
      console.log(`[Merchant Products Page] Fetching products for wooId: ${wooId}`);
      const res = await fetch(`/api/merchant/products?wooId=${wooId}`);
      const data = await res.json();
      console.log(`[Merchant Products Page] Received ${Array.isArray(data) ? data.length : 'non-array'} products:`, data);
      // Ensure we always have an array
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch products:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Failed to fetch cats"); }
  };

  useEffect(() => {
    if (wooId) {
      fetchProducts();
      fetchCategories();
    }
  }, [wooId]);

  const handleDelete = async (productId) => {
    const isTrashTab = activeTab === "Trash";
    const confirmMsg = isTrashTab
      ? "Are you sure you want to PERMANENTLY delete this product? This action cannot be undone."
      : "Are you sure you want to move this product to trash?";

    if (!confirm(confirmMsg)) return;

    try {
      if (isTrashTab) {
        // Permanent Delete
        const res = await fetch("/api/merchant/products", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: productId })
        });
        if (res.ok) {
          fetchProducts();
          setSelectedIds(prev => prev.filter(id => id !== productId));
        }
      } else {
        // Move to Trash (Logical update)
        const res = await fetch("/api/merchant/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: productId,
            product: { status: 'trash' },
            wooId
          })
        });
        if (res.ok) {
          fetchProducts();
          setSelectedIds(prev => prev.filter(id => id !== productId));
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleRestore = async (productId) => {
    try {
      const res = await fetch("/api/merchant/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          product: { status: 'publish' },
          wooId
        })
      });
      if (res.ok) {
        fetchProducts();
        setSelectedIds(prev => prev.filter(id => id !== productId));
      }
    } catch (err) {
      console.error("Restore error:", err);
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;

    if (bulkAction === "Delete Permanently") {
      if (!confirm(`Are you sure you want to PERMANENTLY delete ${selectedIds.length} products?`)) return;
      setLoading(true);
      try {
        const res = await fetch("/api/merchant/products", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds })
        });
        if (res.ok) {
          fetchProducts();
          setSelectedIds([]);
          setBulkAction("Bulk actions");
        }
      } catch (err) { console.error("Bulk delete error:", err); }
      finally { setLoading(false); }
    } else if (bulkAction === "Move to Trash" || bulkAction === "Restore") {
      const newStatus = bulkAction === "Restore" ? "publish" : "trash";
      setLoading(true);
      try {
        const promises = selectedIds.map(id =>
          fetch("/api/merchant/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, product: { status: newStatus }, wooId })
          })
        );
        await Promise.all(promises);
        fetchProducts();
        setSelectedIds([]);
        setBulkAction("Bulk actions");
      } catch (err) { console.error("Bulk update error:", err); }
      finally { setLoading(false); }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleFeatured = async (productId, currentStatus) => {
    if (!currentStatus) {
      const existingFeatured = products.find(p => p.featured && p.id !== productId);
      if (existingFeatured) {
        const confirmed = confirm(
          `This merchant already has a featured product: "${existingFeatured.name}".\n\nSelecting this item will remove the current featured product and replace it with the new one. Continue?`
        );
        if (!confirmed) return;

        // Optimistically clear the previous featured product locally
        setProducts(prev => prev.map(p => {
          if (p.id === existingFeatured.id) return { ...p, featured: false };
          if (p.id === productId) return { ...p, featured: true };
          return p;
        }));
      } else {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, featured: true } : p));
      }
    } else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, featured: false } : p));
    }

    try {
      await fetch("/api/merchant/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, product: { featured: !currentStatus }, wooId })
      });
      // Refresh the entire list to sync backend changes (e.g., un-featuring older products)
      fetchProducts();
    } catch (err) {
      // Revert on error
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, featured: currentStatus } : p));
      console.error("Failed to update featured state:", err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  // Safe filtering with defensive checks
  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
    if (!p) return false;

    // Tab Filtering
    if (activeTab === "Published" && p.status !== "publish") return false;
    if (activeTab === "Pending" && p.status !== "pending") return false;
    if (activeTab === "Draft" && p.status !== "draft") return false;
    if (activeTab === "Trash" && p.status !== "trash") return false;
    if (activeTab === "All" && p.status === "trash") return false;

    const matchesSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.type === filterType;
    const matchesStock = filterStatus === "all" || p.stock_status === filterStatus;
    const matchesCat = filterCategory === "all" || p.categories?.some(c => c.id.toString() === filterCategory);

    return matchesSearch && matchesType && matchesStock && matchesCat;
  });

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
      <Loader size="lg" text="Loading products" />
    </div>
  );

  return (
    <div className="space-y-8 font-sans text-zinc-900">
      {showAddForm && (
        <AddProductForm
          user={user}
          productToEdit={editingProduct}
          onClose={() => {
            setShowAddForm(false);
            setEditingProduct(null);
          }}
          onProductAdded={(newProduct) => {
            fetchProducts();
          }}
        />
      )}

      {/* Header with Add New Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Products</h1>
          <p className="text-[13px] text-zinc-500 font-medium">Manage your marketplace listings and stock levels</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="h-[38px] px-6 bg-zinc-900 text-white rounded-md text-[13px] font-bold hover:bg-zinc-800 transition-all shadow-md flex items-center gap-2"
        >
          <PlusCircle size={16} /> Add New Product
        </button>
      </div>

      {/* Top Nav Tabs */}
      <div className="flex items-center gap-1">
        {[
          { label: "All", count: products.filter(p => p.status !== 'trash').length },
          { label: "Published", count: products.filter(p => p.status === 'publish').length },
          { label: "Pending", count: products.filter(p => p.status === 'pending').length },
          { label: "Draft", count: products.filter(p => p.status === 'draft').length },
          { label: "Trash", count: products.filter(p => p.status === 'trash').length },
        ].map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(tab.label)}
            className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-all ${activeTab === tab.label ? 'bg-[#febd69] text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="h-[36px] border border-zinc-300 rounded-md px-3 text-[13px] bg-white outline-none focus:border-[#e77600] shadow-sm"
            >
              <option>Bulk actions</option>
              <option>Edit</option>
              {activeTab === "Trash" ? (
                <>
                  <option>Restore</option>
                  <option>Delete Permanently</option>
                </>
              ) : (
                <option>Move to Trash</option>
              )}
            </select>
            <button
              onClick={handleBulkAction}
              disabled={selectedIds.length === 0}
              className="h-[36px] px-4 bg-zinc-100 text-zinc-700 rounded-md text-[12px] font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              Apply
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-[36px] border border-zinc-300 rounded-md px-3 text-[13px] bg-white outline-none focus:border-[#e77600] shadow-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-[36px] border border-zinc-300 rounded-md px-3 text-[13px] bg-white outline-none focus:border-[#e77600] shadow-sm"
            >
              <option value="all">All Types</option>
              <option value="simple">Simple product</option>
              <option value="variable">Variable product</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-[36px] border border-zinc-300 rounded-md px-3 text-[13px] bg-white outline-none focus:border-[#e77600] shadow-sm"
            >
              <option value="all">All Stock Status</option>
              <option value="instock">In stock</option>
              <option value="outofstock">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[36px] border border-zinc-300 rounded-md pl-9 pr-3 text-[13px] bg-white outline-none focus:border-[#e77600] w-64 shadow-sm"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100/50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    className="accent-[#e77600] w-4 h-4 rounded"
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-2 py-4 w-12 text-center"><ImageIcon size={16} className="text-zinc-400 inline" /></th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Categories</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4 text-center">Featured</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-zinc-50 transition-colors group ${selectedIds.includes(product.id) ? 'bg-orange-50/30' : ''}`}>
                  <td className="px-6 py-5">
                    <input
                      type="checkbox"
                      className="accent-[#e77600] w-4 h-4 rounded"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelectProduct(product.id)}
                    />
                  </td>
                  <td className="px-2 py-5 text-center">
                    <div className="w-[42px] h-[42px] border border-zinc-200 bg-white rounded-md overflow-hidden relative shadow-sm mx-auto">
                      {product.images?.[0]?.src ? (
                        <Image src={product.images[0].src} alt={product.name || "Product"} fill className="object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-50"><Package size={18} className="text-zinc-200" /></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="font-bold text-[#007185] hover:text-[#c45500] text-[14px] text-left leading-tight transition-colors"
                        >
                          {product.name}
                        </button>
                        {product.status !== 'publish' && (
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">— {product.status}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {product.status === 'trash' ? (
                          <>
                            <button onClick={() => handleRestore(product.id)} className="text-[#007185] hover:underline">Restore</button>
                            <span className="text-zinc-200">•</span>
                            <button onClick={() => handleDelete(product.id)} className="text-rose-600 hover:underline">Delete Permanently</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(product)} className="text-[#007185] hover:underline">Edit</button>
                            <span className="text-zinc-200">•</span>
                            <button onClick={() => handleDelete(product.id)} className="text-rose-600 hover:underline">Trash</button>
                            <span className="text-zinc-200">•</span>
                            <Link href={`/product/${product.slug}`} target="_blank" className="text-zinc-400 hover:text-zinc-600">Preview</Link>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[12px] font-medium text-zinc-500">
                    {product.sku || "—"}
                  </td>
                  <td className="px-6 py-5 text-[12px] font-bold text-zinc-600">
                    {product.brands?.map(b => b.name).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded border ${product.stock_status === 'instock' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {product.type === 'variable' ? 'Variable' : (product.stock_status === 'instock' ? `In Stock (${product.stock_quantity || 0})` : 'Out of Stock')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col text-[14px]">
                      <span className="font-bold text-zinc-900 tracking-tight">
                        {product.type === 'variable' ? 'From ' : ''}
                        JOD {parseFloat(product.price || 0).toFixed(2)}
                      </span>
                      {(product.on_sale && parseFloat(product.regular_price || 0) > parseFloat(product.price || 0)) && (
                        <span className="text-[11px] text-zinc-400 line-through font-medium">JOD {parseFloat(product.regular_price).toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {product.categories?.map((c, i) => (
                        <span key={i} className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                          {decodeEntities(c.name)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[13px] font-bold text-zinc-900">
                    {(() => {
                      if (!product.price) return "—";
                      const perProductCommType = product.meta_data?.find(m => m.key === "_per_product_admin_commission_type")?.value;
                      const perProductCommValue = product.meta_data?.find(m => m.key === "_per_product_admin_commission")?.value;
                      const perProductAddFee = product.meta_data?.find(m => m.key === "_per_product_admin_additional_fee")?.value;

                      const productPrice = parseFloat(product.price || 0);

                      const hasOverride = (perProductCommValue !== undefined && perProductCommValue !== null && perProductCommValue !== "") ||
                        (perProductAddFee !== undefined && perProductAddFee !== null && perProductAddFee !== "");

                      if (perProductCommType && hasOverride) {
                        const rate = parseFloat(perProductCommValue || 0);
                        const fee = parseFloat(perProductAddFee || 0);
                        if (perProductCommType === "percentage") {
                          const val = (rate / 100) * productPrice + fee;
                          return `JOD ${val.toFixed(2)} (${rate}%${fee > 0 ? ` + JOD ${fee.toFixed(2)}` : ""})`;
                        } else if (perProductCommType === "fixed") {
                          const val = rate + fee;
                          return `JOD ${val.toFixed(2)} (Fixed)`;
                        }
                      }
                      // Fallback to Dokan global selling options (Fixed JOD 1.00)
                      return "JOD 1.00";
                    })()}
                  </td>
                  <td className="px-6 py-5 text-[13px] font-bold text-[#007185]">
                    {/* Using the store name as requested */}
                    {product.store?.shop_name || product.store?.name || customerName || user?.display_name || user?.displayName || "Mahally Store"}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => toggleFeatured(product.id, product.featured)}
                      className="p-1.5 hover:bg-zinc-100 rounded-full transition-all group/star"
                    >
                      <Star size={18} className={product.featured ? "text-amber-400 fill-amber-400" : "text-zinc-200 group-hover/star:text-amber-400"} />
                    </button>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-[12px] leading-tight">
                      <p className={`font-black uppercase text-[10px] ${product.status === 'publish' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {product.status === 'publish' ? 'Published' : (product.status === 'pending' ? 'Pending Approval' : 'Draft')}
                      </p>
                      <p className="text-zinc-400 font-medium">{new Date(product.date_created || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center text-zinc-400 italic">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-[12px] font-bold text-zinc-400 bg-zinc-50/50">
          <span>{selectedIds.length} items selected</span>
          <span>Total Inventory: {filteredProducts.length} Products</span>
        </div>
      </div>
    </div>
  );
}
