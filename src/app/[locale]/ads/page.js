import { Target, TrendingUp, BarChart3, Users, Zap, Globe } from "lucide-react";
import Link from "next/link";

export default function AdsPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-20">
      <div className="bg-zinc-900 text-white py-20 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-6">Scale Your Sales</h1>
          <p className="text-zinc-400 text-lg font-medium leading-relaxed">
            Reach millions of shoppers in Jordan and beyond with Mahally Ad Solutions. 
            The most effective way to grow your brand on the kingdom's fastest-growing marketplace.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button className="h-14 px-10 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all">Start Advertising</button>
            <button className="h-14 px-10 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">View Pricing</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: "Precision Targeting", desc: "Show your products to users searching for exactly what you sell." },
            { icon: TrendingUp, title: "Boost Visibility", desc: "Appear at the top of search results and category pages instantly." },
            { icon: BarChart3, title: "Detailed Analytics", desc: "Track every click and conversion with our real-time merchant dashboard." }
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 group hover:border-brand transition-colors">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-900 group-hover:bg-brand group-hover:text-white transition-all mb-6">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter mb-3">{feature.title}</h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-20 max-w-5xl">
        <div className="bg-white rounded-[40px] p-8 md:p-16 border border-zinc-100 flex flex-col md:flex-row items-center gap-12">
           <div className="flex-1">
              <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter mb-6">Why Mahally Ads?</h2>
              <ul className="space-y-4">
                 {[
                   "Industry-leading ROAS (Return on Ad Spend)",
                   "Easy-to-use campaign manager",
                   "Support for local Jordanian small businesses",
                   "Multilingual ad placement (Arabic & English)"
                 ].map((item, i) => (
                   <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0 mt-0.5"><Zap size={12} /></div>
                      <span className="text-sm font-bold text-zinc-700">{item}</span>
                   </li>
                 ))}
              </ul>
           </div>
           <div className="w-full md:w-[400px] aspect-square bg-zinc-50 rounded-[32px] relative overflow-hidden flex items-center justify-center">
              <Globe size={120} className="text-zinc-200 animate-pulse" />
           </div>
        </div>
      </div>
    </div>
  );
}
