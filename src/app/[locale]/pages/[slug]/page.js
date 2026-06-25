import { getPage } from "@/lib/woocommerce";
import { ShieldCheck, Truck, RotateCcw, Clock, Lock, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function DynamicPage({ params }) {
  const { slug } = await params;
  const fallbacks = {
    'shipping': {
      title: { rendered: 'Shipping Policy' },
      modified: new Date(),
      content: { rendered: '<p>Mahally provides reliable shipping across all Jordan governorates. Standard delivery to Amman takes 1-2 business days, while other areas take 2-4 business days.</p><strong>Shipping Rates:</strong><ul><li>Amman: JOD 2.00 (Free for orders over JOD 20.00)</li><li>Other Governorates: JOD 3.50</li></ul>' }
    },
    'price-adjustment': {
      title: { rendered: 'Price Adjustment' },
      modified: new Date(),
      content: { rendered: '<p>Our Price Adjustment policy ensures you always get the best deal. If an item you purchased drops in price within 30 days, we will credit the difference to your Mahally account.</p><strong>How it works:</strong><ol><li>Contact support within 30 days of purchase.</li><li>Provide your order ID and the new lower price link.</li><li>Receive your credit instantly after verification.</li></ol>' }
    },
    'security': {
      title: { rendered: 'Security Guarantee' },
      modified: new Date(),
      content: { rendered: '<p>Your security is our top priority. Mahally uses advanced encryption and industry-standard security protocols to protect your data and transactions.</p><ul><li>SSL Encrypted Transactions</li><li>PCI-DSS Compliant Payments</li><li>Secure Data Storage</li></ul>' }
    },
    'refunds': {
      title: { rendered: 'Card & Refund Policy' },
      modified: new Date(),
      content: { rendered: '<p>At Mahally, we offer instant refunds for cancelled orders paid via Credit/Debit cards. The amount will be credited back to your original payment method or your Mahally Wallet.</p><strong>Key Terms:</strong><ul><li>Instant processing for cancelled orders.</li><li>3-5 business days for bank processing.</li><li>100% money-back guarantee for defective items.</li></ul>' }
    }
  };

  const page = (await getPage(slug)) || fallbacks[slug];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f6f6f6] px-4">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center border border-zinc-100">
           <div className="w-20 h-20 bg-zinc-50 text-zinc-300 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} />
           </div>
           <h1 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter mb-4">Page Not Found</h1>
           <p className="text-zinc-500 text-xs font-medium mb-8 leading-relaxed">
             This page hasn't been created in WordPress yet. You can create a page with the slug <span className="font-bold text-brand">'{slug}'</span> in your dashboard.
           </p>
           <Link href="/" className="inline-block px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand transition-all">
             Back to Marketplace
           </Link>
        </div>
      </div>
    );
  }

  // Pick an icon based on slug
  const iconMap = {
    'shipping': Truck,
    'returns': RotateCcw,
    'privacy': Lock,
    'terms': ShieldCheck,
    'security': Lock,
    'ads': ShieldCheck,
    'refunds': CreditCard
  };
  const Icon = iconMap[slug] || CheckCircle2;

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-8">
             <Icon size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 uppercase italic tracking-tighter mb-4">
            {page.title.rendered}
          </h1>
          <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">
             <span className="flex items-center gap-1.5"><Clock size={12} /> Last updated {new Date(page.modified).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
             <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
             <span className="flex items-center gap-1.5 text-green-600"><ShieldCheck size={12} /> Verified by Mahally</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-8 md:p-16 shadow-2xl shadow-black/5 border border-zinc-100">
           <article 
             className="prose prose-sm md:prose-base prose-zinc max-w-none 
                        prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter 
                        prose-p:text-zinc-500 prose-p:leading-relaxed prose-p:font-medium
                        prose-strong:text-zinc-900 prose-strong:font-black"
             dangerouslySetInnerHTML={{ __html: page.content.rendered }} 
           />
           
           <div className="mt-16 pt-12 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Still have questions? Contact our team.</p>
              <Link href="/contact" className="h-12 px-8 border-2 border-zinc-100 rounded-xl flex items-center text-[10px] font-black uppercase tracking-widest hover:border-brand hover:text-brand transition-all">
                Customer Support
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
