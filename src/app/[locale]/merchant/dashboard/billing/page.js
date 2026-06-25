"use client";

import { useState } from "react";
import { Check, CreditCard, Shield, Zap } from "lucide-react";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("free");

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "0",
      description: "Perfect for getting started and testing the platform.",
      features: [
        "Up to 10 products",
        "Basic store setup",
        "Standard support",
        "5% transaction fee"
      ],
      icon: Shield,
      color: "zinc"
    },
    {
      id: "silver",
      name: "Silver",
      price: "19.99",
      description: "Ideal for growing businesses with more products.",
      features: [
        "Up to 100 products",
        "Advanced analytics",
        "Priority support",
        "3% transaction fee",
        "Verified Badge"
      ],
      icon: CreditCard,
      color: "blue"
    },
    {
      id: "gold",
      name: "Gold",
      price: "49.99",
      description: "For high-volume sellers needing maximum visibility.",
      features: [
        "Unlimited products",
        "Premium store placement",
        "Dedicated account manager",
        "1% transaction fee",
        "Featured on homepage",
        "Verified Badge"
      ],
      icon: Zap,
      color: "amber"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Membership & Billing</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Manage your subscription plan and payment methods.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-xl border p-6 flex flex-col ${
                isCurrent 
                  ? 'border-[#be374f] shadow-md ring-1 ring-[#be374f]' 
                  : 'border-zinc-200 hover:border-zinc-300 shadow-sm'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 end-1/2 -translate-x-1/2 px-3 py-1 bg-[#be374f] text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  Current Plan
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  plan.color === 'zinc' ? 'bg-zinc-100 text-zinc-600' :
                  plan.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  'bg-amber-50 text-amber-500'
                }`}>
                  <plan.icon size={24} />
                </div>
                <h3 className="text-[18px] font-bold text-zinc-900">{plan.name}</h3>
              </div>
              
              <div className="mb-4">
                <span className="text-[32px] font-extrabold text-zinc-900">JOD {plan.price}</span>
                <span className="text-[13px] text-zinc-500 font-medium"> / month</span>
              </div>
              
              <p className="text-[13px] text-zinc-600 mb-6 min-h-[40px]">{plan.description}</p>
              
              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check size={16} className={`mt-0.5 ${isCurrent ? 'text-[#be374f]' : 'text-emerald-500'}`} />
                    <span className="text-[13px] text-zinc-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setCurrentPlan(plan.id)}
                disabled={isCurrent}
                className={`w-full py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                  isCurrent 
                    ? 'bg-zinc-100 text-zinc-400 cursor-default' 
                    : 'bg-brand hover:bg-brand-dark text-white border-brand shadow-sm'
                }`}
              >
                {isCurrent ? 'Active' : 'Upgrade to ' + plan.name}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
        <h4 className="text-[15px] font-bold text-zinc-900 mb-2">Payment Methods</h4>
        <p className="text-[13px] text-zinc-600 mb-4">You haven't added any payment methods yet. Add a credit card to upgrade your plan.</p>
        <button className="px-4 py-2 bg-white border border-zinc-300 rounded-md text-[13px] font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm inline-flex items-center gap-2">
          <CreditCard size={16} /> Add Payment Method
        </button>
      </div>
    </div>
  );
}
