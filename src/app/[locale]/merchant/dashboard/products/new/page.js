"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  ChevronRight, 
  Info,
  DollarSign,
  Tag,
  Layout,
  ImageIcon,
  Loader2,
  CheckCircle
} from "lucide-react";
import { createProduct, getCategories } from "@/lib/woocommerce";

export default function NewProduct() {
  const { isAdmin, email, phone, customerName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAdmin) {
      router.replace("/admin/inventory");
    }
  }, [isAdmin, router]);

  const [isAiImproving, setIsAiImproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCats();
  }, []);

  const handleAiEnhance = async () => {
    if (!description || description.length < 10) {
      alert("Please enter a short description first so the AI can enhance it.");
      return;
    }
    
    setIsAiImproving(true);
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, name })
      });
      const data = await res.json();
      if (data.enhanced) {
        setDescription(data.enhanced);
      }
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsAiImproving(false);
    }
  };

  const handleSubmit = async (status = "publish") => {
    if (!name || !salePrice) {
      setError("Please fill in the product name and price.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const productData = {
        name,
        description,
        regular_price: regularPrice || salePrice,
        sale_price: salePrice,
        status,
        categories: categoryId ? [{ id: parseInt(categoryId) }] : [],
        meta_data: [
          { key: "merchant_email", value: email || "" },
          { key: "merchant_phone", value: phone || "" },
          { key: "merchant_name", value: customerName || "Merchant User" }
        ]
      };

      await createProduct(productData);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/merchant/dashboard/products";
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100/50">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-black text-zinc-900 mb-2">Product Published!</h2>
        <p className="text-zinc-500 font-medium">Your listing is now live on Mahally Jordan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 text-left">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/merchant/dashboard/products" 
          className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Add New Product</h1>
          <p className="text-zinc-500 text-xs font-medium">Create a new listing for your store in Jordan.</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
          <Info size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info size={18} className="text-brand" />
              General Information
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Product Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Handmade Ceramic Vase" 
                className="w-full h-12 px-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm" 
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <button 
                  type="button"
                  onClick={handleAiEnhance}
                  disabled={isAiImproving}
                  className="flex items-center gap-1.5 text-[10px] font-black text-brand bg-brand/5 px-2.5 py-1 rounded-full hover:bg-brand/10 transition-all group disabled:opacity-50"
                >
                  <Sparkles size={12} className={isAiImproving ? "animate-spin" : ""} />
                  {isAiImproving ? "Improving with AI..." : "Enhance with AI"}
                </button>
              </div>
              <textarea 
                rows={6} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product in detail..." 
                className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm resize-none"
              ></textarea>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Tag size={18} className="text-brand" />
              Pricing & Categories
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sale Price (JOD)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00" 
                    className="w-full h-12 pl-10 pr-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-black" 
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">JOD</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Regular Price (Optional)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    placeholder="0.00" 
                    className="w-full h-12 pl-10 pr-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-black opacity-60" 
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">JOD</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Category</label>
              <select 
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-12 px-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-medium"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </section>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon size={18} className="text-brand" />
              Product Image
            </h3>
            <div className="aspect-square rounded-3xl border-2 border-dashed border-zinc-100 bg-zinc-50 flex flex-col items-center justify-center text-center p-6 group hover:border-brand/30 hover:bg-brand/5 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-zinc-400 mb-4 group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <p className="text-xs font-bold text-zinc-500">Upload product photo</p>
              <p className="text-[10px] text-zinc-400 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </section>

          <div className="space-y-4">
            <button 
              onClick={() => handleSubmit("publish")}
              disabled={isSubmitting}
              className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Publish Product"}
            </button>
            <button 
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="w-full h-14 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-50 transition-all disabled:opacity-50"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
