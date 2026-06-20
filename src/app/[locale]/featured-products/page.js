import { getProducts } from "@/lib/woocommerce";
import ProductGrid from "@/components/ProductGrid";
import { Star } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function FeaturedProductsPage() {
  let products = [];
  let totalPages = 1;

  try {
    // Fetch products marked as featured
    const result = await getProducts({ 
      featured: true, 
      per_page: 50, 
      status: 'publish' 
    }, true);
    
    products = result.data || [];
    totalPages = 1; // Since we are filtering manually, we assume one page for now or standard pagination can apply if > 50
  } catch (error) {
    console.error("Featured Products page error:", error);
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-[#fcfcfc] border-b border-zinc-200 py-8 px-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-[28px] font-medium text-zinc-900 leading-tight">منتجات مميزة</h1>
              <p className="text-[14px] text-zinc-600 mt-1">مجموعات منتقاة من أفضل التجار لدينا لتسهيل اكتشاف أفضل العروض.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
              <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">المعروض الآن</p>
                <p className="mt-1 text-2xl font-black text-zinc-900">{products.length}</p>
                <p className="text-[12px] text-zinc-600">العناصر المميزة المعروضة على هذه الصفحة</p>
              </article>
              <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">اختيارات التجار</p>
                <p className="mt-1 text-2xl font-black text-zinc-900">الأعلى تقييمًا</p>
                <p className="text-[12px] text-zinc-600">مختارة لتحسين تجربة الاكتشاف</p>
              </article>
            </div>
          </div>
        </div>
      </div>
      
      {products.length > 0 ? (
        <ProductGrid initialProducts={products} totalPages={totalPages} />
      ) : (
        <div className="max-w-[1400px] mx-auto px-4 py-16 text-center">
           <Star size={60} className="text-zinc-300 mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-zinc-700 mb-2">لا توجد منتجات مميزة بعد</h2>
           <p className="text-zinc-500">ستظهر هنا المنتجات التي يختارها تجارنا.</p>
        </div>
      )}
    </div>
  );
}
