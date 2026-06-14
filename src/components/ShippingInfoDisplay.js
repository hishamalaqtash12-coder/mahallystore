"use client";

import { useLocation } from "@/context/LocationContext";
import { useEffect, useState } from "react";
import { Truck, Info, MapPin } from "lucide-react";

export default function ShippingInfoDisplay({ vendorId, productPrice, merchantName }) {
  const location = useLocation() || { governorate: "Amman" };
  const { governorate } = location;
  const [shippingData, setShippingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      fetch(`/api/merchant/shipping?vendorId=${vendorId}`)
        .then(r => r.json())
        .then(data => {
          if (data.shippingData) {
            setShippingData(data.shippingData);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [vendorId]);

  if (loading) return (
    <div className="flex items-center gap-2 text-[13px] text-zinc-400 mt-2 animate-pulse">
      <Truck size={16} />
      <span>Calculating delivery for {governorate}...</span>
    </div>
  );

  const govData = shippingData?.[governorate] || { fee: 2.0, free_over: null };
  const isFree = govData.free_over && productPrice >= govData.free_over;
  const fee = isFree ? 0 : govData.fee;

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[13px] font-bold text-zinc-900">
          <Truck size={16} className="text-emerald-600" />
          <span>Delivery to {governorate}</span>
        </div>
        <span className={`text-[13px] font-bold ${fee === 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
          {fee === 0 ? 'FREE' : `JOD ${fee.toFixed(2)}`}
        </span>
      </div>
      
      {govData.free_over && !isFree && (
        <p className="text-[11px] text-zinc-500">
          Add <span className="font-bold text-zinc-700">JOD {(govData.free_over - productPrice).toFixed(2)}</span> more to your order for <span className="font-bold text-emerald-600">FREE delivery</span> in {governorate}.
        </p>
      )}
      
      {isFree && (
        <p className="text-[11px] text-emerald-600 font-medium">
          Your order qualifies for FREE delivery to {governorate}!
        </p>
      )}

      <div className="mt-2 pt-2 border-t border-zinc-200 flex items-center gap-1.5 text-[11px] text-zinc-400">
        <Info size={12} />
        <span>Sold & shipped by {merchantName || "this merchant"}.</span>
      </div>
    </div>
  );
}
