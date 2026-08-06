"use client";

import { useLocale } from "next-intl";

export default function BillingPage() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-amber-900">
          {isAr ? "قسم الفوترة معطل مؤقتاً" : "Billing & Membership Disabled"}
        </h1>
        <p className="mt-4 text-amber-700 text-sm leading-relaxed">
          {isAr
            ? "تم تعطيل قسم العضويات والفوترة مؤقتاً بينما يتم إعداد خيارات الدفع والترقية. يرجى التواصل مع الدعم إذا كنت بحاجة للوصول إلى خطة أعلى."
            : "The membership and billing section is temporarily disabled while payment and upgrade options are being finalized. Please contact support if you need access to an upgraded plan."}
        </p>
      </div>
    </div>
  );
}
