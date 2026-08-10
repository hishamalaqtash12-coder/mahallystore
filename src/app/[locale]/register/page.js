"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Phone, ShieldCheck, ArrowRight, RotateCcw, Loader2, CheckCircle2, Mail, User, Lock, Store, ChevronRight, Clock, Info, ChevronDown, Eye, EyeOff, ShoppingBag, Building2, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Loader from "@/components/Loader";

const getStoreCategories = (t) => [
  t("catFashion") || "الأزياء والملابس",
  t("catElectronics") || "الإلكترونيات",
  t("catHome") || "المنزل والمعيشة",
  t("catFood") || "الأطعمة والمشروبات",
  t("catBeauty") || "الصحة والجمال",
  t("catOutdoor") || "الرياضة في الهواء الطلق",
  t("catCars") || "السيارات",
  t("catBooks") || "الكتب والقرطاسية",
  t("catToys") || "ألعاب وأطفال",
  t("catOther") || "أخرى"
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations("Register");
  const locale = useLocale();
  const isAr = locale === "ar";
  const pathname = usePathname();

  const handleLanguageSwitch = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  const roleParam = searchParams.get("role");
  const initialRole = (roleParam === "vendor" || roleParam === "customer") ? roleParam : null;

  const [step, setStep] = useState(initialRole ? "form" : "role");
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [hoveredRole, setHoveredRole] = useState(null);

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+962");
  const [password] = useState(() => Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-8) + "!1Aa");

  // Vendor-specific fields
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeCategory, setStoreCategory] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const otpRefs = useRef([]);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (user && !authLoading) router.replace(redirectTo);
  }, [user, authLoading, redirectTo, router]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  useEffect(() => {
    if (step === "phone_otp" || step === "email_otp") {
      const timer = setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  const handleRolePick = (role) => {
    setSelectedRole(role);
    setStep("form");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const finalName = selectedRole === "vendor" ? storeName : name;

    // Email validation
    if (!validateEmail(email)) {
      setError(t("invalidEmail"));
      return;
    }

    if (!finalName || !email || phone.replace(/\D/g, "").length < 10) {
      setError(t("fillRequiredFields"));
      return;
    }
    if (selectedRole === "vendor" && !storeCategory) {
      setError(t("fillStoreDetails"));
      return;
    }

    setLoading(true);
    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });

      if (!checkRes.ok) {
        if (checkRes.status === 503) {
          throw new Error(t("serviceOffline"));
        }
        throw new Error(t("serviceError", { status: checkRes.status }));
      }

      const checkData = await checkRes.json();
      if (checkData.exists) {
        setError(t("accountExists"));
        setLoading(false);
        return;
      }

      const otpRes = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" })
      });
      const otpData = await otpRes.json();
      if (otpRes.ok) {
        setStep("phone_otp");
        setCountdown(60);
      } else {
        throw new Error(otpData.error || t("sendCodeFailed"));
      }
    } catch (err) {
      setError(err.message || t("verificationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const syncToDB = async () => {
    await fetch("/api/auth/register-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selectedRole === "vendor" ? storeName : name,
        email,
        phone,
        password,
        role: selectedRole,
        storeData: selectedRole === "vendor" ? { storeName, storeDescription, storeCategory } : {},
      }),
    });
  };

  const handleChoosePhone = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" })
      });
      const data = await res.json();

      if (res.ok) {
        setStep("phone_otp");
        setCountdown(60);
      } else {
        throw new Error(data.error || t("sendCodeFailed"));
      }
    } catch (err) {
      setError(err.message || t("sendOTPFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleChooseEmail = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "send" })
      });
      const data = await res.json();

      if (res.ok) {
        setStep("email_otp");
        setCountdown(60);
      } else {
        throw new Error(data.error || t("sendCodeFailed"));
      }
    } catch (err) {
      setError(err.message || t("emailVerificationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    const code = emailOtp.join("");
    if (code.length < 6) {
      setError(t("fullCodeRequired"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, action: "verify" })
      });
      const data = await res.json();

      if (res.ok) {
        await syncToDB();

        try {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
        } catch (err) {
          console.warn("Auto-login after registration failed", err);
        }

        if (selectedRole === "vendor") {
          setStep("vendor_pending");
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => { });
          localStorage.removeItem("mahally_user");
        } else {
          localStorage.setItem("mahally_user", JSON.stringify({ email, phone }));
          setStep("success");
          setTimeout(() => {
            window.location.replace(redirectTo);
          }, 1500);
        }
      } else {
        setError(data.error || t("invalidCode"));
      }
    } catch (err) {
      setError(err.message || t("verifyCodeFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError(t("fullCodeRequired"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action: "verify" })
      });
      const data = await res.json();

      if (res.ok) {
        await syncToDB();

        const phoneEmail = `phone_${phone.replace("+", "")}@mahally.jo`;
        try {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email || phoneEmail, password })
          });
        } catch (err) {
          console.warn("Auto-login after registration failed", err);
        }

        if (selectedRole === "vendor") {
          setStep("vendor_pending");
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => { });
          localStorage.removeItem("mahally_user");
        } else {
          localStorage.setItem("mahally_user", JSON.stringify({ email: email || phoneEmail, phone }));
          setStep("success");
          setTimeout(() => {
            window.location.replace(redirectTo);
          }, 1500);
        }
      } else {
        setError(data.error || t("invalidCode"));
      }
    } catch (err) {
      setError(err.message || t("verifyCodeFailed"));
    } finally {
      setLoading(false);
    }
  };



  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };


  /* ─────────────────────────────── RENDER ─────────────────────────────── */

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-12">

      <div className="w-full max-w-[350px]">
        {/* Logo */}
        <div className="text-center mb-4 flex justify-center">
          <Link href="/" className="inline-block">
            <Image
              src="/mahally-logo.webp"
              alt="Mahally.jo Logo"
              width={160}
              height={50}
              className="object-contain h-auto w-auto"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-7 shadow-sm">

          {/* ── STEP 0: Role Picker ── */}
          {step === "role" && (
            <div className="space-y-6">
              {/* Header */}
              <div className={`text-center space-y-1`}>
                <h1 className="text-[26px] font-bold text-zinc-900">{t("title")}</h1>
                <p className="text-[13px] text-zinc-500">{t("howToJoin")}</p>
              </div>

              {/* Role Cards */}
              <div className="space-y-3">
                {/* Customer Card */}
                <button
                  onClick={() => handleRolePick("customer")}
                  onMouseEnter={() => setHoveredRole("customer")}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-300 group relative overflow-hidden cursor-pointer ${hoveredRole === "customer"
                    ? "border-brand bg-gradient-to-br from-brand-light/30 to-transparent shadow-md"
                    : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                    }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className={`flex items-center gap-4 relative z-10 ${isAr ? 'flex-row' : 'flex-row'}`}>
                    {/* Icon - Always on the left */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${hoveredRole === "customer"
                      ? "bg-brand text-white shadow-lg shadow-brand/30"
                      : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200"
                      }`}>
                      <ShoppingBag size={28} strokeWidth={1.5} />
                    </div>

                    {/* Text - Always on the right */}
                    <div className={`flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-2 `}>
                        <p className={`text-[15px] font-bold transition-colors duration-300 ${hoveredRole === "customer" ? "text-brand" : "text-zinc-900"
                          }`}>
                          {t("customer")}
                        </p>
                        {hoveredRole === "customer" && (
                          <Sparkles size={16} className="text-brand animate-pulse" />
                        )}
                      </div>
                      <p className={`text-[12px] text-zinc-500 mt-0.5 ${isAr ? 'text-right' : 'text-left'}`}>
                        {t("customerDesc")}
                      </p>
                    </div>

                    {/* Arrow - Always on the far right, RTL-aware */}
                    <ChevronRight size={20} className={`text-zinc-300 transition-all duration-300 flex-shrink-0 ${isAr ? 'rotate-180' : ''
                      } ${hoveredRole === "customer"
                        ? isAr ? 'text-brand -translate-x-1' : 'text-brand translate-x-1'
                        : isAr ? 'translate-x-2 opacity-0' : '-translate-x-2 opacity-0'
                      }`} />
                  </div>
                </button>

                {/* Vendor Card */}
                <button
                  onClick={() => handleRolePick("vendor")}
                  onMouseEnter={() => setHoveredRole("vendor")}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-300 group relative overflow-hidden cursor-pointer ${hoveredRole === "vendor"
                    ? "border-amber-500 bg-gradient-to-br from-amber-50/50 to-transparent shadow-md"
                    : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                    }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className={`flex items-center gap-4 relative z-10 ${isAr ? 'flex-row' : 'flex-row'}`}>
                    {/* Icon - Always on the left */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${hoveredRole === "vendor"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                      : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200"
                      }`}>
                      <Building2 size={28} strokeWidth={1.5} />
                    </div>

                    {/* Text - Always on the right */}
                    <div className={`flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-2 `}>
                        <p className={`text-[15px] font-bold transition-colors duration-300 ${hoveredRole === "vendor" ? "text-amber-600" : "text-zinc-900"
                          }`}>
                          {t("vendor")}
                        </p>
                        {hoveredRole === "vendor" && (
                          <Sparkles size={16} className="text-amber-500 animate-pulse" />
                        )}
                      </div>
                      <p className={`text-[12px] text-zinc-500 mt-0.5 ${isAr ? 'text-right' : 'text-left'}`}>
                        {t("vendorDesc")}
                      </p>
                    </div>

                    {/* Arrow - Always on the far right, RTL-aware */}
                    <ChevronRight size={20} className={`text-zinc-300 transition-all duration-300 flex-shrink-0 ${isAr ? 'rotate-180' : ''
                      } ${hoveredRole === "vendor"
                        ? isAr ? 'text-amber-500 -translate-x-1' : 'text-amber-500 translate-x-1'
                        : isAr ? 'translate-x-2 opacity-0' : '-translate-x-2 opacity-0'
                      }`} />
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-100 text-center">
                <p className={`text-[12px] text-zinc-600 ${isAr ? 'text-right' : 'text-left'}`}>
                  {t("alreadyHaveAccount")}{" "}
                  <Link
                    href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                    className="text-[#0066c0] hover:text-[#8f2d4a] hover:underline font-bold"
                  >
                    {t("login")}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1: Basic Details Form ── */}
          {step === "form" && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Back button with role indicator */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="text-[13px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
                >
                  <ArrowRight size={16} className={isAr ? 'rotate-180' : ''} />
                  {t("changeAccountType")}
                </button>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${selectedRole === "vendor"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-brand-light/50 text-brand-dark"
                  }`}>
                  {selectedRole === "vendor" ? t("vendor") : t("customer")}
                </span>
              </div>

              <h1 className="text-[26px] font-bold text-zinc-900 mb-2">{t("createAccount")}</h1>

              <div className="space-y-3">
                {selectedRole === "customer" && (
                  <div className="space-y-1">
                    <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("fullName")}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={t("fullNamePlaceholder")}
                      required
                      className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("mobileNumber")}</label>
                  <div dir="ltr" className="flex h-[31px] rounded-[3px] border border-zinc-400 shadow-inner focus-within:border-[#be374f] focus-within:ring-1 focus-within:ring-[#be374f] overflow-hidden transition-all bg-white">
                    <div className="flex items-center gap-1 bg-zinc-50 border-r border-zinc-400 px-2 text-[13px] text-zinc-700 select-none">
                      <span>+962</span>
                      <ChevronDown size={14} className="text-zinc-500" />
                    </div>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone.replace(/^\+962/, "")}
                      onChange={e => {
                        let val = e.target.value.replace(/[^\d\s-]/g, "");
                        if (val.startsWith("0")) val = val.substring(1);
                        setPhone("+962" + val);
                      }}
                      placeholder="7X XXX XXXX"
                      required
                      className="flex-1 h-full bg-transparent px-2 text-[13px] outline-none min-w-0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("emailAddress")}</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all"
                  />
                </div>

                {selectedRole === "vendor" && (
                  <div className="pt-2">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent my-4" />
                    <h3 className="text-[16px] font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Store size={18} className="text-amber-500" />
                      {t("storeDetails")}
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("storeNameLabel")}</label>
                        <input
                          type="text"
                          value={storeName}
                          onChange={e => setStoreName(e.target.value)}
                          placeholder={t("storeNamePlaceholder")}
                          required
                          className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all"
                        />
                        <p className="text-[11px] text-zinc-500 mt-1 pe-0.5">{t("storeNameHint")}</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("storeCategory")}</label>
                        <select
                          value={storeCategory}
                          onChange={e => setStoreCategory(e.target.value)}
                          required
                          className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 text-[13px] shadow-sm focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all"
                        >
                          <option value="">{t("chooseCategory")}</option>
                          {getStoreCategories(t).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("storeDescLabel")}</label>
                        <textarea
                          value={storeDescription}
                          onChange={e => setStoreDescription(e.target.value)}
                          placeholder={t("storeDescPlaceholder")}
                          rows={3}
                          className="w-full bg-white border border-zinc-400 rounded-[3px] px-2 py-1 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error message with login link */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                  </div>
                  {/* Show login link if the error is about existing account */}
                  {error === t("accountExists") && (
                    <div className="flex justify-end mt-1">
                      <Link
                        href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                        className="text-[12px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline font-bold"
                      >
                        {t("loginNow")} →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[31px] bg-gradient-to-b from-[#f7dfa1] to-[#f0c14b] border border-[#a88734] hover:border-[#9c7d2e] rounded-[3px] text-[13px] shadow-sm active:from-[#edc04b] active:to-[#edc04b] flex items-center justify-center disabled:opacity-60"
              >
                {loading ? <Loader size="sm" text="" /> : t("continueToVerification")}
              </button>

              <div className="pt-4 space-y-3">
                <p className="text-[12px] text-zinc-900 leading-snug">
                  {t("termsAgreed")}{" "}
                  <Link href="/conditions" className="text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                    {t("termsOfUse")}
                  </Link>{" "}
                  {t("termsAgreedSuffix")}
                </p>
              </div>
            </form>
          )}

          {/* ── STEP 3: Choose Verification Method ── */}
          {step === "verify_method" && (
            <div className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">{t("accountVerification")}</h1>

              <p className="text-[13px] text-zinc-900 leading-snug">{t("howToReceiveOTP")}</p>

              <div className="space-y-2">
                <button
                  onClick={handleChoosePhone}
                  disabled={loading}
                  className="w-full h-auto p-4 bg-white border border-zinc-300 rounded-[3px] hover:bg-zinc-50 text-end transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 group-hover:bg-brand/10 rounded-full flex items-center justify-center">
                      <Phone size={16} className="text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900">{t("verifyViaSMS")}</p>
                      <p className="text-[11px] text-zinc-500">{t("sendCodeTo")} <span dir="ltr" className="inline-block">{phone}</span></p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleChooseEmail}
                  disabled={loading || !email}
                  className="w-full h-auto p-4 bg-white border border-zinc-300 rounded-[3px] hover:bg-zinc-50 text-end transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 group-hover:bg-brand/10 rounded-full flex items-center justify-center">
                      <Mail size={16} className="text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900">{t("verifyViaEmail")}</p>
                      <p className="text-[11px] text-zinc-500">{email ? `${t("sendCodeTo")} ${email}` : t("provideEmailFirst")}</p>
                    </div>
                  </div>
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                  <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline"
                >
                  رجوع
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4A: Phone OTP ── */}
          {step === "phone_otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">{t("verification")}</h1>
              <p className="text-[13px] text-zinc-900 leading-snug">
                {t("codeSentSMS")} <span className="font-bold inline-block" dir="ltr">{phone}</span>.
              </p>

              <div className="flex gap-2 justify-center py-4" dir="ltr">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                    className="w-10 h-[31px] text-center text-lg font-bold border border-zinc-400 rounded-[3px] bg-white focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none"
                  />
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                  <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full h-[31px] bg-gradient-to-b from-[#f7dfa1] to-[#f0c14b] border border-[#a88734] rounded-[3px] text-[13px] shadow-sm flex items-center justify-center disabled:opacity-60"
              >
                {loading ? <Loader size="sm" text="" /> : t("verifyCode")}
              </button>

              <div className="text-center pt-4">
                {countdown > 0 ? (
                  <p className="text-[12px] text-zinc-600">{t("resendCodeIn")} {countdown}ث</p>
                ) : (
                  <button type="button" onClick={handleChoosePhone} className="text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                    {t("resendCode")}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 4B: Email OTP ── */}
          {step === "email_otp" && (
            <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">{t("verification")}</h1>
              <p className="text-[13px] text-zinc-900 leading-snug">
                {t("codeSentEmail")} <span className="font-bold">{email}</span>.
              </p>

              <div className="flex gap-2 justify-center py-4" dir="ltr">
                {emailOtp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      const val = e.target.value;
                      if (!/^\d?$/.test(val)) return;
                      const next = [...emailOtp];
                      next[i] = val;
                      setEmailOtp(next);
                      if (val && i < 5) otpRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !emailOtp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                    }}
                    className="w-10 h-[31px] text-center text-lg font-bold border border-zinc-400 rounded-[3px] bg-white focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none"
                  />
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                  <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || emailOtp.join("").length < 6}
                className="w-full h-[31px] bg-gradient-to-b from-[#f7dfa1] to-[#f0c14b] border border-[#a88734] rounded-[3px] text-[13px] shadow-sm flex items-center justify-center disabled:opacity-60"
              >
                {loading ? <Loader size="sm" text="" /> : t("verifyCode")}
              </button>

              <div className="text-center pt-4">
                {countdown > 0 ? (
                  <p className="text-[12px] text-zinc-600">{t("resendCodeIn")} {countdown}ث</p>
                ) : (
                  <button type="button" onClick={handleChooseEmail} className="text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                    {t("resendCode")}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 5: Vendor Pending ── */}
          {step === "vendor_pending" && (
            <div className="text-center py-8 space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-amber-50 border-4 border-amber-100 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock size={36} className="text-amber-500" />
                </div>
              </div>
              <h2 className="text-[20px] font-bold text-zinc-900">{t("applicationSubmitted")}</h2>
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                {t("thanksForSubmitting")}{" "}
                <span className="font-bold">{selectedRole === "vendor" ? storeName : name}</span>
                {t("storeUnderApproval")}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-start space-y-2">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    {t("vendorPendingNote")}
                  </p>
                </div>
              </div>
              <div className="pt-4 space-y-3">
                <button
                  disabled
                  className="w-full h-[31px] bg-zinc-200 border border-zinc-300 rounded-[3px] text-zinc-500 text-[13px] flex items-center justify-center shadow-inner cursor-not-allowed font-medium"
                >
                  {t("underReview")}
                </button>
                <Link href="/" className="block text-[12px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                  {t("backToHome")}
                </Link>
              </div>
            </div>
          )}

          {/* ── STEP 6: Success ── */}
          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
              <h2 className="text-[20px] font-bold text-zinc-900">
                {t("welcome")} {selectedRole === "vendor" ? storeName : name}!
              </h2>
              <p className="text-[13px] text-zinc-500">{t("accountReady")}</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-100 text-center space-y-2">
          <div className="flex justify-center gap-6 text-[11px] text-[#0066c0]">
            <Link href="/conditions" className="hover:text-[#8f2d4a] hover:underline">{t("termsOfUse")}</Link>
            <button type="button" onClick={handleLanguageSwitch} className="hover:text-[#8f2d4a] hover:underline font-bold">
              {locale === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500" suppressHydrationWarning>&copy; {new Date().getFullYear()} Mahally.jo</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#be374f]" size={32} /></div>}>
      <RegisterContent />
    </Suspense>
  );
}