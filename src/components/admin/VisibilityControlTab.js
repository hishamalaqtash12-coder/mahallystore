"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  Store,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  Save
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

const getMetaValue = (meta_data, key) => {
  return meta_data?.find(m => m.key === key)?.value || "";
};

const ControlRow = ({ item, type, updatingId, onUpdate, t }) => {
  const isRestricted = getMetaValue(item.meta_data, 'mahally_is_restricted') === 'yes';
  const currentReason = getMetaValue(item.meta_data, 'mahally_restriction_reason') || "";
  const showInCarousel = getMetaValue(item.meta_data, 'mahally_show_in_carousel') !== 'no';
  const showInDirectory = getMetaValue(item.meta_data, 'mahally_show_in_directory') !== 'no';

  const [localRestricted, setLocalRestricted] = useState(isRestricted);
  const [localReason, setLocalReason] = useState(currentReason);
  const [localCarousel, setLocalCarousel] = useState(showInCarousel);
  const [localDirectory, setLocalDirectory] = useState(showInDirectory);

  // Sync local state if props change (e.g. after successful save)
  useEffect(() => {
    setLocalRestricted(isRestricted);
    setLocalReason(currentReason);
    setLocalCarousel(showInCarousel);
    setLocalDirectory(showInDirectory);
  }, [isRestricted, currentReason, showInCarousel, showInDirectory]);

  const isDirty = localRestricted !== isRestricted || localReason !== currentReason ||
    (type === 'vendor' && (localCarousel !== showInCarousel || localDirectory !== showInDirectory));

  const name = type === 'vendor'
    ? (getMetaValue(item.meta_data, 'dokan_store_name') || getMetaValue(item.meta_data, 'mahally_store_name') || item.username)
    : item.name;
  const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || '';
  const resolveImage = (src) => {
    if (!src) return null;
    if (src.startsWith('http')) return src;
    // Relative path from WordPress — prepend the WP base URL
    return `${WP_BASE}${src}`;
  };
  const image = type === 'vendor'
    ? resolveImage(getMetaValue(item.meta_data, 'mahally_store_logo') || getMetaValue(item.meta_data, 'mahally_avatar_url') || item.avatar_url)
    : item.images?.[0]?.src;


  return (
    <div className={`bg-white border rounded-lg p-5 mb-4 shadow-sm transition-colors ${localRestricted ? 'border-amber-300 bg-amber-50/10' : 'border-zinc-200'}`}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Info */}
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
            {image ? (
              <Image src={image} alt={name || (type === 'vendor' ? t("vendor") : t("product"))} width={48} height={48} className="object-cover w-full h-full" />
            ) : type === 'vendor' ? <Store className="text-zinc-400" /> : <Package className="text-zinc-400" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 line-clamp-1">{name}</h3>
            <p className="text-xs text-zinc-500">ID: #{item.id}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand"
                checked={localRestricted}
                onChange={(e) => setLocalRestricted(e.target.checked)}
              />
              <span className="text-sm font-medium text-zinc-700">{t("restrictFromPublic")}</span>
            </label>
            {localRestricted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle size={10} /> {t("hiddenBadge")}
              </span>
            )}
          </div>

          {localRestricted && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-zinc-600">{t("restrictionReasonLabel")}</label>
              <input
                type="text"
                value={localReason}
                onChange={(e) => setLocalReason(e.target.value)}
                placeholder={t("restrictionReasonPlaceholder")}
                className="w-full text-sm border border-zinc-300 rounded-md px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>
          )}

          {type === 'vendor' && !localRestricted && (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand"
                  checked={localCarousel}
                  onChange={(e) => setLocalCarousel(e.target.checked)}
                />
                <span className="text-sm font-medium text-zinc-700">{t("showInCarousel")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand"
                  checked={localDirectory}
                  onChange={(e) => setLocalDirectory(e.target.checked)}
                />
                <span className="text-sm font-medium text-zinc-700">{t("showInDirectory")}</span>
              </label>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0 pt-2 md:pt-0">
          <button
            onClick={() => onUpdate(item.id, type, localRestricted, localReason, localCarousel, localDirectory)}
            disabled={!isDirty || updatingId === item.id}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${updatingId === item.id
              ? 'bg-zinc-100 text-zinc-400'
              : isDirty
                ? 'bg-brand text-white hover:bg-brand-dark shadow-md'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
          >
            {updatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VisibilityControlTab() {
  const t = useTranslations("AdminVisibility");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [activeTab, setActiveTab] = useState('vendors');
  const [searchQuery, setSearchQuery] = useState("");

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch all vendors (including restricted) and products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // We need custom API routes that return ALL items including restricted ones for the admin
        const [vRes, pRes] = await Promise.all([
          fetch('/api/vendors?includeRestricted=true&per_page=100'),
          fetch('/api/products?includeRestricted=true&per_page=100')
        ]);

        if (vRes.ok) {
          const vData = await vRes.json();
          setVendors(vData);
        }
        if (pRes.ok) {
          const pData = await pRes.json();
          setProducts(pData.products || pData.data || []);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (id, type, isRestricted, reason, showInCarousel, showInDirectory) => {
    setUpdatingId(id);
    try {
      const payload = {
        id,
        type,
        is_restricted: isRestricted,
        restriction_reason: reason
      };
      if (type === 'vendor') {
        payload.show_in_carousel = showInCarousel;
        payload.show_in_directory = showInDirectory;
      }

      const res = await fetch('/api/admin/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Update local state
        const resData = await res.json();
        if (type === 'vendor') {
          setVendors(prev => prev.map(v => v.id === id ? { ...v, meta_data: resData.data.meta_data } : v));
        } else {
          setProducts(prev => prev.map(p => p.id === id ? { ...p, meta_data: resData.data.meta_data } : p));
        }
      } else {
        alert(t("failedUpdateVisibility"));
      }
    } catch (e) {
      alert(t("failedUpdateVisibility"));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const isApproved = getMetaValue(v.meta_data, 'dokan_enable_selling') === 'yes';
    if (!isApproved) return false;

    const q = searchQuery.toLowerCase();
    const name = getMetaValue(v.meta_data, 'dokan_store_name') || getMetaValue(v.meta_data, 'mahally_store_name') || v.username || "";
    return name.toLowerCase().includes(q) || v.id.toString().includes(q);
  });

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.id.toString().includes(q);
  });

  return (
    <div className="mx-auto pb-12" dir={dir}>


      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex bg-white rounded-lg p-1 border border-zinc-200 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'vendors' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'}`}
          >
            <Store size={16} /> {t("vendorsTab")}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'}`}
          >
            <Package size={16} /> {t("productsTab")}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pe-10 ps-4 rounded-lg border border-zinc-200 text-sm focus:border-brand outline-none shadow-sm transition-all"
          />
          <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-zinc-200">
          <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
          <p className="text-sm text-zinc-500 font-medium">{t("loadingData")}</p>
        </div>
      ) : (
        <div>
          {activeTab === 'vendors' && (
            <>
              {filteredVendors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                  <p className="text-zinc-500">{t("noItemsFound")}</p>
                </div>
              ) : (
                filteredVendors.map(vendor => (
                  <ControlRow
                    key={vendor.id}
                    item={vendor}
                    type="vendor"
                    updatingId={updatingId}
                    onUpdate={handleUpdate}
                    t={t}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'products' && (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                  <p className="text-zinc-500">{t("noItemsFound")}</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <ControlRow
                    key={product.id}
                    item={product}
                    type="product"
                    updatingId={updatingId}
                    onUpdate={handleUpdate}
                    t={t}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}