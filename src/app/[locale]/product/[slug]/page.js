import { getProduct, getProducts, getProductReviews, getProductVariations, getCustomerById } from "@/lib/woocommerce";
import ProductCard from "@/components/ProductCard";
import { getProductMerchant } from "@/lib/product-utils";
import ProductActions from "@/components/ProductActions";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Star, ShieldCheck, Truck, RotateCcw, ChevronRight, CheckCircle2, MessageSquare, ThumbsUp, Package, Zap, Tag, Check, ChevronDown, Lock, Clock, Share2, Info } from "lucide-react";
import ProductReviewForm from "@/components/ProductReviewForm";
import ProductGallery from "@/components/ProductGallery";
import ProductShare from "@/components/ProductShare";
import RecentlyViewedTracker from "@/components/RecentlyViewedTracker";
import ProductReviews from "@/components/ProductReviews";
import ShippingInfoDisplay from "@/components/ShippingInfoDisplay";
import ProductCountdown from "@/components/ProductCountdown";
import { isMadeInJordanProduct } from "@/lib/made-in-jordan";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    if (!product) return { title: "Product Not Found - Mahally" };

    const description = product.short_description?.replace(/<[^>]*>/g, '') ||
      product.description?.replace(/<[^>]*>/g, '').substring(0, 160) ||
      "Shop this amazing product on Mahally Jo.";
    const image = product.images?.[0]?.src || "https://mahally.jo/logo.png";

    return {
      title: `${product.name} | Mahally`,
      description: description,
      openGraph: {
        title: product.name,
        description: description,
        images: [{ url: image }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: description,
        images: [image],
      },
    };
  } catch (e) {
    return { title: "Mahally Marketplace" };
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  let product = null;
  let relatedProducts = [];
  let reviews = [];
  let productVariations = [];
  let vendorData = null;

  try {
    product = await getProduct(slug);
    if (product) {
      const vendorId = product.meta_data?.find(m => m.key === "_vendor_id" || m.key === "mahally_owner_id")?.value;
      const fetchPromises = [
        getProducts({ per_page: 12, category: product.categories?.[0]?.id }),
        getProductReviews(product.id)
      ];
      if (product.type === "variable" || (product.variations && product.variations.length > 0)) {
        fetchPromises.push(getProductVariations(product.id));
      } else {
        fetchPromises.push(Promise.resolve(null));
      }
      if (vendorId) {
        fetchPromises.push(getCustomerById(vendorId));
      } else {
        fetchPromises.push(Promise.resolve(null));
      }

      const results = await Promise.all(fetchPromises);
      relatedProducts = results[0]?.data || [];
      reviews = results[1] || [];
      if (results[2]) {
        productVariations = results[2];
      }
      if (results[3]) {
        vendorData = results[3];
      }
    }
  } catch (error) {
    console.error("Error fetching product details:", error);
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-zinc-300" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 mb-2">المنتج غير موجود</h1>
          <p className="text-sm text-zinc-400 mb-6">ربما تمت إزالة هذا العنصر أو لم يعد متاحًا.</p>
          <Link href="/browse" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">
            متابعة التسوق
          </Link>
        </div>
      </div>
    );
  }

  const regularPrice = parseFloat(product.regular_price || 0);
  const salePrice = parseFloat(product.price || 0);
  const isJordanian = isMadeInJordanProduct(product);
  const discount = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;
  const soldCount = product.total_sales || 0;
  const ratingCount = reviews.length > 0 ? reviews.length : (product.rating_count || 0);
  const avgRating = reviews.length > 0
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : (Number(product.average_rating) || 0);
  const variations = product.attributes || [];

  // Dynamic Countdown Logic
  const saleEnd = product.date_on_sale_to ? new Date(product.date_on_sale_to) : null;
  let countdownText = "Sale ending soon";
  let saleEndDateStr = "";

  if (saleEnd) {
    saleEndDateStr = saleEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const diff = saleEnd.getTime() - new Date().getTime();
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      countdownText = `ينتهي في ${saleEndDateStr} (متبقي ${days} أيام، ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`;
    }
  }

  // Delivery date calculation (2-5 days from now)
  const deliveryStart = new Date(); deliveryStart.setDate(deliveryStart.getDate() + 2);
  const deliveryEnd = new Date(); deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const fmtDate = (d) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  // Return Policy Calculation
  let returnPolicyStr = "لا توجد معلومات متوفرة";
  const itemReturnPolicy = product.meta_data?.find(m => m.key === "mahally_return_policy")?.value;
  const itemReturnPeriod = product.meta_data?.find(m => m.key === "mahally_return_period")?.value;

  if (itemReturnPolicy === "no-returns") {
    returnPolicyStr = "لا نقبل الاسترجاع";
  } else if (itemReturnPolicy === "custom") {
    returnPolicyStr = `مؤهل للاسترجاع أو الاسترداد خلال ${itemReturnPeriod || "14"} يوم`;
  } else if (vendorData) {
    const globalPolicy = vendorData.meta_data?.find(m => m.key === "mahally_return_policy")?.value;
    const globalPeriod = vendorData.meta_data?.find(m => m.key === "mahally_return_period")?.value;

    if (globalPolicy === "no-returns") {
      returnPolicyStr = "لا نقبل الاسترجاع";
    } else if (globalPolicy === "global" || globalPolicy === "eligible" || globalPeriod) {
      returnPolicyStr = `مؤهل للاسترجاع أو الاسترداد خلال ${globalPeriod || "14"} يوم`;
    }
  }

  // WhatsApp Button Data
  const vendorWhatsappNumber = vendorData?.meta_data?.find(m => m.key === "mahally_whatsapp_number")?.value;
  const showVendorWhatsapp = vendorData?.meta_data?.find(m => m.key === "mahally_show_whatsapp")?.value !== "no";

  return (
    <div className="min-h-screen bg-white pb-20">
      <RecentlyViewedTracker product={product} />
      {/* Category Sub-Navigation (Amazon Style) */}
      <div className="bg-white border-b border-zinc-200 shadow-sm overflow-x-auto no-scrollbar sticky top-[60px] z-[80]">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 w-full flex items-center gap-6 h-10 text-[13px] font-medium text-[#0F1111] whitespace-nowrap">
          {product.categories?.[0] && (
            <span 
              className="font-bold border-b-2 border-brand h-full flex items-center px-1"
              dangerouslySetInnerHTML={{ __html: product.categories[0].name }}
            />
          )}
          <a href="#top" className="hover:text-brand transition-colors">أعلى الصفحة</a>
          <a href="#about" className="hover:text-brand transition-colors">عن هذا المنتج</a>
          <a href="#similar" className="hover:text-brand transition-colors">منتجات مشابهة</a>
          <a href="#reviews" className="hover:text-brand transition-colors">التقييمات</a>
          <a href="#" className="hover:text-brand transition-colors">قائمة الهدايا</a>
        </div>
      </div>

      <div id="top" />

      {/* Breadcrumbs */}
      <div className="bg-[#f8f8f8]">
        <div className="h-10 flex items-center gap-1.5 text-[12px] text-[#565959] max-w-[1200px] mx-auto px-4 lg:px-6 w-full">
          <Link href="/" className="hover:text-[#be374f] hover:underline transition-colors">الرئيسية</Link>
          <span className="text-zinc-400">›</span>
          {product.categories?.[0] && (
            <>
              <Link href={`/browse?cat=${product.categories[0].slug}`} className="hover:text-[#be374f] hover:underline transition-colors" dangerouslySetInnerHTML={{ __html: product.categories[0].name }} />
              <span className="text-zinc-400">›</span>
            </>
          )}
          <span className="text-[#565959] line-clamp-1 max-w-[300px]">{product.name}</span>
        </div>
      </div>

      <div className="py-5 max-w-[1200px] mx-auto px-4 lg:px-6 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-[40%_1fr_280px] xl:grid-cols-[40%_1fr_300px] gap-8">

          {/* LEFT COLUMN: Gallery */}
          <div className="w-full">
            <div className="bg-white rounded-xl overflow-hidden sticky top-[80px]">
              {/* Combine main images with variation images to ensure all are available in thumbnails */}
              {(() => {
                const allImages = [...(product.images || [])];
                productVariations.forEach(v => {
                  if (v.image?.src && !allImages.some(img => img.src === v.image.src)) {
                    allImages.push(v.image);
                  }
                });
                return <ProductGallery images={allImages} productName={product.name} />;
              })()}
            </div>
          </div>

          {/* CENTER COLUMN: Product Info */}
          <div className="flex flex-col bg-white p-6 rounded-xl border border-zinc-200 lg:bg-transparent lg:p-0 lg:border-none">
            {/* Title & Ratings */}
            <div className="mb-3 border-b border-zinc-200 pb-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-[20px] sm:text-[24px] font-medium text-[#0F1111] leading-tight">{product.name}</h1>
                {isJordanian && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
                    <span>🇯🇴</span>
                    <span>{locale === "ar" ? "صُنع في الأردن" : "Made in Jordan"}</span>
                  </span>
                )}
              </div>
              {(() => {
                const { name: storeName, id: storeId, slug: storeSlug } = getProductMerchant(product);
                return (
                  <div className="flex items-center gap-1.5 text-[14px] mb-2">
                    <span className="text-zinc-500">التاجر:</span>
                    <Link
                      href={storeSlug || storeId ? `/vendor/${storeSlug || storeId}` : "/vendors"}
                      className="text-[#be374f] hover:text-[#9b2c41] hover:underline font-bold"
                    >
                      {storeName || "محلي الرسمي"}
                    </Link>
                  </div>
                );
              })()}

              <div className="flex flex-wrap items-center gap-4 text-[14px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#0F1111]">{avgRating}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={`${i < Math.round(avgRating) ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-300 fill-zinc-300'}`} />
                    ))}
                  </div>
                  <ChevronDown size={14} className="text-zinc-500" />
                  <a href="#" className="text-[#be374f] hover:text-[#9b2c41] hover:underline me-2">{ratingCount.toLocaleString()} تقييمات</a>
                </div>
                {soldCount > 0 && (
                  <div className="text-[14px] text-[#0F1111] font-medium">
                    {soldCount > 100 ? `أكثر من ${Math.floor(soldCount / 10) * 10}` : soldCount} شخص اشتروا هذا الشهر
                  </div>
                )}
              </div>
            </div>

            {/* Price Block */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {discount > 0 && (
                  <div className="inline-block bg-[#be374f] text-white text-[12px] font-bold px-2 py-1 rounded-sm">
                    عرض لفترة محدودة
                  </div>
                )}
                <ProductCountdown endDate={product.date_on_sale_to} />
              </div>
              <div className="flex items-start gap-2">
                {discount > 0 && (
                  <span className="text-[28px] text-[#be374f] font-light leading-none">-{discount}%</span>
                )}
                <span className="text-[28px] font-medium text-[#0F1111] flex items-start leading-none">
                  <span className="text-[14px] mt-1 ms-0.5 me-1">د.أ</span>{salePrice.toFixed(2)}
                </span>
              </div>
              {discount > 0 && (
                <div className="text-[12px] text-[#565959] mt-1">
                  السعر الأصلي: <span className="line-through">{regularPrice.toFixed(2)} د.أ</span>
                </div>
              )}

              {(() => {
                const { name: storeName, id: storeId } = getProductMerchant(product);
                return (
                  <ShippingInfoDisplay
                    vendorId={storeId}
                    productPrice={salePrice}
                    merchantName={storeName}
                  />
                );
              })()}
            </div>

            {/* Product specifics Grid */}
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-[14px] mb-6">
              {product.attributes?.map(attr => (
                <div key={attr.id} className="contents">
                  <div className="font-bold text-[#0F1111]">{attr.name}</div>
                  <div className="text-[#0F1111]">{attr.options.join(", ")}</div>
                </div>
              ))}
              <div className="font-bold text-[#0F1111]">رقم المنتج</div>
              <div className="text-[#0F1111] font-bold text-orange-600 bg-brand-light px-2 py-0.5 rounded border border-orange-100 inline-block w-fit">
                {(() => {
                  const { name: storeName, id: storeId } = getProductMerchant(product);
                  const cleanStoreName = (storeName || "MAH").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                  const storePrefix = cleanStoreName.substring(0, 3).padEnd(3, "X");
                  const vendorIdStr = storeId || "0";
                  return `MAH-${storePrefix}-${vendorIdStr}-${product.id}`;
                })()}
              </div>
            </div>

            <hr className="border-zinc-200 mb-4" />

            {/* About this item */}
            <div id="about">
              <h2 className="text-[16px] font-bold text-[#0F1111] mb-2">عن هذا المنتج</h2>
              {product.description ? (
                <div className="prose prose-sm prose-zinc max-w-none text-[#0F1111] text-[14px] leading-relaxed 
                  [&>ul]:list-disc [&>ul]:ps-5 [&>ul>li]:mb-1 [&>p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <ul className="list-disc ps-5 text-[14px] text-[#0F1111] space-y-1">
                  <li>مواد عالية الجودة وصناعة متقنة.</li>
                  <li>مثالي للاستخدام اليومي.</li>
                  <li>أداء متين وموثوق.</li>
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Buy Box */}
          <div className="w-full">
            <ProductActions
              product={product}
              variations={productVariations}
              returnPolicy={returnPolicyStr}
              whatsappNumber={showVendorWhatsapp ? vendorWhatsappNumber : null}
            />
          </div>
        </div>

        {/* ======= YOU MAY ALSO LIKE ======= */}
        <div id="similar" className="mt-12">
          <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest">قد يعجبك أيضاً</h2>
          <div className="mahally-grid">
            {relatedProducts.slice(0, 12).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* ======= REVIEWS SECTION ======= */}
        <ProductReviews
          reviews={reviews}
          productName={product.name}
          productId={product.id}
          vendorId={product.meta_data?.find(m => m.key === "_vendor_id" || m.key === "mahally_owner_id")?.value}
        />
      </div>
    </div>
  );
}
