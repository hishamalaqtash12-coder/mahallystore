"use client";

import { useAuth } from "@/context/AuthContext";
import { CreditCard, ShieldCheck, Wallet, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function AccountPaymentsPage() {
   const t = useTranslations("AccountPayments");
   const locale = useLocale();
   const dir = locale === "ar" ? "rtl" : "ltr";
   const { loading } = useAuth();
   if (loading) return null;

   return (
      <div className="w-full" dir={dir}>
         <h2 className="text-2xl font-bold mb-8 text-gray-900">{t("pageTitle")}</h2>

         <div className="grid grid-cols-1 gap-6">
            {/* Active Payment Method: COD */}
            <div className="bg-white border-2 border-emerald-500 rounded-md p-8 relative overflow-hidden shadow-sm">
               <div className="absolute top-0 start-0 w-24 h-24 bg-emerald-50 rounded-bl-[50px] flex items-center justify-end ps-5 pt-5 text-emerald-500">
                  <CheckCircle2 size={32} />
               </div>

               <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600">
                     <Wallet size={32} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-gray-900">{t("codTitle")}</h3>
                     <p className="text-emerald-600 font-bold text-[14px]">{t("activePreferred")}</p>
                  </div>
               </div>

               <p className="text-gray-500 text-[14px] leading-relaxed max-w-md mb-8">
                  {t("codDescription")}
               </p>
            </div>

            {/* Disabled/Future Payment Methods */}
            <div className="bg-gray-50/30 border border-gray-100 rounded-md p-8 opacity-60">
               <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center text-gray-300 border border-gray-100">
                     <CreditCard size={32} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-400">{t("cardTitle")}</h3>
                     <p className="text-[13px] text-gray-400">{t("comingSoon")}</p>
                  </div>
               </div>
               <p className="text-[13px] text-gray-400">{t("cardDescription")}</p>
            </div>
         </div>

         {/* <div className="mt-12 p-8 bg-black text-white rounded-md relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-lg font-bold mb-2">{t("guaranteeTitle")}</h4>
               <p className="text-gray-400 text-[14px] max-w-lg leading-relaxed">
                  {t("guaranteeDescription")}
               </p>
            </div>
            <div className="absolute -bottom-10 -start-10 opacity-10">
               <ShieldCheck size={180} />
            </div>
         </div> */}
      </div>
   );
}