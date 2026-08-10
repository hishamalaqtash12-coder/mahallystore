import { getProduct, getProducts, getProductReviews, getProductVariations, getCustomerById } from "@/lib/woocommerce";
import ProductCard from "@/components/ProductCard";
import { getProductMerchant, getProductIdentifier, getProductUrl } from "@/lib/product-utils";
import ProductActions from "@/components/ProductActions";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  Package,
  Zap,
  Tag,
  Check,
  ChevronDown,
  Lock,
  Clock,
  Share2,
  Info,
} from "lucide-react";
import ProductReviewForm from "@/components/ProductReviewForm";
import ProductGallery from "@/components/ProductGallery";
import ProductShare from "@/components/ProductShare";
import RecentlyViewedTracker from "@/components/RecentlyViewedTracker";
import ProductReviews from "@/components/ProductReviews";
import ReviewTooltip from "@/components/ReviewTooltip";
import ShippingInfoDisplay from "@/components/ShippingInfoDisplay";
import ProductCountdown from "@/components/ProductCountdown";
import { isMadeInJordanProduct } from "@/lib/made-in-jordan";
import { getTranslations, getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = await getTranslations("ProductPage");
  try {
    // URL format: /product/[ID]-[slug], e.g. /product/8965-محفظة-فاااخرة
    // Extract the trailing numeric product ID from the slug (e.g. MAH-AMM-35-محفظة-فاااخرة-8965)
    let fetchId = slug;
    const idMatch = slug.match(/-(\d+)$/);
    if (idMatch) {
      fetchId = idMatch[1];
    }
    let product = await getProduct(fetchId);
    
    if (product) {
      const canonicalSlug = getProductUrl(product).split('/').pop();
      const decodedSlug = decodeURIComponent(slug);
      const decodedCanonical = decodeURIComponent(canonicalSlug);
      if (decodedSlug !== decodedCanonical) {
        product = null;
      }
    }
    
    if (!product) return { title: t("notFoundTitle") };

    const description =
      product.short_description?.replace(/<[^>]*>/g, "") ||
      product.description?.replace(/<[^>]*>/g, "").substring(0, 160) ||
      t("defaultDescription");
    const image = product.images?.[0]?.src || "https://mahally.jo/logo.png";

    return {
      title: `${product.name} | Mahally`,
      description,
      openGraph: {
        title: product.name,
        description,
        images: [{ url: image }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        images: [image],
      },
    };
  } catch (e) {
    return { title: "Mahally Marketplace" };
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const t = await getTranslations("ProductPage");
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  let product = null;
  let relatedProducts = [];
  let reviews = [];
  let productVariations = [];
  let vendorData = null;
  let displayedId = null;

  try {
    // URL format: /product/MAH-[vendor]-[id]-[slug]-[PRODUCT_ID]
    // Extract the trailing numeric product ID — this is the ONLY thing that determines which product loads
    let fetchId = slug;
    const idMatch = slug.match(/-(\d+)$/);
    if (idMatch) {
      fetchId = idMatch[1];
    }
    product = await getProduct(fetchId);

    if (product) {
      displayedId = getProductIdentifier(product);
      
      const canonicalSlug = getProductUrl(product).split('/').pop();
      const decodedSlug = decodeURIComponent(slug);
      const decodedCanonical = decodeURIComponent(canonicalSlug);
      
      // If the URL has been tampered with, treat the product as not found
      // This will automatically show the "Product Not Found" UI
      if (decodedSlug !== decodedCanonical) {
        product = null;
      }
    }
    
    if (product) {
      const vendorId = product.meta_data?.find(
        (m) => m.key === "_vendor_id" || m.key === "mahally_owner_id"
      )?.value;
      const fetchPromises = [
        getProducts({ per_page: 12, category: product.categories?.[0]?.id }, true),
        getProductReviews(product.id),
      ];
      if (
        product.type === "variable" ||
        (product.variations && product.variations.length > 0)
      ) {
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
      <div
        className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f5]"
        dir={dir}
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-zinc-300" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 mb-2">
            {t("productNotFound")}
          </h1>
          <p className="text-sm text-zinc-400 mb-6">{t("productNotFoundDesc")}</p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:brightness-110 transition-all"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  const regularPrice = parseFloat(product.regular_price || 0);
  const salePrice = parseFloat(product.price || 0);
  const isJordanian = isMadeInJordanProduct(product);
  const discount =
    regularPrice > salePrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;
  const soldCount = product.total_sales || 0;
  const ratingCount =
    reviews.length > 0 ? reviews.length : product.rating_count || 0;
  const avgRating =
    reviews.length > 0
      ? parseFloat(
        (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      )
      : Number(product.average_rating) || 0;

  // Return Policy
  let returnPolicyStr = t("noReturnInfo");
  const itemReturnPolicy = product.meta_data?.find(
    (m) => m.key === "mahally_return_policy"
  )?.value;
  const itemReturnPeriod = product.meta_data?.find(
    (m) => m.key === "mahally_return_period"
  )?.value;

  if (itemReturnPolicy === "no-returns") {
    returnPolicyStr = t("noReturns");
  } else if (itemReturnPolicy === "custom") {
    returnPolicyStr = t("eligibleReturns", {
      days: itemReturnPeriod || "14",
    });
  } else if (vendorData) {
    const globalPolicy = vendorData.meta_data?.find(
      (m) => m.key === "mahally_return_policy"
    )?.value;
    const globalPeriod = vendorData.meta_data?.find(
      (m) => m.key === "mahally_return_period"
    )?.value;

    if (globalPolicy === "no-returns") {
      returnPolicyStr = t("noReturns");
    } else if (
      globalPolicy === "global" ||
      globalPolicy === "eligible" ||
      globalPeriod
    ) {
      returnPolicyStr = t("eligibleReturns", {
        days: globalPeriod || "14",
      });
    }
  }

  // WhatsApp
  const vendorWhatsappNumber = vendorData?.meta_data?.find(
    (m) => m.key === "mahally_whatsapp_number"
  )?.value;
  const showVendorWhatsapp =
    vendorData?.meta_data?.find((m) => m.key === "mahally_show_whatsapp")
      ?.value !== "no";

  return (
    <div className="min-h-screen bg-white pb-20" dir={dir}>
      <RecentlyViewedTracker product={product} />

      <div id="top" />

      {/* Breadcrumbs */}
      <div className="bg-[#f8f8f8]">
        <div className="h-10 flex items-center gap-1.5 text-[12px] text-[#565959] max-w-[1200px] mx-auto px-4 lg:px-6 w-full">
          <Link
            href="/"
            className="hover:text-[#be374f] hover:underline transition-colors"
          >
            {t("home")}
          </Link>
          <span className="text-zinc-400">›</span>
          {product.categories?.[0] && (
            <>
              <Link
                href={`/browse?cat=${product.categories[0].slug}`}
                className="hover:text-[#be374f] hover:underline transition-colors"
                dangerouslySetInnerHTML={{
                  __html: product.categories[0].name,
                }}
              />
              <span className="text-zinc-400">›</span>
            </>
          )}
          <span className="text-[#565959] line-clamp-1 max-w-[300px]">
            {product.name}
          </span>
        </div>
      </div>

      <div className="py-5 max-w-[1200px] mx-auto px-4 lg:px-6 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-[40%_1fr_280px] xl:grid-cols-[40%_1fr_300px] gap-8">
          {/* LEFT: Gallery */}
          <div className="w-full">
            <div className="bg-white rounded-xl overflow-hidden sticky top-[80px]">
              {(() => {
                const allImages = [...(product.images || [])];
                productVariations.forEach((v) => {
                  if (
                    v.image?.src &&
                    !allImages.some((img) => img.src === v.image.src)
                  ) {
                    allImages.push(v.image);
                  }
                });
                return (
                  <ProductGallery
                    images={allImages}
                    productName={product.name}
                    isJordanian={isJordanian}
                  />
                );
              })()}
            </div>
          </div>

          {/* CENTER: Product Info */}
          <div className="flex flex-col bg-white p-6 rounded-xl border border-zinc-200 lg:bg-transparent lg:p-0 lg:border-none">
            <div className="mb-3 border-b border-zinc-200 pb-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-[20px] sm:text-[24px] font-medium text-[#0F1111] leading-tight">
                  {product.name}
                </h1>
              </div>

              {(() => {
                const {
                  name: storeName,
                  id: storeId,
                  slug: storeSlug,
                } = getProductMerchant(product);
                return (
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-center gap-1.5 text-[14px]">
                      <span className="text-zinc-500">{t("merchant")}:</span>
                      <Link
                        href={
                          storeSlug || storeId
                            ? `/vendor/${storeSlug || storeId}`
                            : "/vendors"
                        }
                        className="text-[#be374f] hover:text-[#9b2c41] hover:underline font-bold"
                      >
                        {storeName || t("officialMahally")}
                      </Link>
                    </div>
                    {displayedId && (
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <span className="text-zinc-500">
                          {t("productId")}:
                        </span>
                        <span className="font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                          {displayedId}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-wrap items-center gap-4 text-[14px]">
                <ReviewTooltip 
                  productId={product.id} 
                  ratingCount={ratingCount} 
                  averageRating={avgRating} 
                  productUrl="#reviews"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[#0F1111]">{avgRating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${i < Math.round(avgRating)
                              ? "text-[#FFA41C] fill-[#FFA41C]"
                              : "text-zinc-300 fill-zinc-300"
                            }`}
                        />
                      ))}
                    </div>
                    <ChevronDown size={14} className="text-zinc-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    <a
                      href="#reviews"
                      className="text-[#be374f] hover:text-[#9b2c41] hover:underline me-2"
                    >
                      {t("reviewsCount", {
                        count: ratingCount.toLocaleString(
                          locale === "ar" ? "ar-JO" : "en-US"
                        ),
                      })}
                    </a>
                  </div>
                </ReviewTooltip>
                {soldCount > 0 && (
                  <div className="text-[14px] text-[#0F1111] font-medium">
                    {soldCount > 100
                      ? t("soldThisMonthMany", {
                        count: Math.floor(soldCount / 10) * 10,
                      })
                      : t("soldThisMonth", { count: soldCount })}
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {discount > 0 && (
                  <div className="inline-block bg-[#be374f] text-white text-[12px] font-bold px-2 py-1 rounded-sm">
                    {t("limitedOffer")}
                  </div>
                )}
                <ProductCountdown endDate={product.date_on_sale_to} />
              </div>
              <div className="flex items-start gap-2">
                {discount > 0 && (
                  <span className="text-[28px] text-[#be374f] font-light leading-none">
                    -{discount}%
                  </span>
                )}
                <span className="text-[28px] font-medium text-[#0F1111] flex items-start leading-none">
                  <span className="text-[14px] mt-1 ms-0.5 me-1">
                    {t("currency")}
                  </span>
                  {salePrice.toFixed(2)}
                </span>
              </div>
              {discount > 0 && (
                <div className="text-[12px] text-[#565959] mt-1">
                  {t("originalPrice")}:{" "}
                  <span className="line-through">
                    {regularPrice.toFixed(2)} {t("currency")}
                  </span>
                </div>
              )}

              {(() => {
                const { name: storeName, id: storeId } =
                  getProductMerchant(product);
                return (
                  <ShippingInfoDisplay
                    vendorId={storeId}
                    productPrice={salePrice}
                    merchantName={storeName}
                  />
                );
              })()}
            </div>

            <hr className="border-zinc-200 mb-4" />

            {/* About */}
            <div id="about">
              <h2 className="text-[16px] font-bold text-[#0F1111] mb-2">
                {t("aboutThisItem")}
              </h2>
              {product.description ? (
                <div
                  className="prose prose-sm prose-zinc max-w-none text-[#0F1111] text-[14px] leading-relaxed 
                  [&>ul]:list-disc [&>ul]:ps-5 [&>ul>li]:mb-1 [&>p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <ul className="list-disc ps-5 text-[14px] text-[#0F1111] space-y-1">
                  <li>{t("defaultFeature1")}</li>
                  <li>{t("defaultFeature2")}</li>
                  <li>{t("defaultFeature3")}</li>
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT: Buy Box */}
          <div className="w-full">
            <ProductActions
              product={product}
              variations={productVariations}
              returnPolicy={returnPolicyStr}
              whatsappNumber={showVendorWhatsapp ? vendorWhatsappNumber : null}
            />
          </div>
        </div>

        {/* Related */}
        <div id="similar" className="mt-12">
          <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest">
            {t("youMayAlsoLike")}
          </h2>
          <div className="mahally-grid">
            {relatedProducts.slice(0, 12).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews
          reviews={reviews}
          productName={product.name}
          productId={product.id}
          vendorId={
            product.meta_data?.find(
              (m) => m.key === "_vendor_id" || m.key === "mahally_owner_id"
            )?.value
          }
        />
      </div>
    </div>
  );
}