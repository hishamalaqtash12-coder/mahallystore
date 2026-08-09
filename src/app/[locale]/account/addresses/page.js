"use client";

import { useAuth } from "@/context/AuthContext";
import {
   ChevronRight,
   MapPin,
   ShieldCheck,
   Plus,
   Edit2,
   Trash2,
   Home,
   Briefcase,
   CheckCircle2,
   Info,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import AddressModal from "@/components/AddressModal";
import { useLocale, useTranslations } from "next-intl";

export default function AccountAddressesPage() {
   const t = useTranslations("AccountAddresses");
   const locale = useLocale();
   const dir = locale === "ar" ? "rtl" : "ltr";
   const { billing, shipping, loading } = useAuth();
   const [modalType, setModalType] = useState(null); // 'billing' | 'shipping'
   const [isModalOpen, setIsModalOpen] = useState(false);

   if (loading) return null;

   const hasBilling = billing && billing.address_1;
   const hasShipping = shipping && shipping.address_1;

   const openEdit = (type) => {
      setModalType(type);
      setIsModalOpen(true);
   };

   return (
      <div className="w-full pb-10" dir={dir}>
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  {t("pageTitle")}
               </h2>
               <p className="text-[14px] text-gray-500 mt-1 font-medium">
                  {t("pageSubtitle")}
               </p>
            </div>
            <div className="flex gap-3">
               <button
                  onClick={() => openEdit("billing")}
                  className="h-11 px-6 bg-white border-2 border-gray-100 rounded-md font-bold text-[14px] hover:border-black transition-all flex items-center gap-2"
               >
                  <Plus size={18} />
                  {t("addEditBilling")}
               </button>
               <button
                  onClick={() => openEdit("shipping")}
                  className="h-11 px-6 bg-[#be374f] text-white rounded-md font-bold text-[14px] hover:bg-[#8f2d4a] transition-all flex items-center gap-2 shadow-lg shadow-[#be374f]/15"
               >
                  <Plus size={18} />
                  {t("addEditShipping")}
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Billing Address Card */}
            <div
               className={`relative group p-10 rounded-xl border-2 transition-all duration-300 ${hasBilling
                     ? "bg-white border-gray-100 shadow-sm"
                     : "bg-gray-50/30 border-dashed border-gray-200 flex flex-col items-center justify-center text-center"
                  }`}
            >
               {hasBilling ? (
                  <>
                     <div className="absolute top-6 start-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button
                           onClick={() => openEdit("billing")}
                           className="w-10 h-10 bg-gray-900 text-white rounded-md flex items-center justify-center hover:bg-black transition-all"
                        >
                           <Edit2 size={16} />
                        </button>
                     </div>

                     <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
                           <Briefcase size={22} />
                        </div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-0.5 block">
                              {t("defaultBilling")}
                           </span>
                           <h3 className="text-[18px] font-bold text-gray-900 leading-none">
                              {billing.first_name} {billing.last_name}
                           </h3>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-50">
                           <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                 {t("address")}
                              </span>
                              <p className="text-[14px] font-medium text-gray-700 leading-relaxed">
                                 {billing.address_1}
                                 {billing.address_2 && `, ${billing.address_2}`}
                                 <br />
                                 {billing.city}, {billing.state} {billing.postcode}
                                 <br />
                                 {billing.country}
                              </p>
                           </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-50">
                           <ShieldCheck size={18} className="text-gray-400 shrink-0 mt-0.5" />
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                 {t("contact")}
                              </span>
                              <p className="text-[14px] font-medium text-gray-700">
                                 {billing.phone || t("noPhone")}
                              </p>
                              <p className="text-[14px] font-medium text-gray-700">
                                 {billing.email}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-8 flex items-center gap-2 text-[12px] font-bold text-emerald-600">
                        <CheckCircle2 size={16} />
                        {t("verifiedBilling")}
                     </div>
                  </>
               ) : (
                  <div className="py-12">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6 mx-auto border border-gray-100">
                        <Briefcase size={32} />
                     </div>
                     <h4 className="text-[18px] font-bold text-gray-900 mb-2">
                        {t("noBillingYet")}
                     </h4>
                     <p className="text-gray-500 text-[14px] max-w-xs mx-auto mb-8">
                        {t("noBillingDesc")}
                     </p>
                     <button
                        onClick={() => openEdit("billing")}
                        className="px-10 py-3 bg-black text-white rounded-md font-bold text-[14px] hover:shadow-xl transition-all"
                     >
                        {t("setupBilling")}
                     </button>
                  </div>
               )}
            </div>

            {/* Shipping Address Card */}
            <div
               className={`relative group p-10 rounded-xl border-2 transition-all duration-300 ${hasShipping
                     ? "bg-white border-gray-100 shadow-sm"
                     : "bg-gray-50/30 border-dashed border-gray-200 flex flex-col items-center justify-center text-center"
                  }`}
            >
               {hasShipping ? (
                  <>
                     <div className="absolute top-6 start-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button
                           onClick={() => openEdit("shipping")}
                           className="w-10 h-10 bg-gray-900 text-white rounded-md flex items-center justify-center hover:bg-black transition-all"
                        >
                           <Edit2 size={16} />
                        </button>
                     </div>

                     <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-[#be374f]/5 rounded-md flex items-center justify-center text-[#be374f] border border-[#be374f]/10">
                           <Home size={22} />
                        </div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#be374f] mb-0.5 block">
                              {t("defaultShipping")}
                           </span>
                           <h3 className="text-[18px] font-bold text-gray-900 leading-none">
                              {shipping.first_name} {shipping.last_name}
                           </h3>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-50">
                           <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                 {t("address")}
                              </span>
                              <p className="text-[14px] font-medium text-gray-700 leading-relaxed">
                                 {shipping.address_1}
                                 {shipping.address_2 && `, ${shipping.address_2}`}
                                 <br />
                                 {shipping.city}, {shipping.state} {shipping.postcode}
                                 <br />
                                 {shipping.country}
                              </p>
                           </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-50">
                           <ShieldCheck size={18} className="text-gray-400 shrink-0 mt-0.5" />
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                 {t("contact")}
                              </span>
                              <p className="text-[14px] font-medium text-gray-700">
                                 {shipping.phone || t("noPhone")}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-8 flex items-center gap-2 text-[12px] font-bold text-emerald-600">
                        <CheckCircle2 size={16} />
                        {t("primaryShipping")}
                     </div>
                  </>
               ) : (
                  <div className="py-12">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6 mx-auto border border-gray-100">
                        <Home size={32} />
                     </div>
                     <h4 className="text-[18px] font-bold text-gray-900 mb-2">
                        {t("noShippingYet")}
                     </h4>
                     <p className="text-gray-500 text-[14px] max-w-xs mx-auto mb-8">
                        {t("noShippingDesc")}
                     </p>
                     <button
                        onClick={() => openEdit("shipping")}
                        className="px-10 py-3 bg-[#be374f] text-white rounded-md font-bold text-[14px] hover:shadow-xl transition-all shadow-lg shadow-[#be374f]/15"
                     >
                        {t("addAddress")}
                     </button>
                  </div>
               )}
            </div>
         </div>

         <div className="mt-16 p-8 bg-zinc-900 rounded-xl flex flex-col md:flex-row items-center gap-8 border border-zinc-800">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-[#be374f] shrink-0 border border-zinc-700">
               <ShieldCheck size={32} />
            </div>
            <div className="flex-1 text-center md:text-end">
               <h4 className="font-bold text-white mb-1.5 text-[18px]">
                  {t("privacyTitle")}
               </h4>
               <p className="text-[14px] text-zinc-400 leading-relaxed max-w-2xl">
                  {t("privacyDesc")}
               </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 text-[11px] font-bold uppercase tracking-widest">
               <Info size={14} className="text-[#be374f]" />
               {t("gdprCompliant")}
            </div>
         </div>

         <AddressModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            type={modalType}
            initialData={modalType === "billing" ? billing : shipping}
         />
      </div>
   );
}