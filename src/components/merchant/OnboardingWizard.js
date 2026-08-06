"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { CheckCircle2, Circle, ChevronRight, Upload, Package, Link as LinkIcon } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function OnboardingWizard({ stats, user }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const dismissed = localStorage.getItem("mahally_onboarding_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  if (!isMounted || isDismissed) return null;

  // Track progress
  const hasIdentity = true; // Assumed done during registration for this phase
  const hasProduct = stats?.hasProducts || stats?.totalProducts > 0;
  const hasSocials = stats?.hasSocials || false;

  const steps = [
    {
      id: "identity",
      title: isAr ? "تأكيد الهوية" : "Verify Identity",
      description: isAr ? "حمّل مستند نشاطك التجاري لتأكيد هويتك." : "Upload your business document to get verified.",
      icon: Upload,
      completed: hasIdentity,
      actionText: isAr ? "مكتمل" : "Completed",
      href: "#",
    },
    {
      id: "product",
      title: isAr ? "أضف أول منتج" : "Add First Product",
      description: isAr ? "أضف منتجًا واحدًا على الأقل للبدء بالبيع." : "List at least one product to start selling.",
      icon: Package,
      completed: hasProduct,
      actionText: isAr ? "أضف منتج" : "Add Product",
      href: "/merchant/dashboard/products",
    },
    {
      id: "social",
      title: isAr ? "أضف روابط التواصل" : "Add Social Links",
      description: isAr ? "اربط حساباتك الاجتماعية في الإعدادات." : "Connect your social media in settings.",
      icon: LinkIcon,
      completed: hasSocials,
      actionText: isAr ? "اذهب إلى الإعدادات" : "Go to Settings",
      href: "/merchant/dashboard/settings",
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (progressPercent === 100) {
    // Auto-dismiss if everything is done
    localStorage.setItem("mahally_onboarding_dismissed", "true");
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#be374f]/5 to-[#febd69]/10 border border-[#be374f]/20 rounded-xl p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 start-0 w-64 h-64 bg-[#febd69] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            {isAr ? "معالج إعداد المتجر" : "Store Setup Wizard"}
            <span className="px-2 py-0.5 bg-[#be374f] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              {isAr ? "مطلوب" : "Required"}
            </span>
          </h2>
          <p className="text-[13px] text-zinc-600 mt-1">
            {isAr ? "أكمل هذه الخطوات لنشر متجرك والبدء بالبيع." : "Complete these steps to publish your store and start selling."}
          </p>
        </div>
        <div className="text-start">
          <div className="text-[24px] font-bold text-[#be374f] leading-none">{progressPercent}%</div>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            {isAr ? "اكتمل" : "Completed"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-zinc-200 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-[#be374f] rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, idx) => (
          <Link 
            key={step.id} 
            href={step.href}
            className={`block p-4 rounded-lg border transition-all ${step.completed ? 'bg-white/60 border-zinc-200 opacity-70' : 'bg-white border-[#be374f]/30 hover:border-[#be374f] hover:shadow-md'}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.completed ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : (
                  <Circle size={20} className="text-zinc-300" />
                )}
              </div>
              <div>
                <h3 className={`text-[14px] font-bold ${step.completed ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
                  {step.title}
                </h3>
                <p className="text-[12px] text-zinc-500 mt-1 mb-3">{step.description}</p>
                {!step.completed && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#be374f] hover:underline">
                    {step.actionText} <ChevronRight size={14} />
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
