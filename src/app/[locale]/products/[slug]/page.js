import { getProduct, getProducts } from "@/lib/woocommerce";
import Image from "next/image";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { ShieldCheck, Zap, Truck, RotateCcw } from "lucide-react";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.name} | Mahally Jordan`,
    description: product.short_description ? product.short_description.replace(/<[^>]+>/g, '') : product.name,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0].src 
    : "https://via.placeholder.com/600?text=No+Image";

  return (
    <div className="min-h-screen pb-24 text-left">
      <div className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* High-Precision Gallery */}
          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <div className="aspect-[4/5] relative rounded-[2.5rem] overflow-hidden bg-zinc-100 shadow-premium group">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">Verified Product</div>
                </div>
              </div>
            </div>
          </div>

          {/* Precision Info */}
          <div className="lg:col-span-5 py-6">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-black text-brand uppercase tracking-[0.2em]">Mahally Select</span>
                  <div className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">SKU: {product.sku || 'N/A'}</span>
                </div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter leading-[0.9] mb-4 uppercase">
                  {product.name}
                </h1>
                <div 
                  className="text-2xl font-black text-zinc-900 tracking-tight"
                  dangerouslySetInnerHTML={{ __html: product.price_html || `${product.price} JOD` }}
                />
              </div>

              <div className="glass rounded-3xl p-6 border border-zinc-100 space-y-6">
                <div 
                  className="text-[11px] font-bold text-zinc-500 leading-relaxed uppercase tracking-tight"
                  dangerouslySetInnerHTML={{ __html: product.short_description || product.description }}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-900">
                      <Truck size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none">Shipping</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">48h Delivery</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-900">
                      <ShieldCheck size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none">Authenticity</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">100% Genuine</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <AddToCartButton product={product} />
                <p className="text-center text-[9px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
                  Secure Checkout with HyperPay & Apple Pay
                </p>
              </div>

              {/* Detailed Specs */}
              <div className="pt-8 border-t border-zinc-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">Detailed Description</h4>
                <div 
                  className="text-[11px] font-bold text-zinc-400 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const products = await getProducts({ per_page: 50 });
    return products.map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    return [];
  }
}

