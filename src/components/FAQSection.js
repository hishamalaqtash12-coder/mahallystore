"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MessageCircle } from "lucide-react";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "You can track your order in real-time by going to 'Your Orders' in your account. Once your item is shipped, a tracking number from Aramex or J&T Express will be visible in the order details."
  },
  {
    q: "What is the Mahally return policy?",
    a: "We offer a 30-day return policy for most items. If you're not satisfied, you can initiate a return directly from the 'Your Orders' page. Please ensure items are returned in their original packaging."
  },
  {
    q: "How can I change my delivery address?",
    a: "Delivery addresses can be updated within 12 hours of placing an order, provided the status is still 'Processing'. Navigate to the specific order in your dashboard to modify shipping details."
  },
  {
    q: "Where do I apply a coupon code?",
    a: "Coupon codes can be entered during the final step of checkout. Look for the 'Promo Code' field near your order total and click 'Apply' to see your savings."
  },
  {
    q: "Is my payment information safe?",
    a: "Mahally utilizes industry-standard SSL encryption and works with premier payment gateways like PayTabs and HyperPay to ensure your financial data is never stored and always protected."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-1">
      {FAQS.map((faq, i) => (
        <div 
          key={i} 
          className="border-b border-zinc-100 last:border-0"
        >
          <button 
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-end group transition-all"
          >
            <span className={`text-[14px] font-medium transition-colors ${openIndex === i ? 'text-[#8f2d4a] font-bold' : 'text-zinc-700 group-hover:text-[#8f2d4a]'}`}>
              {faq.q}
            </span>
            <ChevronDown 
              size={18} 
              className={`text-zinc-400 transition-transform duration-200 ${openIndex === i ? 'rotate-180 text-[#8f2d4a]' : ''}`} 
            />
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-[13px] text-zinc-600 leading-relaxed pe-1">
              {faq.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
