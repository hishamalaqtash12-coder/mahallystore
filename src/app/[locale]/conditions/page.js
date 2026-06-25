import { Link } from "@/i18n/routing";
import { ShieldCheck, ArrowLeft, CheckCircle2, RefreshCcw, Store, Scale } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions - Mahally Jo",
  description: "Read the Mahally Jo terms of use, return policy, and seller agreements.",
};

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] font-sans pb-24">
      
      {/* Header Area */}
      <div className="bg-brand-dark text-white py-10 px-4">
        <div className="max-w-[800px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors mb-6 text-sm font-medium">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Terms and Conditions</h1>
          <p className="text-zinc-400 text-lg">Last updated: May 2026</p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 mt-[-20px] relative z-10">
        
        {/* Consent Message Box (Top) */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200 mb-8 border-e-4 border-e-brand">
           <div className="flex items-start gap-4 mb-4">
              <ShieldCheck size={28} className="text-brand shrink-0 mt-1" />
              <div>
                 <h2 className="text-xl font-bold text-zinc-900 mb-2">Consent Message</h2>
                 <p className="text-zinc-600 mb-4">Please read the following terms carefully before proceeding. By using the Mahally platform, you acknowledge and agree to:</p>
                 <ul className="list-disc pe-5 space-y-1 text-zinc-700 font-medium mb-6">
                    <li>Return Policy</li>
                    <li>Seller Agreement (for merchants only)</li>
                    <li>Terms of Use</li>
                 </ul>
                 <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg text-green-800">
                    <CheckCircle2 size={24} className="text-green-600 shrink-0" />
                    <p className="text-sm font-medium leading-relaxed">
                      By continuing to use this platform, or by clicking "I Agree" during registration, you confirm your consent and commitment to all the stated terms, conditions, and provisions.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Return Policy */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200 mb-8">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><RefreshCcw size={24} /></div>
              <h2 className="text-2xl font-bold text-zinc-900">Return Policy</h2>
           </div>
           <ul className="space-y-4 text-zinc-600">
              <li className="flex items-start gap-3">
                 <span className="text-brand mt-1">•</span>
                 <span>The buyer has the right to request a product return within a period not exceeding <strong>three (3) calendar days</strong> from the date of receiving the product.</span>
              </li>
              <li className="flex items-start gap-3">
                 <span className="text-brand mt-1">•</span>
                 <span>The product must be in its original condition, unused, with all original accessories and invoices.</span>
              </li>
              <li className="flex items-start gap-3">
                 <span className="text-brand mt-1">•</span>
                 <span>The return policy does not cover custom-made products requested by the buyer, perishable products, or items related to personal health.</span>
              </li>
              <li className="flex items-start gap-3">
                 <span className="text-brand mt-1">•</span>
                 <span>If the reason for return is a mistake by the seller (e.g., a product different from the description, or a manufacturing defect), the seller bears the full shipping costs.</span>
              </li>
              <li className="flex items-start gap-3">
                 <span className="text-brand mt-1">•</span>
                 <span>In other cases, the buyer bears the shipping costs for the return process.</span>
              </li>
              <li className="flex items-start gap-3">
                 <span className="text-brand mt-1">•</span>
                 <span>The paid amount will be refunded within a maximum of <strong>14 working days</strong> from the date of approval of the return request.</span>
              </li>
              <li className="flex items-start gap-3">
                 <span className="text-brand mt-1">•</span>
                 <span>The platform reserves the right to modify or update the return policy at any time. Continued use of the platform is considered explicit consent to the modifications.</span>
              </li>
           </ul>
        </div>

        {/* Seller Agreement */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200 mb-8">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
              <div className="p-2 bg-brand-light text-orange-600 rounded-lg"><Store size={24} /></div>
              <h2 className="text-2xl font-bold text-zinc-900">Seller Agreement</h2>
           </div>
           
           <div className="space-y-8">
              <div>
                 <h3 className="text-lg font-bold text-zinc-800 mb-3">1. Seller Obligations</h3>
                 <ul className="space-y-3 text-zinc-600 pe-2">
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The seller is committed to providing accurate and correct information about their products, including prices, descriptions, and images.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The seller guarantees that the displayed products are authentic, legal, and do not violate any regulations or intellectual property rights.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The seller is committed to shipping and delivering products on time and in an appropriate manner.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The seller adheres to the return and exchange policy announced by the platform and bears responsibility for costs in the event of an error on their part.</span>
                    </li>
                 </ul>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-zinc-800 mb-3">2. Legal Responsibilities</h3>
                 <ul className="space-y-3 text-zinc-600 pe-2">
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The seller bears full responsibility for any disputes, complaints, or legal claims related to their products.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The platform reserves the right to suspend or cancel the account of any seller who violates this agreement without prior notice.</span>
                    </li>
                 </ul>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-zinc-800 mb-3">3. Platform Rights</h3>
                 <ul className="space-y-3 text-zinc-600 pe-2">
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The platform has the right to review or remove any product that violates the terms of use or applicable laws.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The platform reserves the right to deduct a commission or service fees as announced in the system.</span>
                    </li>
                 </ul>
              </div>
           </div>
        </div>

        {/* Terms of Use */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Scale size={24} /></div>
              <h2 className="text-2xl font-bold text-zinc-900">Terms of Use</h2>
           </div>
           
           <div className="space-y-8">
              <div>
                 <h3 className="text-lg font-bold text-zinc-800 mb-3">1. Acceptance of Terms</h3>
                 <p className="text-zinc-600 pe-5">By using the Mahally platform, you acknowledge and agree to abide by these terms and conditions, and any updates that may occur to them.</p>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-zinc-800 mb-3">2. User Obligations</h3>
                 <ul className="space-y-3 text-zinc-600 pe-2">
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The user (seller or buyer) is committed to using the platform in compliance with local laws.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The user is committed to providing correct, accurate, and up-to-date data.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>It is prohibited to use the platform in any illegal or fraudulent activity or in a way that violates the rights of others.</span>
                    </li>
                 </ul>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-zinc-800 mb-3">3. Limitation of Liability</h3>
                 <ul className="space-y-3 text-zinc-600 pe-2">
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The platform is not responsible for any transactions conducted outside the platform's official electronic system.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-brand mt-1">•</span>
                       <span>The platform bears no responsibility for direct or indirect damages resulting from the use of the platform or from transactions between parties.</span>
                    </li>
                 </ul>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-zinc-800 mb-3">4. Modifications</h3>
                 <p className="text-zinc-600 pe-5">The platform reserves the right to modify or update these terms at any time, and continued use is considered implicit approval of those modifications.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
