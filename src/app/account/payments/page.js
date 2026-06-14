"use client";

import { useAuth } from "@/context/AuthContext";
import { CreditCard, ShieldCheck, Wallet, CheckCircle2 } from "lucide-react";

export default function AccountPaymentsPage() {
   const { loading } = useAuth();
   if (loading) return null;

   return (
      <div className="w-full">
         <h2 className="text-2xl font-bold mb-8 text-gray-900">Your payment methods</h2>

         <div className="grid grid-cols-1 gap-6">
            {/* Active Payment Method: COD */}
            <div className="bg-white border-2 border-emerald-500 rounded-md p-8 relative overflow-hidden shadow-sm">
               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[50px] flex items-center justify-end pr-5 pt-5 text-emerald-500">
                  <CheckCircle2 size={32} />
               </div>

               <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600">
                     <Wallet size={32} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-gray-900">Cash on Delivery (COD)</h3>
                     <p className="text-emerald-600 font-bold text-[14px]">Active & Preferred</p>
                  </div>
               </div>

               <p className="text-gray-500 text-[14px] leading-relaxed max-w-md mb-8">
                  Based on our website policies, Cash on Delivery is currently the primary payment method.
                  Pay securely with cash when your package arrives at your doorstep.
               </p>

               {/* <div className="flex items-center gap-2 py-2 px-4 bg-gray-50 rounded-md w-fit border border-gray-100">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-[12px] font-bold text-gray-600 tracking-tight uppercase">Safe & Secure Transaction</span>
           </div> */}
            </div>

            {/* Disabled/Future Payment Methods */}
            <div className="bg-gray-50/30 border border-gray-100 rounded-md p-8 opacity-60">
               <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center text-gray-300 border border-gray-100">
                     <CreditCard size={32} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-400">Credit or Debit Card</h3>
                     <p className="text-[13px] text-gray-400">Coming Soon</p>
                  </div>
               </div>
               <p className="text-[13px] text-gray-400">Online card payments are currently being optimized to ensure the highest security for our customers.</p>
            </div>
         </div>

         <div className="mt-12 p-8 bg-black text-white rounded-md relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-lg font-bold mb-2">Our Payment Guarantee</h4>
               <p className="text-gray-400 text-[14px] max-w-lg leading-relaxed">
                  We ensure every transaction is protected. With Cash on Delivery, you have the opportunity to inspect your package before payment, ensuring 100% satisfaction.
               </p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
               <ShieldCheck size={180} />
            </div>
         </div>
      </div>
   );
}
