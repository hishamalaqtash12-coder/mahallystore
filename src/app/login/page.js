"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Phone, ShieldCheck, ArrowRight, RotateCcw, Loader2, CheckCircle2, Info, Clock, Mail, Store, ChevronDown, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Loader from "@/components/Loader";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, supportEmail } = useAuth();
  const accountRemoved = searchParams.get("reason") === "account_removed";
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState("phone"); // "phone" | "email" | "otp" | "success" | "pending"
  const [phone, setPhone] = useState("+962");
  const [email, setEmail] = useState("");
  const [pendingVendorName, setPendingVendorName] = useState("");
  const [pendingVendorStore, setPendingVendorStore] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace(redirectTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Auto-focus first input box when entering verification step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        if (otpRefs.current[0]) {
          otpRefs.current[0].focus();
        }
      }, 50);
    }
  }, [step]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      // 1. Verify if user is registered in the database first
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });

      if (!checkRes.ok) {
        if (checkRes.status === 503) {
          throw new Error("Our store servers are currently undergoing maintenance. Please try again in a few minutes.");
        }
        throw new Error(`Authentication service unavailable (${checkRes.status})`);
      }

      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setError("This phone number is not registered. Please create an account first.");
        setLoading(false);
        return;
      }

      // 2. Security Check: Block Pending Vendors — show dedicated pending screen
      if ((checkData.customer?.role === "vendor" || checkData.customer?.role === "shop_manager") && checkData.customer?.vendorStatus !== "approved") {
        setPendingVendorName(checkData.customer?.displayName || "");
        setPendingVendorStore(checkData.customer?.storeSlug || "");
        setStep("pending");
        setLoading(false);
        return;
      }

      // 3. Send custom NGT OTP
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
        throw new Error(data.error || "Failed to send code.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send OTP. Please try again.");
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
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
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
        // Sync WooCommerce session
        try {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: phone, password: "otp_login" })
          });
        } catch (err) {
          console.warn("Failed to set session cookie for OTP login");
        }

        // Fetch user data from check-user to populate localStorage
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
              // Fallback if check-user fails or customer doesn't exist yet
              localStorage.setItem("mahally_user", JSON.stringify({ phone }));
            }
          } else {
            localStorage.setItem("mahally_user", JSON.stringify({ phone }));
          }
        } catch(e) {
          localStorage.setItem("mahally_user", JSON.stringify({ phone }));
        }

        // Force a small delay then redirect, then reload to let AuthContext pick it up
        setStep("success");
        setTimeout(() => {
          router.replace(redirectTo);
          setTimeout(() => window.location.reload(), 100);
        }, 1500);
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch (err) {
      setError(err.message || "Invalid code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Attempt WordPress Login first (Directly to WP database)
      // This supports both Email and Username
      const wpRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!wpRes.ok) {
        const wpData = await wpRes.json();
        throw new Error(wpData.error || "Invalid credentials");
      }

      const wpData = await wpRes.json();
      const loginIdentity = wpData.user?.email || email;

      // Check if vendor is approved BEFORE syncing Firebase
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
      }

      // 2. WordPress authorized successfully!
      // (Firebase sync removed completely)
      
      // Save user to localStorage for AuthContext to pick up
      if (checkRes && checkRes.ok) {
        const checkData = await checkRes.clone().json();
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
        router.replace(redirectTo);
        setTimeout(() => window.location.reload(), 100);
      }, 1500);
    } catch (err) {
      console.warn("Login validation failed:", err.message);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    await handleSendOTP({ preventDefault: () => { } });
  };

  return (
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
              className="object-contain"
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
                <p className="text-[13px] font-bold text-red-900 mb-0.5">تم حذف الحساب</p>
                <p className="text-[12px] text-red-700 leading-tight">
                  تم حذف حسابك من محلي. يرجى الاتصال بالدعم.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1A: Phone Input ── */}
          {(step === "phone" || step === "email") && (
            <form onSubmit={step === "phone" ? handleSendOTP : handleEmailLogin} className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">{step === "phone" ? "تسجيل الدخول برقم الهاتف" : "تسجيل الدخول"}</h1>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-zinc-900 block pl-0.5">
                  {step === "phone" ? "رقم الهاتف" : "البريد الإلكتروني أو اسم المستخدم"}
                </label>
                {step === "phone" ? (
                  <div dir="ltr" className="flex h-[31px] rounded-[3px] border border-zinc-400 shadow-inner focus-within:border-[#e77600] focus-within:ring-1 focus-within:ring-[#e77600] overflow-hidden transition-all bg-white">
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
                    className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 text-[13px] shadow-inner focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none transition-all text-left"
                  />
                )}
              </div>

              {step === "email" && (
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-zinc-900 block pl-0.5">كلمة المرور</label>
                  <div className="relative" dir="ltr">
                    <input
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full h-[31px] bg-white border border-zinc-400 rounded-[3px] px-2 pr-8 text-[13px] shadow-inner focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none transition-all text-left"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
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
                {loading ? <Loader size="sm" text="" /> : "متابعة"}
              </button>

              <div className="pt-4 space-y-3">
                <p className="text-[12px] text-zinc-900 leading-snug">
                  بالمتابعة، فإنك توافق على <Link href="/conditions" className="text-[#0066c0] hover:text-[#c45500] hover:underline">شروط الاستخدام</Link> الخاصة بمحلي.
                </p>

                <div className="border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(step === "phone" ? "email" : "phone")}
                    className="cursor-pointer text-[13px] text-[#0066c0] hover:text-[#c45500] hover:underline flex items-center gap-1"
                  >
                    {step === "phone" ? "تسجيل الدخول بالبريد الإلكتروني بدلاً من ذلك" : "تسجيل الدخول برقم الهاتف بدلاً من ذلك"}
                  </button>
                </div>
              </div>
            </form>
          )}


          {/* ── STEP 2: OTP Verification ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <h1 className="text-[28px] font-medium text-zinc-900 mb-4">التحقق</h1>
              <p className="text-[13px] text-zinc-900 leading-snug">
                لأمانك، أرسلنا رمزاً من 6 أرقام إلى <span className="font-bold inline-block" dir="ltr">{phone}</span>.
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
                    className="w-10 h-[31px] text-center text-lg font-bold border border-zinc-400 rounded-[3px] bg-white focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
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
                  <p className="text-[12px] text-zinc-600">إعادة إرسال الرمز خلال {countdown}ث</p>
                ) : (
                  <button type="button" onClick={handleResend} className="text-[13px] text-[#0066c0] hover:text-[#c45500] hover:underline">
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 3: Success ── */}
          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
              <h2 className="text-[20px] font-bold text-zinc-900">تم تسجيل الدخول بنجاح</h2>
              <p className="text-[13px] text-zinc-500">جاري التوجيه للصفحة الرئيسية...</p>
            </div>
          )}

          {/* ── STEP 4: Pending Vendor Approval ── */}
          {step === "pending" && (
            <div className="text-center py-2 space-y-5">
              {/* Animated clock icon */}
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-amber-50 border-4 border-amber-100 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock size={36} className="text-amber-500" />
                </div>
              </div>

              <div>
                <h2 className="text-[20px] font-bold text-zinc-900 mb-1">
                  الطلب قيد المراجعة
                </h2>
                {pendingVendorName && (
                  <p className="text-[13px] text-zinc-500">
                    مرحباً <span className="font-bold text-zinc-800">{pendingVendorName}</span>،
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <Store size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    تم تسجيل حساب البائع الخاص بك بنجاح وهو <span className="font-bold">قيد المراجعة حالياً</span> من قبل فريقنا.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    تستغرق الموافقة عادةً <span className="font-bold">من 1-2 يوم عمل</span>. ستتلقى رسالة بريد إلكتروني بمجرد تفعيل متجرك.
                  </p>
                </div>
              </div>

              <div className="space-y-3 w-full">
                <a
                  href={`mailto:${supportEmail || "support@mahally.jo"}`}
                  className="w-full h-[38px] bg-white border border-zinc-300 rounded-[3px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <Mail size={14} className="text-zinc-500" />
                  الاتصال بالدعم
                </a>
                <button
                  onClick={() => { setStep("phone"); setError(""); }}
                  className="w-full text-[12px] text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  ← العودة لتسجيل الدخول
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200"></div></div>
            <div className="relative flex justify-center text-[12px]"><span className="bg-white px-2 text-zinc-500">مستخدم جديد في محلي؟</span></div>
          </div>

          <Link
            href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
            className="w-full h-[31px] bg-gradient-to-b from-zinc-50 to-zinc-100 border border-zinc-300 rounded-[3px] text-[13px] flex items-center justify-center shadow-sm hover:from-zinc-100 hover:to-zinc-200 transition-all active:bg-zinc-200"
          >
            إنشاء حساب في محلي
          </Link>
        </div>

        <div className="mt-12 pt-4 border-t border-zinc-100 text-center space-y-2">
          <div className="flex justify-center gap-6 text-[11px] text-[#0066c0]">
            <Link href="/conditions" className="hover:text-[#c45500] hover:underline">شروط الاستخدام</Link>
            <Link href="/help" className="hover:text-[#c45500] hover:underline">المساعدة</Link>
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
