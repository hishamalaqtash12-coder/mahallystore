"use client";

import { useLocation } from "@/context/LocationContext";
import { useEffect, useState } from "react";
import { Truck, Info, MapPin } from "lucide-react";
import { useLocale } from "next-intl";

const GOVERNORATE_TRANSLATIONS = {
  Amman: { ar: "عمان", en: "Amman" },
  Irbid: { ar: "إربد", en: "Irbid" },
  Zarqa: { ar: "الزرقاء", en: "Zarqa" },
  Aqaba: { ar: "العقبة", en: "Aqaba" },
  Balqa: { ar: "البلقاء", en: "Balqa" },
  Madaba: { ar: "مأدبا", en: "Madaba" },
  Jerash: { ar: "جرش", en: "Jerash" },
  Ajloun: { ar: "عجلون", en: "Ajloun" },
  Mafraq: { ar: "المفرق", en: "Mafraq" },
  Karak: { ar: "الكرك", en: "Karak" },
  Tafilah: { ar: "الطفيلة", en: "Tafilah" },
  "Ma'an": { ar: "معان", en: "Ma'an" },
};

export default function ShippingInfoDisplay({ vendorId, productPrice, merchantName }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const location = useLocation() || { governorate: "Amman" };
  const { governorate } = location;
  const [shippingData, setShippingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const govName = GOVERNORATE_TRANSLATIONS[governorate]?.[locale] || governorate;

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
    } else {
      setLoading(false);
    }
  }, [vendorId]);

  if (loading) return (
    <div className="flex items-center gap-2 text-[12px] text-zinc-400 mt-2 animate-pulse">
      <Truck size={15} />
      <span>{isAr ? `جاري حساب التوصيل إلى ${govName}...` : `Calculating delivery for ${govName}...`}</span>
    </div>
  );

  const govData = shippingData?.[governorate] || { fee: 2.0, free_over: null };
  const isFree = govData.free_over && productPrice >= govData.free_over;
  const fee = isFree ? 0 : govData.fee;

  return (
    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-900">
          <Truck size={16} className="text-emerald-600 shrink-0" />
          <span>{isAr ? `التوصيل إلى ${govName}` : `Delivery to ${govName}`}</span>
        </div>
        <span className={`text-xs font-black ${fee === 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
          {fee === 0 ? (isAr ? 'مجاني' : 'FREE') : `${fee.toFixed(2)} ${isAr ? 'د.أ' : 'JOD'}`}
        </span>
      </div>
      
      {govData.free_over && !isFree && (
        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
          {isAr ? (
            <>أضف بقيمة <span className="font-bold text-zinc-700">{(govData.free_over - productPrice).toFixed(2)} د.أ</span> أخرى لتحصل على <span className="font-bold text-emerald-600">توصيل مجاني</span> إلى {govName}.</>
          ) : (
            <>Add <span className="font-bold text-zinc-700">JOD {(govData.free_over - productPrice).toFixed(2)}</span> more for <span className="font-bold text-emerald-600">FREE delivery</span> to {govName}.</>
          )}
        </p>
      )}
      
      {isFree && (
        <p className="text-[11px] text-emerald-600 font-bold">
          {isAr ? `طلبك مؤهل للحصول على توصيل مجاني إلى ${govName}!` : `Your order qualifies for FREE delivery to ${govName}!`}
        </p>
      )}

      <div className="mt-2 pt-2 border-t border-zinc-200/60 flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
        <Info size={13} className="text-zinc-400 shrink-0" />
        <span>
          {isAr 
            ? `يباع ويُشحن بواسطة ${merchantName || "هذا التاجر"}.` 
            : `Sold & shipped by ${merchantName || "this merchant"}.`}
        </span>
      </div>
    </div>
  );
}
