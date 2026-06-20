"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingCart, Trash2, ChevronRight } from "lucide-react";

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isVendor } = useAuth();

  if (!isCartOpen || isVendor) return null;

  const cartTotal = cart.reduce((total, item) => total + parseFloat(item.price || 0) * item.quantity, 0);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      {/* 1. DARK BACKDROP */}
      <div
        className="fixed inset-0 bg-black/60 z-[1000] animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* 2. AMAZON-STYLE DRAWER PANEL */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[380px] bg-[#EAEDED] shadow-2xl z-[1001] flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header - Amazon Navy */}
        <div className="bg-[#232f3e] text-white px-5 h-[60px] flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <Link href="/cart" onClick={() => setIsCartOpen(false)} className="hover:text-orange-400 transition-colors">
              <h2 className="text-lg font-bold">سلة التسوق</h2>
            </Link>
            <span className="text-orange-400 font-bold text-sm">({itemCount})</span>
          </div>
          <Link
            href="/cart"
            onClick={() => setIsCartOpen(false)}
            className="ml-auto mr-4 text-[11px] font-bold uppercase tracking-widest text-orange-400 hover:text-white border border-orange-400/30 px-2 py-1 rounded transition-all"
          >
            عرض السلة كاملة
          </Link>
          <button
            onClick={() => setIsCartOpen(false)}
            className="cursor-pointer text-white/70 hover:text-white transition-all hover:rotate-90 touch-target"
          >
            <X size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="bg-white rounded-sm p-8 flex flex-col items-center text-center shadow-sm">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">سلتك فارغة</h3>
              <p className="text-sm text-zinc-500 mb-6">أضف منتجات رائعة من تجارنا المحليين إلى سلتك.</p>
              <Link
                href="/browse"
                onClick={() => setIsCartOpen(false)}
                className="w-full flex items-center justify-center bg-[#be374f] hover:bg-[#8f2d4a] text-white font-bold py-3 rounded-full shadow-lg shadow-[#be374f]/15 transition-all text-sm"
              >
                استمر التسوق
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Items List */}
              <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-zinc-200">
                <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-tight">عناصر السلة</span>
                  <button onClick={clearCart} className="text-[10px] font-bold text-red-600 hover:underline uppercase">حذف الكل</button>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {cart.map((item) => (
                    <li key={`${item.id}-${item.variation_id || '0'}`} className="p-4 flex gap-4 hover:bg-zinc-50 transition-colors">
                      <div className="relative w-20 h-20 bg-white border border-zinc-100 rounded-sm shrink-0 overflow-hidden">
                        <Image src={item.image || "https://placehold.co/100"} alt={item.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[13px] font-bold text-[#be374f] hover:text-[#9b2c41] hover:underline cursor-pointer leading-snug line-clamp-2">{item.name}</h4>
                          <p className="text-sm font-bold text-zinc-900 mt-1">د.أ {parseFloat(item.price || 0).toFixed(2)}</p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Amazon-style Qty Selector */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center bg-[#F0F2F2] border border-[#D5D9D9] rounded-lg shadow-sm">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.variation_id)} className="p-1.5 hover:bg-[#E3E6E6] rounded-l-lg transition-colors touch-target">
                                <Minus size={14} className="text-zinc-600" />
                              </button>
                              <span className="px-3 text-xs font-bold text-zinc-900 border-x border-[#D5D9D9]">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.variation_id)}
                                disabled={item.manage_stock && item.stock_quantity !== null && item.quantity >= item.stock_quantity}
                                className="p-1.5 hover:bg-[#E3E6E6] rounded-r-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-target"
                              >
                                <Plus size={14} className="text-zinc-600" />
                              </button>
                            </div>
                            {item.manage_stock && item.stock_quantity !== null && item.quantity >= item.stock_quantity && (
                              <span className="text-[9px] font-bold text-amber-600 uppercase">وصلت لأقصى كمية</span>
                            )}
                          </div>
                          <button onClick={() => removeFromCart(item.id, item.variation_id)} className="text-[11px] text-[#be374f] hover:text-[#9b2c41] hover:underline font-medium touch-target">
                            حذف
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 3. FOOTER - SUB TOTAL & CHECKOUT */}
        {cart.length > 0 && (
          <div className="bg-white p-5 border-t border-zinc-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">المجموع ({itemCount} عناصر):</span>
              <span className="text-lg font-bold text-[#be374f]">د.أ {cartTotal.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Link
                href={cartTotal >= 10 ? "/checkout" : "/cart"}
                onClick={() => setIsCartOpen(false)}
                className={`flex w-full items-center justify-center h-12 rounded-full font-bold text-[15px] shadow-lg transition-all ${cartTotal >= 10 ? 'bg-[#be374f] text-white hover:bg-[#8f2d4a]' : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'}`}
              >
                {cartTotal >= 10 ? "الدفع والتسوية" : "السلة (أدنى 10 د.أ)"}
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="flex w-full items-center justify-center h-12 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold text-[15px] border border-zinc-200 shadow-sm transition-all"
              >
                الذهاب إلى السلة
              </Link>
            </div>

              <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1">
                <ChevronRight size={10} className="text-zinc-300" /> شحن مجاني لطلبك
              </p>
          </div>
        )}
      </div>
    </>
  );
}
