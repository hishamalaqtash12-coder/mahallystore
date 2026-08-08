"use client";

import { useAuth } from "@/context/AuthContext";
import { ChevronRight, Edit3, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import UserAvatar from "@/components/UserAvatar";
import { useLocale, useTranslations } from "next-intl";

const AVATAR_COLORS = [
  "#9b8676", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"
];

export default function AccountProfilePage() {
  const t = useTranslations("AccountProfile");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const {
    user,
    wooId,
    email,
    phone,
    loading,
    isApprovedVendor,
    avatarUrl,
    setAvatarUrl,
    avatarBgColor,
    setAvatarBgColor,
    isVendor,
    customerName
  } = useAuth();

  const [reviewCount, setReviewCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [pendingColor, setPendingColor] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showColorConfirm, setShowColorConfirm] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);

  useEffect(() => {
    if (wooId) {
      const userEmail = user?.email || email;
      const reviewsUrl = `/api/reviews?user_id=${wooId}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ""}`;
      fetch(reviewsUrl)
        .then((r) => r.json())
        .then((data) => {
          if (data.reviews) setReviewCount(data.reviews.length);
        })
        .catch(() => { });
    }
  }, [wooId, user, email]);

  if (loading) return null;

  const currentProfilePic = avatarUrl;

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file || !wooId) return;

    if (!currentProfilePic) {
      setPendingFile(file);
      setShowUploadConfirm(true);
      return;
    }
    doImageUpload(file);
  };

  const doImageUpload = async (file) => {
    if (!file || !wooId) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", isVendor ? "logo" : "avatar");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) throw new Error(uploadData.error);

      const updates = { meta_data: [{ key: "mahally_avatar_url", value: uploadData.url }] };
      if (isVendor) {
        updates.meta_data.push({ key: "mahally_store_logo", value: uploadData.url });
      }

      const updateRes = await fetch(
        isVendor ? "/api/vendors/update-profile" : "/api/auth/update-profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isVendor
              ? {
                id: wooId,
                meta: {
                  mahally_avatar_url: uploadData.url,
                  mahally_store_logo: uploadData.url,
                },
              }
              : { wooId, updates }
          ),
        }
      );

      if (!updateRes.ok) throw new Error("Failed to update profile");

      setAvatarUrl(uploadData.url);

      const savedUser = localStorage.getItem("mahally_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.avatarUrl = uploadData.url;
        localStorage.setItem("mahally_user", JSON.stringify(parsed));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(t("uploadFailed"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleColorClick = (color) => {
    if (!wooId) return;

    if (currentProfilePic) {
      setPendingColor(color);
      setShowColorConfirm(true);
      return;
    }
    doColorSelect(color);
  };

  const doColorSelect = async (color) => {
    if (!wooId) return;

    try {
      setIsUploading(true);

      const updates = {
        meta_data: [
          { key: "mahally_avatar_url", value: "" },
          { key: "mahally_avatar_bg_color", value: color },
        ],
      };
      if (isVendor) {
        updates.meta_data.push({ key: "mahally_store_logo", value: "" });
      }

      const updateRes = await fetch(
        isVendor ? "/api/vendors/update-profile" : "/api/auth/update-profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isVendor
              ? {
                id: wooId,
                meta: {
                  mahally_avatar_url: "",
                  mahally_store_logo: "",
                  mahally_avatar_bg_color: color,
                },
              }
              : { wooId, updates }
          ),
        }
      );

      if (!updateRes.ok) throw new Error("Failed to update profile");

      setAvatarUrl(null);
      setAvatarBgColor(color);

      const savedUser = localStorage.getItem("mahally_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.avatarUrl = null;
        parsed.avatarBgColor = color;
        localStorage.setItem("mahally_user", JSON.stringify(parsed));
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(t("colorUpdateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full" dir={dir}>
      <div className="flex items-center gap-6 mb-8">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept="image/*"
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer group"
          >
            <UserAvatar
              user={user}
              customerName={customerName}
              email={email}
              avatarUrl={currentProfilePic}
              avatarBgColor={avatarBgColor}
              className="w-20 h-20 rounded-md text-3xl"
            />

            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
              <Edit3 size={20} className="text-white" />
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="flex gap-1.5 mt-1">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${!currentProfilePic && avatarBgColor === color
                    ? "border-black scale-110"
                    : "border-transparent hover:scale-110 shadow-sm"
                  }`}
                style={{ backgroundColor: color }}
                title={t("useColorTitle")}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {customerName || user?.displayName || t("user")}
            </h2>
            <button className="text-gray-400 hover:text-black transition-colors p-1">
              <Edit3 size={18} />
            </button>
          </div>
          <div className="flex items-center gap-6 text-[14px] mt-1">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
              <Link href="/account/reviews" className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{reviewCount}</span>
                <span className="text-gray-500">{t("reviews")}</span>
              </Link>
            </div>
            <div className="w-[1px] h-4 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">0</span>
              <span className="text-gray-500">{t("helpfuls")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[13px] text-emerald-600 mb-8 font-medium bg-emerald-50 p-3 rounded-md border border-emerald-100">
        <ShieldCheck size={16} />
        <span>{t("privacyNote")}</span>
      </div>

      <div className="bg-white rounded-md border border-gray-100 p-10 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center mb-6 border border-gray-100">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 8h16M4 12h16M4 16h16" />
          </svg>
        </div>
        <h3 className="text-[16px] font-bold mb-2">{t("profileDetails")}</h3>
        <p className="text-[14px] text-gray-500 mb-8 text-center max-w-sm">
          {t("manageInfo")}
        </p>
        <div className="w-full max-w-md space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-md border border-gray-50">
            <span className="text-gray-500 text-[13px] font-medium uppercase tracking-wider">
              {t("email")}
            </span>
            <span className="font-bold text-[14px] text-gray-900">
              {email || t("notSet")}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-md border border-gray-50">
            <span className="text-gray-500 text-[13px] font-medium uppercase tracking-wider">
              {t("phone")}
            </span>
            <span className="font-bold text-[14px] text-gray-900">
              {phone || user?.phoneNumber || t("notSet")}
            </span>
          </div>
        </div>
        <Link
          href="/account/security"
          className="mt-8 px-10 py-3 bg-black text-white rounded-md font-bold text-[15px] hover:bg-gray-800 transition-all"
        >
          {t("accountSecurity")}
        </Link>
      </div>

      {/* Confirmation: switching from picture to color */}
      <ConfirmationModal
        isOpen={showColorConfirm}
        onClose={() => {
          setShowColorConfirm(false);
          setPendingColor(null);
        }}
        onConfirm={() => {
          setShowColorConfirm(false);
          if (pendingColor) doColorSelect(pendingColor);
          setPendingColor(null);
        }}
        title={t("removePictureTitle")}
        message={t("removePictureMessage")}
        confirmText={t("yesUseInitial")}
        cancelText={t("keepPicture")}
        type="warning"
        isLoading={isUploading}
      />

      {/* Confirmation: switching from color/initial to picture */}
      <ConfirmationModal
        isOpen={showUploadConfirm}
        onClose={() => {
          setShowUploadConfirm(false);
          setPendingFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onConfirm={() => {
          setShowUploadConfirm(false);
          if (pendingFile) doImageUpload(pendingFile);
          setPendingFile(null);
        }}
        title={t("uploadPictureTitle")}
        message={t("uploadPictureMessage")}
        confirmText={t("yesUpload")}
        cancelText={t("keepInitials")}
        type="info"
        isLoading={isUploading}
      />
    </div>
  );
}