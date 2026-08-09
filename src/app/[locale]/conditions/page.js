"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, RefreshCcw, Store, Scale } from "lucide-react";

export default function ConditionsPage() {
   const t = useTranslations("Conditions");
   const locale = useLocale();
   const dir = locale === "ar" ? "rtl" : "ltr";
   const isAr = locale === "ar";

   return (
      <div className="min-h-screen bg-[#F6F6F6] font-sans pb-24" dir={dir}>

         {/* Header Area */}
         <div className="bg-brand-dark text-white py-10 px-4">
            <div className="max-w-[800px] mx-auto">
               <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors mb-6 text-sm font-medium"
               >
                  {isAr ? (
                     <>
                        {t("backToHome")}
                        <ArrowRight size={16} />
                     </>
                  ) : (
                     <>
                        <ArrowLeft size={16} />
                        {t("backToHome")}
                     </>
                  )}
               </Link>

               <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {t("title")}
               </h1>
               <p className="text-zinc-400 text-lg">{t("lastUpdated")}</p>
            </div>
         </div>

         <div className="max-w-[800px] mx-auto px-4 mt-[-20px] relative z-10">

            {/* Consent Message Box */}
            <div className={`bg-white rounded-xl p-8 shadow-sm border border-zinc-200 mb-8 ${isAr ? "border-s-4 border-s-brand" : "border-e-4 border-e-brand"}`}>
               <div className="flex items-start gap-4 mb-4">
                  <ShieldCheck size={28} className="text-brand shrink-0 mt-1" />
                  <div>
                     <h2 className="text-xl font-bold text-zinc-900 mb-2">{t("consentTitle")}</h2>
                     <p className="text-zinc-600 mb-4">{t("consentIntro")}</p>
                     <ul className={`list-disc space-y-1 text-zinc-700 font-medium mb-6 ${isAr ? "ps-5" : "pe-5"}`}>
                        <li>{t("returnPolicy")}</li>
                        <li>{t("sellerAgreementMerchants")}</li>
                        <li>{t("termsOfUse")}</li>
                     </ul>
                     <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg text-green-800">
                        <CheckCircle2 size={24} className="text-green-600 shrink-0" />
                        <p className="text-sm font-medium leading-relaxed">
                           {t("consentConfirm")}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Return Policy */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200 mb-8">
               <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                     <RefreshCcw size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">{t("returnPolicy")}</h2>
               </div>

               <ul className="space-y-4 text-zinc-600">
                  <li className="flex items-start gap-3">
                     <span className="text-brand mt-1">•</span>
                     <span>{t("return1")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="text-brand mt-1">•</span>
                     <span>{t("return2")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="text-brand mt-1">•</span>
                     <span>{t("return3")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="text-brand mt-1">•</span>
                     <span>{t("return4")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="text-brand mt-1">•</span>
                     <span>{t("return5")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="text-brand mt-1">•</span>
                     <span>{t("return6")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="text-brand mt-1">•</span>
                     <span>{t("return7")}</span>
                  </li>
               </ul>
            </div>

            {/* Seller Agreement */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200 mb-8">
               <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                  <div className="p-2 bg-brand-light text-orange-600 rounded-lg">
                     <Store size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">{t("sellerAgreement")}</h2>
               </div>

               <div className="space-y-8">
                  <div>
                     <h3 className="text-lg font-bold text-zinc-800 mb-3">{t("sellerObligations")}</h3>
                     <ul className="space-y-3 text-zinc-600">
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("seller1")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("seller2")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("seller3")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("seller4")}</span>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-zinc-800 mb-3">{t("legalResponsibilities")}</h3>
                     <ul className="space-y-3 text-zinc-600">
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("legal1")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("legal2")}</span>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-zinc-800 mb-3">{t("platformRights")}</h3>
                     <ul className="space-y-3 text-zinc-600">
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("platform1")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("platform2")}</span>
                        </li>
                     </ul>
                  </div>
               </div>
            </div>

            {/* Terms of Use */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200">
               <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                     <Scale size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">{t("termsOfUse")}</h2>
               </div>

               <div className="space-y-8">
                  <div>
                     <h3 className="text-lg font-bold text-zinc-800 mb-3">{t("acceptanceOfTerms")}</h3>
                     <p className="text-zinc-600">{t("acceptanceText")}</p>
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-zinc-800 mb-3">{t("userObligations")}</h3>
                     <ul className="space-y-3 text-zinc-600">
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("user1")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("user2")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("user3")}</span>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-zinc-800 mb-3">{t("limitationOfLiability")}</h3>
                     <ul className="space-y-3 text-zinc-600">
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("liability1")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="text-brand mt-1">•</span>
                           <span>{t("liability2")}</span>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-zinc-800 mb-3">{t("modifications")}</h3>
                     <p className="text-zinc-600">{t("modificationsText")}</p>
                  </div>
               </div>
            </div>

         </div>
      </div>
   );
}