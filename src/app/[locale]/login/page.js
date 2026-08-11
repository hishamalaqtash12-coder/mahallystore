"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Phone, ShieldCheck, ArrowRight, RotateCcw, Loader2, CheckCircle2, Info, Clock, Mail, Store, ChevronDown, Eye, EyeOff, KeyRound } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import Loader from "@/components/Loader";
import { Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, supportEmail, loading: authLoading } = useAuth();
  const accountRemoved = searchParams.get("reason") === "account_removed";
  const redirectTo = searchParams.get("redirect") || "/";
  const t = useTranslations("LoginPage");
  const locale = useLocale();
  const isAr = locale === "ar";
  const pathname = usePathname();

  const handleLanguageSwitch = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("+962");
  const [email, setEmail] = useState("");
  const [pendingVendorName, setPendingVendorName] = useState("");
  const [pendingVendorStore, setPendingVendorStore] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef([]);

  // All useEffect hooks must be called unconditionally
  useEffect(() => {
    if (user && !authLoading) {
      window.location.replace(redirectTo || '/');
    }
  }, [user, authLoading, redirectTo]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        if (otpRefs.current[0]) otpRefs.current[0].focus();
      }, 50);
    }
  }, [step]);

  // ── EARLY RETURN AFTER ALL HOOKS ──
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  // ── SEND OTP (login mode) ──
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (phone.replace(/\D/g, "").length < 10) {
      setError(t("validPhoneError"));
      return;
    }
    setLoading(true);
    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });

      if (!checkRes.ok) {
        if (checkRes.status === 503) throw new Error(t("maintenanceError"));
        throw new Error(t("authUnavailableError", { status: checkRes.status }));
      }

      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setError(t("notRegisteredError"));
        setLoading(false);
        return;
      }

      if ((checkData.customer?.role === "vendor" || checkData.customer?.role === "shop_manager") && checkData.customer?.vendorStatus !== "approved") {
        setPendingVendorName(checkData.customer?.displayName || "");
        setPendingVendorStore(checkData.customer?.storeSlug || "");
        setStep("pending");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" })
      });
      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setCountdown(60);
      } else {
        throw new Error(data.error || t("sendCodeError"));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || t("sendCodeError"));
    } finally {
      setLoading(false);
    }
  };

  // ── SEND OTP (forgot password mode) ──
  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (phone.replace(/\D/g, "").length < 10) {
      setError(t("validPhoneError"));
      return;
    }
    setLoading(true);
    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setError(t("notRegisteredError"));
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" })
      });
      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setCountdown(60);
      } else {
        throw new Error(data.error || t("sendCodeError"));
      }
    } catch (err) {
      setError(err.message || t("sendCodeError"));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP INPUT ──
  const handleOtpChange = (val, idx) => {
    if (val.length > 1) return; // handled by paste
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const next = [...Array(6)].map((_, i) => pasted[i] || "");
      setOtp(next);
      const nextFocus = Math.min(pasted.length, 5);
      otpRefs.current[nextFocus]?.focus();
    }
  };

  // ── VERIFY OTP ──
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError(t("fullCodeError")); return; }
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
        if (mode === "reset") {
          setNewPassword("");
          setConfirmPassword("");
          setStep("set_password");
        } else {
          await completeLogin();
        }
      } else {
        setError(data.error || t("invalidCodeError"));
      }
    } catch (err) {
      setError(err.message || t("invalidCodeError"));
    } finally {
      setLoading(false);
    }
  };

  // ── COMPLETE LOGIN (after OTP verified in login mode) ──
  const completeLogin = async () => {
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: phone, password: "otp_login" })
      });
    } catch { }

    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists && checkData.customer) {
          const cust = checkData.customer;
          localStorage.setItem("mahally_user", JSON.stringify({
            uid: String(cust.id),
            role: cust.role,
            vendorStatus: cust.vendorStatus,
            publicId: cust.publicId,
            wooId: cust.id,
            name: cust.displayName,
            email: cust.email,
            phone: cust.phone
          }));
        } else {
          localStorage.setItem("mahally_user", JSON.stringify({ phone }));
        }
      } else {
        localStorage.setItem("mahally_user", JSON.stringify({ phone }));
      }
    } catch {
      localStorage.setItem("mahally_user", JSON.stringify({ phone }));
    }

    setStep("success");
    setTimeout(() => {
      window.location.replace(redirectTo);
    }, 1500);
  };

  // ── SUBMIT NEW PASSWORD ──
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("resetPasswordError"));
      }

      await completeLogin();
    } catch (err) {
      setError(err.message || t("resetPasswordError"));
    } finally {
      setLoading(false);
    }
  };

  // ── EMAIL LOGIN ──
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const wpRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!wpRes.ok) {
        const wpData = await wpRes.json();
        throw new Error(wpData.error || t("invalidCredentials"));
      }

      const wpData = await wpRes.json();
      const loginIdentity = wpData.user?.email || email;

      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginIdentity })
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if ((checkData.customer?.role === "vendor" || checkData.customer?.role === "shop_manager") && checkData.customer?.vendorStatus !== "approved") {
          setPendingVendorName(checkData.customer?.displayName || "");
          setPendingVendorStore(checkData.customer?.storeSlug || "");
          setStep("pending");
          setLoading(false);
          return;
        }
        if (checkData.exists && checkData.customer) {
          const cust = checkData.customer;
          localStorage.setItem("mahally_user", JSON.stringify({
            uid: String(cust.id),
            role: cust.role,
            vendorStatus: cust.vendorStatus,
            publicId: cust.publicId,
            wooId: cust.id,
            name: cust.displayName,
            email: cust.email,
            phone: cust.phone
          }));
        } else {
          localStorage.setItem("mahally_user", JSON.stringify({ email: loginIdentity }));
        }
      } else {
        localStorage.setItem("mahally_user", JSON.stringify({ email: loginIdentity }));
      }

      setStep("success");
      setTimeout(() => {
        window.location.replace(redirectTo);
      }, 1500);
    } catch (err) {
      console.warn("Login validation failed:", err.message);
      setError(err.message || t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    const fakeEvent = { preventDefault: () => { } };
    if (mode === "reset") {
      await handleSendResetOTP(fakeEvent);
    } else {
      await handleSendOTP(fakeEvent);
    }
  };

  const enterForgotPassword = () => {
    setMode("reset");
    setStep("phone");
    setPhone("+962");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  const backToLogin = () => {
    setMode("login");
    setStep("phone");
    setPhone("+962");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  const toggleLoginMethod = () => {
    setStep(step === "phone" ? "email" : "phone");
    setError("");
    setPassword("");
    setEmail("");
    setPhone("+962");
  };

  return (
    // Remove the inline font class - let the global layout handle fonts
    <div className="min-h-screen bg-white flex flex-col items-center pt-8">

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

          {/* Account removed banner */}
          {accountRemoved && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-3">
              <Info size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-red-900 mb-0.5">{t("accountRemoved")}</p>
                <p className="text-[12px] text-red-700 leading-tight">
                  {t("accountRemovedDesc")}
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1A: Phone Input (Login) ── */}
          {(step === "phone" || step === "email") && mode === "login" && (
            <form onSubmit={step === "phone" ? handleSendOTP : handleEmailLogin} className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">
                {step === "phone" ? t("loginPhone") : t("login")}
              </h1>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">
                  {step === "phone" ? t("phoneLabel") : t("emailLabel")}
                </label>
                {step === "phone" ? (
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
                      className="flex-1 h-full bg-transparent px-2 text-[13px] outline-none min-w-0"
                      autoFocus
                    />
                  </div>
                ) : (
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all text-end"
                  />
                )}
              </div>

              {step === "email" && (
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-zinc-900 block pe-0.5">{t("passwordLabel")}</label>
                  <div className="relative" dir="ltr">
                    <input
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
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
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                  <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[31px] bg-gradient-to-b from-[#f7dfa1] to-[#f0c14b] border border-[#a88734] hover:border-[#9c7d2e] rounded-[3px] text-[13px] shadow-sm active:from-[#edc04b] active:to-[#edc04b] flex items-center justify-center disabled:opacity-60"
              >
                {loading ? <Loader size="sm" text="" /> : t("continue")}
              </button>

              <div className="pt-4 space-y-3">
                <p className="text-[12px] text-zinc-900 leading-snug">
                  {t("agreeTerms")} <Link href="/conditions" className="text-[#0066c0] hover:text-[#8f2d4a] hover:underline">{t("termsLink")}</Link>
                </p>

                {/* <div className="border-t border-zinc-100 pt-3 space-y-2">
                  <button
                    type="button"
                    onClick={toggleLoginMethod}
                    className="cursor-pointer text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline flex items-center gap-1"
                  >
                    {step === "phone" ? t("loginWithEmail") : t("loginWithPhone")}
                  </button>

                  <button
                    type="button"
                    onClick={enterForgotPassword}
                    className="cursor-pointer text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline flex items-center gap-1"
                  >
                    <KeyRound size={13} /> {t("forgotPassword")}
                  </button>
                </div> */}
              </div>
            </form>
          )}

          {/* ── STEP 1B: Phone Input (Forgot Password mode) ── */}
          {step === "phone" && mode === "reset" && (
            <form onSubmit={handleSendResetOTP} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={backToLogin} className="text-zinc-400 hover:text-zinc-700">
                  <ArrowRight size={18} className={`${isAr ? 'rotate-180' : ''}`} />
                </button>
                <h1 className="text-[24px] font-medium text-zinc-900">{t("resetPasswordTitle")}</h1>
              </div>

              <p className="text-[13px] text-zinc-500 leading-snug">
                {t("resetPasswordDesc")}
              </p>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-zinc-900 block">{t("phoneLabel")}</label>
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
                    className="flex-1 h-full bg-transparent px-2 text-[13px] outline-none min-w-0"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                  <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[31px] bg-gradient-to-b from-[#f7dfa1] to-[#f0c14b] border border-[#a88734] rounded-[3px] text-[13px] shadow-sm flex items-center justify-center disabled:opacity-60"
              >
                {loading ? <Loader size="sm" text="" /> : t("sendCode")}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">
                {mode === "reset" ? t("verifyTitleReset") : t("verifyTitle")}
              </h1>
              <p className="text-[13px] text-zinc-900 leading-snug">
                {mode === "reset"
                  ? t("verifyDescReset")
                  : t("verifyDesc")}
                <span className="font-bold inline-block" dir="ltr">{phone}</span>.
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
                    onPaste={handleOtpPaste}
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
                {loading ? <Loader size="sm" text="" /> : t("verifyCodeBtn")}
              </button>

              <div className="text-center pt-4">
                {countdown > 0 ? (
                  <p className="text-[12px] text-zinc-600">{t("resendCodeIn", { seconds: countdown })}</p>
                ) : (
                  <button type="button" onClick={handleResend} className="text-[13px] text-[#0066c0] hover:text-[#8f2d4a] hover:underline">
                    {t("resendCode")}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 3: Set New Password (reset mode only) ── */}
          {step === "set_password" && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <h1 className="text-[24px] font-medium text-zinc-900 mb-1">{t("newPasswordTitle")}</h1>
              <p className="text-[13px] text-zinc-500 leading-snug mb-4">
                {t("newPasswordDesc")}
              </p>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-zinc-900 block">{t("newPasswordLabel")}</label>
                <div className="relative" dir="ltr">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    dir="ltr"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 ps-8 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute start-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-zinc-900 block">{t("confirmPasswordLabel")}</label>
                <div className="relative" dir="ltr">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 ps-8 text-[13px] shadow-inner focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute start-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= level * 2
                          ? level <= 1 ? "bg-red-400"
                            : level <= 2 ? "bg-amber-400"
                              : level <= 3 ? "bg-yellow-400"
                                : "bg-emerald-400"
                          : "bg-zinc-200"
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {newPassword.length < 8 ? t("passwordTooShort") : newPassword.length < 10 ? t("passwordAcceptable") : newPassword.length < 14 ? t("passwordGood") : t("passwordStrong")}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                  <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full h-[31px] bg-gradient-to-b from-[#f7dfa1] to-[#f0c14b] border border-[#a88734] rounded-[3px] text-[13px] shadow-sm flex items-center justify-center disabled:opacity-60"
              >
                {loading ? <Loader size="sm" text="" /> : t("saveAndLogin")}
              </button>
            </form>
          )}

          {/* ── STEP 4: Success ── */}
          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
              <h2 className="text-[20px] font-bold text-zinc-900">{t("loginSuccess")}</h2>
              <p className="text-[13px] text-zinc-500">{t("redirecting")}</p>
            </div>
          )}

          {/* ── STEP 5: Pending Vendor Approval ── */}
          {step === "pending" && (
            <div className="text-center py-2 space-y-5">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-amber-50 border-4 border-amber-100 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock size={36} className="text-amber-500" />
                </div>
              </div>

              <div>
                <h2 className="text-[20px] font-bold text-zinc-900 mb-1">{t("pendingTitle")}</h2>
                {pendingVendorName && (
                  <p className="text-[13px] text-zinc-500">
                    {t("pendingHello", { name: pendingVendorName })}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-end space-y-3">
                <div className="flex items-start gap-3">
                  <Store size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    {t("pendingStatus1")}
                    <span className="font-bold">{t("pendingStatus1Bold")}</span>
                    {t("pendingStatus1End")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    {t("pendingStatus2")}
                    <span className="font-bold">{t("pendingStatus2Bold")}</span>
                    {t("pendingStatus2End")}
                  </p>
                </div>
              </div>

              <div className="space-y-3 w-full">
                <a
                  href={`mailto:${supportEmail || "support@mahally.jo"}`}
                  className="w-full h-[38px] bg-white border border-zinc-300 rounded-[3px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <Mail size={14} className="text-zinc-500" />
                  {t("contactSupport")}
                </a>
                <button
                  onClick={backToLogin}
                  className="w-full text-[12px] text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  {t("backToLogin")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200"></div></div>
            <div className="relative flex justify-center text-[12px]"><span className="bg-white px-2 text-zinc-500">{t("newToMahally")}</span></div>
          </div>

          <Link
            href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
            className="w-full h-[31px] bg-gradient-to-b from-zinc-50 to-zinc-100 border border-zinc-300 rounded-[3px] text-[13px] flex items-center justify-center shadow-sm hover:from-zinc-100 hover:to-zinc-200 transition-all active:bg-zinc-200"
          >
            {t("createAccount")}
          </Link>
        </div>

        <div className="mt-12 pt-4 border-t border-zinc-100 text-center space-y-2">
          <div className="flex justify-center gap-6 text-[11px] text-[#0066c0]">
            <Link href="/conditions" className="hover:text-[#8f2d4a] hover:underline">{t("termsLink")}</Link>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#be374f]" size={32} /></div>}>
      <LoginContent />
    </Suspense>
  );
}