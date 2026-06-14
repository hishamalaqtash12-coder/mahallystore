import { getCustomerById, getCustomersByIds } from "@/lib/woocommerce";
import UserAvatar from "@/components/UserAvatar";
import {
  Star,
  MessageCircle,
  ChevronLeft,
  ShieldCheck,
  Users,
  TrendingUp,
  ThumbsUp,
  CircleCheck,
  Heart,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ─── Helpers ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-emerald-50", text: "text-emerald-600" },
  { bg: "bg-amber-50", text: "text-amber-600" },
  { bg: "bg-rose-50", text: "text-rose-600" },
  { bg: "bg-violet-50", text: "text-violet-600" },
];

function getAvatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "VB";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ rating = 5, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-200 fill-zinc-100"
          }
        />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconClass }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function ReviewCard({ f, index }) {
  const color = getAvatarColor(f.userName || f.name || "A");
  const initials = getInitials(f.userName || f.name || "");

  return (
    <div
      className="group bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-4
                 hover:border-zinc-300 hover:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]
                 transition-all duration-300"
    >
      {/* Top */}
      <div className="flex items-center justify-between">
        <StarRating rating={f.rating || 5} size={15} />
        <span className="text-xs text-zinc-400">
          {f.date
            ? new Date(f.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            : "Recently"}
        </span>
      </div>

      {/* Comment */}
      <p className="text-sm text-zinc-500 leading-relaxed flex-1 line-clamp-5">
        &ldquo;{f.comment || "Great experience!"}&rdquo;
      </p>

      {/* Verified Badge */}
      {(f.role === 'vendor' || f.role === 'shop_manager' || f.role === 'administrator') ? (
        <div className="flex items-center gap-1.5 bg-orange-50 rounded-md px-2 py-1 w-fit border border-orange-100">
          <ShieldCheck size={11} className="text-orange-600" />
          <span className="text-[10px] font-black text-orange-700 uppercase tracking-wider">
            Verified Merchant
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 bg-emerald-50 rounded-md px-2 py-1 w-fit border border-emerald-100">
          <CircleCheck size={11} className="text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
            Verified Customer
          </span>
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-2.5 pt-3 border-t border-zinc-100">
        <div className="relative shrink-0">
          <UserAvatar
            customerName={f.userName}
            avatarUrl={f.avatarUrl}
            avatarBgColor={f.avatarBgColor || "#9b8676"}
            className="w-9 h-9 rounded-full text-xs font-semibold border border-zinc-200 text-white"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-zinc-900 leading-tight">
            {f.userName || f.name || "Verified Buyer"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ReviewsPage() {
  let feedbacks = [];
  try {
    const admin = await getCustomerById(1);
    if (admin?.meta_data) {
      const meta = admin.meta_data.find((m) => m.key === "mahally_global_feedback_log");
      if (meta) {
        feedbacks =
          typeof meta.value === "string" ? JSON.parse(meta.value) : meta.value;
      }
    }

    // Dynamically resolve customer avatars from WooCommerce
    if (feedbacks && feedbacks.length > 0) {
      const userIds = feedbacks
        .map(f => f.userId)
        .filter(id => id && Number(id) !== 999 && !isNaN(Number(id)));

      if (userIds.length > 0) {
        try {
          const customers = await getCustomersByIds(userIds);
          const customerMap = {};
          customers.forEach(c => {
            const meta = c.meta_data || [];
            const avatarUrl = meta.find(m => m.key === "mahally_avatar_url")?.value || meta.find(m => m.key === "mahally_store_logo")?.value || null;
            const avatarBgColor = meta.find(m => m.key === "mahally_avatar_bg_color")?.value || "#9b8676";
            customerMap[c.id] = { avatarUrl, avatarBgColor };
          });

          feedbacks = feedbacks.map(f => {
            if (f.userId && customerMap[f.userId]) {
              return {
                ...f,
                avatarUrl: customerMap[f.userId].avatarUrl || f.avatarUrl || "",
                avatarBgColor: customerMap[f.userId].avatarBgColor || f.avatarBgColor || "#9b8676"
              };
            }
            return f;
          });
        } catch (wcErr) {
          console.warn("WooCommerce reviews avatars lookup failed:", wcErr.message);
        }
      }
    }
  } catch (err) {
    console.error("Reviews page fetch error:", err);
  }

  const sortedFeedbacks = [...feedbacks].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  const vendorReviewsCount = sortedFeedbacks.filter(f => 
    f.role === 'vendor' || f.role === 'shop_manager' || f.role === 'administrator'
  ).length;
  const customerReviewsCount = sortedFeedbacks.length - vendorReviewsCount;

  const totalReviews = sortedFeedbacks.length;
  const avgRating =
    totalReviews > 0
      ? (
        sortedFeedbacks.reduce((sum, f) => sum + (f.rating || 5), 0) /
        totalReviews
      ).toFixed(1)
      : "0.0";

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  sortedFeedbacks.forEach((f) => {
    ratingCounts[f.rating || 5]++;
  });

  const topRatingPercent =
    totalReviews > 0
      ? Math.round(((ratingCounts[5] + ratingCounts[4]) / totalReviews) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-zinc-200 pt-8 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
          >
            <ChevronLeft size={15} />
            Back to Marketplace
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
                Community Reviews
              </h1>
              <p className="text-base text-zinc-500 max-w-xl leading-relaxed">
                Real feedback from real shoppers. We use your insights to build a
                better shopping experience for everyone in Jordan.
              </p>
            </div>

            {/* Average rating pill */}
            <div className="flex items-center gap-5 bg-zinc-900 text-white px-6 py-4 rounded-2xl shrink-0">
              <div className="text-center border-r border-white/10 pr-5">
                <p className="text-3xl font-bold leading-none">{avgRating}</p>
                <div className="flex justify-center mt-2">
                  <StarRating rating={Math.round(parseFloat(avgRating))} size={13} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">
                  Global Rating
                </p>
                <p className="text-sm text-zinc-300">
                  Based on {totalReviews} reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon={Users}
            label="Total Contributors"
            value={totalReviews}
            iconClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Satisfaction Rate"
            value={`${topRatingPercent}%`}
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={ThumbsUp}
            label="Verified Purchases"
            value={customerReviewsCount}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Review feed ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <MessageCircle size={18} className="text-zinc-400" />
              <h2 className="text-base font-semibold text-zinc-900">Recent Feedback</h2>
              {totalReviews > 0 && (
                <span className="ml-auto text-xs text-zinc-400 bg-zinc-100 rounded-full px-2.5 py-0.5">
                  {totalReviews} reviews
                </span>
              )}
            </div>

            {sortedFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3">
                  <MessageCircle size={20} className="text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-500 mb-1">No reviews yet</p>
                <p className="text-xs text-zinc-400">Be the first to share your experience</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedFeedbacks.map((f, i) => (
                  <ReviewCard key={i} f={f} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div>
            <div className="bg-zinc-900 text-white rounded-2xl p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <Heart size={16} className="fill-rose-500 text-rose-500" />
                <h3 className="text-sm font-semibold">Rating Breakdown</h3>
              </div>

              <div className="space-y-3.5">
                {[5, 4, 3, 2, 1].map((r) => {
                  const percent =
                    totalReviews > 0
                      ? Math.round((ratingCounts[r] / totalReviews) * 100)
                      : 0;
                  return (
                    <div key={r} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-zinc-300">
                          {r}{" "}
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                        </span>
                        <span className="text-zinc-500">{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every review is verified and checked for authenticity. We believe
                  in 100% transparency.
                </p>
              </div>

              {/* Trust badges */}
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <ShieldCheck size={13} className="text-zinc-500" />
                  100% authentic reviews
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Users size={13} className="text-zinc-500" />
                  Trusted by 10,000+ customers
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}