"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ChevronRight, Store, Star, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

export default function AccountFollowedStoresPage() {
  const t = useTranslations("AccountFollowedStores");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { wooId, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [unfollowingId, setUnfollowingId] = useState(null);

  const fetchFollowedData = async () => {
    if (!wooId) return;
    setLoading(true);
    try {
      const [statusRes, vendorsRes] = await Promise.all([
        fetch(`/api/vendors/follow/status?userId=${wooId}&t=${Date.now()}`, {
          cache: "no-store",
        }),
        fetch(`/api/vendors?t=${Date.now()}`, { cache: "no-store" }),
      ]);

      const statusData = await statusRes.json();
      const vendorsData = await vendorsRes.json();

      setFollowedIds(statusData.followed || []);
      setVendors(Array.isArray(vendorsData.vendors) ? vendorsData.vendors : []);
    } catch (err) {
      console.error("Error loading followed stores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && wooId) {
      fetchFollowedData();
    } else if (!authLoading && !wooId) {
      setLoading(false);
    }
  }, [wooId, authLoading]);

  const handleUnfollow = async (vendorId) => {
    if (!wooId) return;
    setUnfollowingId(vendorId);

    // Optimistic UI update
    setFollowedIds((prev) => prev.filter((id) => String(id) !== String(vendorId)));

    try {
      await fetch("/api/vendors/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          userId: wooId,
          action: "unfollow",
        }),
      });
    } catch (err) {
      console.error("Error unfollowing:", err);
      // Revert if error
      setFollowedIds((prev) => [...prev, vendorId]);
    } finally {
      setUnfollowingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center" dir={dir}>
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  // Filter vendors to only show followed ones
  const followedVendors = vendors.filter((v) =>
    followedIds.some((id) => String(id) === String(v.id))
  );

  return (
    <div className="w-full" dir={dir}>
      <h2 className="text-2xl font-bold mb-8 text-gray-900">{t("pageTitle")}</h2>

      {followedVendors.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-md flex items-center justify-center mb-6 border border-gray-100">
            <Store size={40} className="text-gray-300" />
          </div>
          <h3 className="text-[16px] font-bold mb-2 text-gray-900">
            {t("noStoresYet")}
          </h3>
          <p className="text-gray-500 text-[14px] mb-8 text-center max-w-sm leading-relaxed">
            {t("followStoresDesc")}
          </p>
          <Link
            href="/vendors"
            className="px-10 py-3 bg-black text-white rounded-md font-bold text-[15px] hover:bg-gray-800 transition-all"
          >
            {t("exploreStores")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {followedVendors.map((v) => (
            <div
              key={v.id}
              className="flex flex-col border border-zinc-200 rounded-md overflow-hidden hover:shadow-md transition-shadow bg-white relative"
            >
              {/* Store Header/Banner */}
              <Link
                href={`/vendor/${v.storeSlug || v.id}`}
                className="relative h-24 bg-zinc-100 overflow-hidden block"
              >
                {v.storeBanner ? (
                  <Image
                    src={v.storeBanner}
                    alt={v.storeName || t("storeBanner")}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-100" />
                )}
                <div className="absolute inset-0 bg-black/5" />
              </Link>

              {/* Logo Overlay */}
              <div className="absolute top-14 end-4 w-12 h-12 rounded-md bg-white border border-zinc-200 shadow-md overflow-hidden p-0.5 flex items-center justify-center">
                {v.storeLogo ? (
                  <Image
                    src={v.storeLogo}
                    alt={v.storeName || t("storeLogo")}
                    fill
                    className="object-contain p-0.5"
                  />
                ) : (
                  <span className="text-zinc-900 font-bold text-lg">
                    {v.storeName?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Store Body */}
              <div className="pt-6 pb-4 px-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <Link
                      href={`/vendor/${v.storeSlug || v.id}`}
                      className="block"
                    >
                      <h3 className="text-[15px] font-bold text-zinc-900 hover:text-[#9b2c41] transition-colors leading-tight">
                        {v.storeName}
                      </h3>
                    </Link>
                    {v.storeCategory && (
                      <span className="text-[11px] font-medium text-zinc-500 block mt-0.5">
                        {v.storeCategory}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleUnfollow(v.id)}
                    disabled={unfollowingId === v.id}
                    className="h-7 px-3 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-1 group"
                  >
                    {unfollowingId === v.id && (
                      <Loader2 className="animate-spin" size={10} />
                    )}
                    <span className="group-hover:hidden">{t("following")}</span>
                    <span className="hidden group-hover:inline">{t("unfollow")}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 mt-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={`${i < Math.round(v.rating || 0)
                            ? "text-[#FFA41C] fill-[#FFA41C]"
                            : "text-zinc-200 fill-zinc-200"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#be374f]">
                    {v.rating > 0
                      ? `${v.rating.toFixed(1)}`
                      : t("newStore")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}