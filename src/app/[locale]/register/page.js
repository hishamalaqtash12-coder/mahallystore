"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Phone, ShieldCheck, ArrowRight, RotateCcw, Loader2, CheckCircle2, Mail, User, Lock, Store, ChevronRight, Clock, Info, ChevronDown, Eye, EyeOff } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
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
  const { user } = useAuth();
  const t = useTranslations("Register");

  const [step, setStep] = useState("role");     // "role" | "form" | "vendor_store" | "verify_method" | "phone_otp" | "email_sent" | "success"
  const [selectedRole, setSelectedRole] = useState(null); // "customer" | "vendor"

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+962");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation logic
  const isLengthValid = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isLengthValid && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Vendor-specific fields
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeCategory, setStoreCategory] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (user && step === "role") router.replace(redirectTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, redirectTo]);

  // Read ?role parameter on mount
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "vendor" || roleParam === "customer") {
      setSelectedRole(roleParam);
      setStep("form");
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (step === "phone_otp" || step === "email_otp") {
      const timer = setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Step 1 → 2: pick role
  const handleRolePick = (role) => {
    setSelectedRole(role);
    setStep("form");
  };

  // Step 2 → 3: submit base details
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const finalName = selectedRole === "vendor" ? storeName : name;

    if (!finalName || !email || !password || !confirmPassword || phone.replace(/\D/g, "").length < 10) {
      setError("Please fill in all required fields correctly.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password does not meet the requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    if (selectedRole === "vendor" && !storeCategory) {
      setError("Please fill in your store details.");
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
          throw new Error("Registration service is currently offline. Please try again later.");
        }
        throw new Error(`Service error (${checkRes.status})`);
      }

      const checkData = await checkRes.json();
      if (checkData.exists) {
        setError("An account with this email or phone already exists. Please sign in.");
        setLoading(false);
        return;
      }

      // Send SMS verification code directly
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
        throw new Error(otpData.error || "Failed to send code.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify availability or send verification code. Please try again.");
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
        throw new Error(data.error || "Failed to send code.");
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);

  const handleChooseEmail = async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Generate and send 6-digit code via API
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
        throw new Error(data.error || "Failed to send code.");
      }
    } catch (err) {
      setError(err.message || "Failed to initiate email verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    const code = emailOtp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
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
        // SUCCESS: Email is verified, now add to WooCommerce & Firebase
        // 1. Sync to DB FIRST so AuthContext doesn't sign out the user upon creation
        await syncToDB();

        // 2. Set the WooCommerce Session
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
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          localStorage.removeItem("mahally_user");
        } else {
          localStorage.setItem("mahally_user", JSON.stringify({ email, phone }));
          setStep("success");
          setTimeout(() => {
            window.location.replace(redirectTo);
          }, 1500);
        }
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify code. Please try again.");
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

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
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
        // 1. Sync to DB FIRST so AuthContext doesn't sign out the user upon creation
        await syncToDB();

        // 2. Set the WooCommerce Session using the email we just registered
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
          // Logout to clear the session for pending vendors
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          localStorage.removeItem("mahally_user");
        } else {
          localStorage.setItem("mahally_user", JSON.stringify({ email: email || phoneEmail, phone }));
          setStep("success");
          setTimeout(() => {
            window.location.replace(redirectTo);
          }, 1500);
        }
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
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
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-7 shadow-sm">

          {/* ── STEP 0: Role Picker ── */}
          {step === "role" && (
            <div className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">{t("title")}</h1>

              <div className="space-y-3">
                <p className="text-[13px] font-bold text-zinc-900">{t("howToJoin")}</p>

                <div className="space-y-2">
                  <button
                    onClick={() => handleRolePick("customer")}
                    className="w-full h-auto p-4 bg-white border border-zinc-300 rounded-[3px] hover:bg-zinc-50 text-end transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-lg">🛍️</div>
                      <div>
                        <p className="text-[13px] font-bold text-zinc-900">{t("customer")}</p>
                        <p className="text-[11px] text-zinc-500">{t("customerDesc")}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRolePick("vendor")}
                    className="w-full h-auto p-4 bg-white border border-zinc-300 rounded-[3px] hover:bg-zinc-50 text-end transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-lg">🏪</div>
                      <div>
                        <p className="text-[13px] font-bold text-zinc-900">{t("vendor")}</p>
                        <p className="text-[11px] text-zinc-500">{t("vendorDesc")}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <p className="text-[12px] text-zinc-900 leading-snug">
                  {t("alreadyHaveAccount")} <Link href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"} className="text-[#0066c0] hover:text-[#8f2d4a] hover:underline font-bold">{t("login")}</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1: Basic Details Form ── */}
          {step === "form" && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">{t("title")}</h1>

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
                    className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all text-end"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("password")}</label>
                  <div className="relative" dir="ltr">
                    <input
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      required
                      className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 ps-8 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all text-end"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute start-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="mt-2 text-[11px] space-y-1 bg-zinc-50 p-2 border border-zinc-200 rounded">
                      <p className={`flex items-center gap-1 ${isLengthValid ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        <CheckCircle2 size={12} className={isLengthValid ? 'text-emerald-600' : 'text-zinc-300'} /> 8 أحرف على الأقل
                      </p>
                      <p className={`flex items-center gap-1 ${hasUpper && hasLower ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        <CheckCircle2 size={12} className={hasUpper && hasLower ? 'text-emerald-600' : 'text-zinc-300'} /> أحرف كبيرة وصغيرة
                      </p>
                      <p className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        <CheckCircle2 size={12} className={hasNumber ? 'text-emerald-600' : 'text-zinc-300'} /> رقم واحد على الأقل
                      </p>
                      <p className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        <CheckCircle2 size={12} className={hasSpecial ? 'text-emerald-600' : 'text-zinc-300'} /> رمز خاص واحد على الأقل
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("confirmPassword")}</label>
                  <div className="relative" dir="ltr">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      dir="ltr"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full h-[31px] bg-white border ${confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-zinc-400'} rounded-[3px] px-2 ps-8 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all text-end`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute start-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] text-red-600 mt-1">{t("passwordMismatch")}</p>
                  )}
                </div>

                {selectedRole === "vendor" && (
                  <div className="pt-2">
                    <div className="w-full h-px bg-zinc-200 my-4" />
                    <h3 className="text-[16px] font-bold text-zinc-900 mb-4">{t("storeDetails")}</h3>
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                  <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (password.length > 0 && !isPasswordValid)}
                className="w-full h-[31px] bg-gradient-to-b from-[#f7dfa1] to-[#f0c14b] border border-[#a88734] hover:border-[#9c7d2e] rounded-[3px] text-[13px] shadow-sm active:from-[#edc04b] active:to-[#edc04b] flex items-center justify-center disabled:opacity-60"
              >
                {loading ? <Loader size="sm" text="" /> : "المتابعة للتحقق"}
              </button>

              <div className="pt-4 space-y-3">
                <p className="text-[12px] text-zinc-900 leading-snug">
                  {t("termsAgreed")} <Link href="/condition" className="text-[#0066c0] hover:text-[#8f2d4a] hover:underline">{t("termsOfUse")}</Link> {t("termsAgreedSuffix")}
                </p>

                <div className="border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep("role")}
                    className="text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline"
                  >
                    تغيير نوع الحساب
                  </button>
                </div>
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
                      <p className="text-[11px] text-zinc-500">{email ? `{t("sendCodeTo")} ${email}` : t("provideEmailFirst")}</p>
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
                {loading ? <Loader size="sm" text="" /> : "التحقق من الرمز"}
              </button>

              <div className="text-center pt-4">
                {countdown > 0 ? (
                  <p className="text-[12px] text-zinc-600">{t("resendCodeIn")} {countdown}ث</p>
                ) : (
                  <button type="button" onClick={handleChoosePhone} className="text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                    إعادة إرسال الرمز
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
                {t("codeSentSMS")} <span className="font-bold">{email}</span>.
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
                {loading ? <Loader size="sm" text="" /> : "التحقق من الرمز"}
              </button>

              <div className="text-center pt-4">
                {countdown > 0 ? (
                  <p className="text-[12px] text-zinc-600">{t("resendCodeIn")} {countdown}ث</p>
                ) : (
                  <button type="button" onClick={handleChooseEmail} className="text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 5: Vendor Pending ── */}
          {step === "vendor_pending" && (
            <div className="text-center py-8 space-y-4">
              <Clock size={48} className="text-amber-500 mx-auto" />
              <h2 className="text-[20px] font-bold text-zinc-900">{t("applicationSubmitted")}</h2>
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                {t("thanksForSubmitting")} <span className="font-bold">{selectedRole === "vendor" ? storeName : name}</span>{t("storeUnderApproval")}
              </p>
              <div className="pt-4 space-y-3">
                <button
                  disabled
                  className="w-full h-[31px] bg-zinc-200 border border-zinc-300 rounded-[3px] text-zinc-500 text-[13px] flex items-center justify-center shadow-inner cursor-not-allowed font-medium"
                >
                  قيد المراجعة
                </button>
                <Link href="/" className="block text-[12px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                  العودة للصفحة الرئيسية
                </Link>
              </div>
            </div>
          )}

          {/* ── STEP 6: Success ── */}
          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
              <h2 className="text-[20px] font-bold text-zinc-900">{t("welcome")}{selectedRole === "vendor" ? storeName : name}!</h2>
              <p className="text-[13px] text-zinc-500">{t("accountReady")}</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-100 text-center space-y-2">
          <div className="flex justify-center gap-6 text-[11px] text-[#0066c0]">
            <Link href="/conditions" className="hover:text-[#8f2d4a] hover:underline">{t("termsOfUse")}</Link>
            <Link href="/help" className="hover:text-[#8f2d4a] hover:underline">{t("help")}</Link>
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
