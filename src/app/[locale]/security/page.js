import { ShieldCheck, Lock, EyeOff, ShieldAlert, Key, Fingerprint } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-20">
      <div className="bg-white border-b border-zinc-100 py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter mb-4">Your Security is Our Priority</h1>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed">
            At Mahally, we use state-of-the-art encryption and rigorous security protocols to protect your data and transactions every single second.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: Lock, title: "SSL Encryption", desc: "Every transaction is protected by 256-bit SSL encryption, the same standard used by global banks." },
            { icon: EyeOff, title: "Privacy Protection", desc: "Your personal information is never sold. We only share data necessary for delivery fulfillment." },
            { icon: ShieldAlert, title: "Fraud Prevention", desc: "Our AI-powered systems monitor for suspicious activity 24/7 to prevent unauthorized transactions." },
            { icon: Key, title: "Account Safety", desc: "Advanced hashing algorithms ensure your passwords remain unreadable and safe from hackers." },
            { icon: Fingerprint, title: "Verified Merchants", desc: "Every seller on Mahally undergoes a strict verification process to ensure product authenticity." },
            { icon: ShieldCheck, title: "Safe Payments", desc: "We partner with leading payment gateways to ensure your card details are never stored on our servers." }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-50 flex flex-col items-center text-center">
               <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-900 mb-6">
                 <item.icon size={28} />
               </div>
               <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight mb-3">{item.title}</h3>
               <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-zinc-900 rounded-[40px] p-12 text-white text-center">
           <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Found a vulnerability?</h2>
           <p className="text-zinc-400 text-sm mb-8 font-medium">We appreciate the work of security researchers. If you find a bug, please report it to us immediately.</p>
           <button className="h-12 px-8 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all">Report Vulnerability</button>
        </div>
      </div>
    </div>
  );
}
