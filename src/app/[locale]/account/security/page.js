"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import {
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Lock,
  User,
  Check,
  AlertCircle,
  Mail,
  Eye,
  EyeOff,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import Loader from "@/components/Loader";
import { useLocale, useTranslations } from "next-intl";

export default function AccountSecurityPage() {
  const t = useTranslations("AccountSecurity");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const {
    user,
    customerName,
    email: wooEmail,
    phone: wooPhone,
    wooId,
    refreshAuth,
    logout,
    loading,
  } = useAuth();

  // Field States
  const [name, setName] = useState(customerName || "");
  const [email, setEmail] = useState(wooEmail || user?.email || "");

  // UI States
  const [editingField, setEditingField] = useState(null); // 'name' | 'email' | 'phone' | 'password'
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Phone Verification Wizard States
  const [phoneStep, setPhoneStep] = useState("verify_current");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPhone, setNewPhone] = useState("+962");

  // Password States (Required for Email Change)
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const hasPassword = true;

  // Email Verification States
  const [emailStep, setEmailStep] = useState("enter_new");
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const emailOtpRefs = useRef([]);
  const phoneOtpRefs = useRef([]);

  const handleOtpPaste = (e, setOtpFn, refs) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split("");
    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtpFn(newOtp);

    const nextEmptyIndex = newOtp.findIndex((val) => val === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    refs.current[focusIndex]?.focus();
  };

  const handleSaveName = async () => {
    setIsSaving(true);
    const parts = name.trim().split(" ");
    const updates = {
      first_name: parts[0] || "",
      last_name: parts.slice(1).join(" ") || "",
    };
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wooId, updates }),
      });
      if (res.ok) {
        await refreshAuth();
        setMessage({ type: "success", text: t("nameUpdated") });
        setEditingField(null);
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("updateFailed") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEmailStep("enter_new");
    setPhoneStep("verify_email_send_otp");
    setOtp(["", "", "", "", "", ""]);
    setEmailOtp(["", "", "", "", "", ""]);
    setCurrentPassword("");
    setShowCurrentPassword(false);
    setMessage(null);
  };

  const verifyPasswordWithBackend = async (pass) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: wooEmail || user?.email,
        password: pass,
      }),
    });
    if (!res.ok) throw new Error(t("incorrectPassword"));
    return true;
  };

  // --- EMAIL OTP LOGIC ---
  const handleSendEmailOTP = async () => {
    if (!email.trim() || email === (wooEmail || user?.email)) {
      setMessage({ type: "error", text: t("enterNewEmail") });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: "error", text: t("validEmail") });
      return;
    }

    if (!currentPassword) {
      setMessage({ type: "error", text: t("passwordRequired") });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await verifyPasswordWithBackend(currentPassword);

      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          throw new Error(t("emailAlreadyUsed"));
        }
      }

      const otpRes = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "send" }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || t("failedSendCode"));

      setConfirmNewEmail(email);
      setEmailStep("otp_new");
      setEmailOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || t("failedEmailChange"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyEmailOTPAndSave = async () => {
    const code = emailOtp.join("");
    if (code.length < 6) {
      setMessage({ type: "error", text: t("enterFullCode") });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const verifyRes = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: confirmNewEmail,
          code,
          action: "verify",
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok)
        throw new Error(verifyData.error || t("invalidCode"));

      await verifyPasswordWithBackend(currentPassword);

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wooId,
          updates: { email: confirmNewEmail },
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || t("failedSync"));
      }

      await refreshAuth();
      setMessage({ type: "success", text: t("emailUpdated") });
      setTimeout(() => {
        setEditingField(null);
        setCurrentPassword("");
        setEmailStep("enter_new");
        setIsSaving(false);
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || t("failedUpdateEmail"),
      });
      setIsSaving(false);
    }
  };

  const handleEmailOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...emailOtp];
    next[idx] = val;
    setEmailOtp(next);
    if (val && idx < 5) emailOtpRefs.current[idx + 1]?.focus();
  };

  const handleEmailOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !emailOtp[idx] && idx > 0) {
      emailOtpRefs.current[idx - 1]?.focus();
    }
  };

  // --- PHONE WIZARD LOGIC ---
  const handleEditPhone = () => {
    setEditingField("phone");
    setPhoneStep("verify_email_send_otp");
    setOtp(["", "", "", "", "", ""]);
    setNewPhone("+962");
    setCurrentPassword("");
    setMessage(null);
  };

  const sendEmailOTPForPhone = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: wooEmail || user?.email, action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("failedSendCode"));
      setPhoneStep("verify_email_otp");
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("failedSendCode") });
    } finally {
      setIsSaving(false);
    }
  };

  const verifyEmailOTPForPhone = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setMessage({ type: "error", text: t("enterFullCode") });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: wooEmail || user?.email,
          code,
          action: "verify",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("invalidCode"));

      setMessage({ type: "success", text: t("codeVerifiedSuccess", { defaultValue: "Code verified successfully!" }) });
      setTimeout(() => {
        setPhoneStep("enter_new");
        setOtp(["", "", "", "", "", ""]);
        setMessage(null);
        setIsSaving(false);
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("invalidCode") });
      setIsSaving(false);
    }
  };

  const saveNewPhoneDirectly = async () => {
    if (!newPhone || newPhone.trim() === "") {
      setMessage({ type: "error", text: t("validPhoneRequired") });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wooId,
          updates: {
            billing: { phone: newPhone },
            shipping: { phone: newPhone },
          },
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("phoneUpdated") });
        setEditingField(null);
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        const data = await res.json();
        throw new Error(data.error || t("updateFailed"));
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || t("updateFailed"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="w-full" dir={dir}>
      <h2 className="text-2xl font-bold mb-8 text-gray-900">
        {t("pageTitle")}
      </h2>

      {message && (
        <div
          className={`mb-8 p-4 rounded-md border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
        >
          {message.type === "success" ? (
            <Check size={18} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
          )}
          <span className="text-[14px] font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-md overflow-hidden divide-y divide-gray-50 shadow-sm">
        {/* NAME SECTION */}
        <div className="p-8 flex flex-col gap-4 hover:bg-gray-50/5 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-100 border-none shrink-0">
                <User size={20} />
              </div>
              {!editingField || editingField !== "name" ? (
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    {t("name")}
                  </h3>
                  <p className="text-[14px] text-gray-500 mt-1">
                    {customerName || t("notSet")}
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-w-[300px]">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-4">
                    {t("changeName")}
                  </h3>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveName}
                      disabled={isSaving}
                      className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
                    >
                      {isSaving ? <Loader size="sm" text="" /> : t("save")}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!editingField && (
              <button
                onClick={() => {
                  handleCancelEdit();
                  setEditingField("name");
                  setName(customerName || "");
                }}
                className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all shrink-0"
              >
                {t("edit")}
              </button>
            )}
          </div>
        </div>

        {/* EMAIL SECTION */}
        <div className="p-8 flex flex-col gap-4 hover:bg-gray-50/5 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-100 border-none shrink-0">
                <Mail size={20} />
              </div>
              {!editingField || editingField !== "email" ? (
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    {t("emailAddress")}
                  </h3>
                  <p className="text-[14px] text-gray-500 mt-1">
                    {wooEmail || user?.email || t("notSet")}
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-w-[300px]">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-4">
                    {t("changeEmail")}
                  </h3>

                  {emailStep === "enter_new" && (
                    <div className="space-y-4">
                      <p className="text-[13px] text-gray-500">
                        {t("emailNote")}
                      </p>
                      <div>
                        <label className="text-[13px] font-bold text-zinc-900 block mb-1">
                          {t("newEmail")}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black"
                        />
                      </div>

                      {hasPassword && (
                        <div>
                          <label className="text-[13px] font-bold text-zinc-900 block mb-1">
                            {t("currentPassword")}
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                              placeholder={t("confirmPasswordPlaceholder")}
                              className="w-full h-10 px-4 pe-10 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              {showCurrentPassword ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={handleSendEmailOTP}
                          disabled={isSaving}
                          className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
                        >
                          {isSaving ? (
                            <Loader size="sm" text="" />
                          ) : (
                            t("sendCode")
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  {emailStep === "otp_new" && (
                    <div className="space-y-4">
                      <p className="text-[14px] text-gray-500 mb-2">
                        {t("otpSentTo", { email: confirmNewEmail })}
                      </p>
                      <div className="flex gap-2 justify-center sm:justify-start" dir="ltr">
                        {emailOtp.map((d, i) => (
                          <input
                            key={i}
                            ref={(el) => (emailOtpRefs.current[i] = el)}
                            type="text"
                            maxLength={1}
                            value={d}
                            autoFocus={i === 0}
                            onPaste={(e) => handleOtpPaste(e, setEmailOtp, emailOtpRefs)}
                            onChange={(e) =>
                              handleEmailOtpChange(e.target.value, i)
                            }
                            onKeyDown={(e) => handleEmailOtpKeyDown(e, i)}
                            className="w-10 h-10 text-center border border-gray-200 rounded-md text-[18px] font-bold focus:border-black outline-none"
                          />
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleVerifyEmailOTPAndSave}
                          disabled={isSaving || emailOtp.join("").length < 6}
                          className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2"
                        >
                          {isSaving ? (
                            <Loader size="sm" text="" />
                          ) : (
                            t("verifyAndSave")
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEmailStep("enter_new");
                            setEmailOtp(["", "", "", "", "", ""]);
                          }}
                          className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all"
                        >
                          {t("back")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!editingField && (
              <button
                onClick={() => {
                  handleCancelEdit();
                  setEditingField("email");
                  setEmailStep("enter_new");
                  setEmail(wooEmail || user?.email || "");
                }}
                className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all shrink-0"
              >
                {t("edit")}
              </button>
            )}
          </div>
        </div>

        {/* PHONE SECTION */}
        <div className="p-8 flex flex-col gap-4 hover:bg-gray-50/5 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-100 border-none shrink-0">
                <Smartphone size={20} />
              </div>
              {!editingField || editingField !== "phone" ? (
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    {t("mobileNumber")}
                  </h3>
                  <p className="text-[14px] text-gray-500 mt-1">
                    {wooPhone || user?.phone || t("addMobile")}
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-w-[300px]">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-4">
                    {t("changeMobile")}
                  </h3>

                  {phoneStep === "verify_email_send_otp" && (
                    <div className="space-y-4">
                      <p className="text-[14px] text-gray-500 mb-2">
                        {t("verifyEmailContinue")}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={sendEmailOTPForPhone}
                          disabled={isSaving}
                          className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2"
                        >
                          {isSaving ? (
                            <Loader size="sm" text="" />
                          ) : (
                            t("sendCode")
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  {phoneStep === "verify_email_otp" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-100 rounded-md text-[13px] text-green-700 font-medium flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600 shrink-0" />
                        <span>{t("otpSentTo", { email: wooEmail || user?.email })}</span>
                      </div>
                      <p className="text-[14px] font-bold">
                        {t("enter6DigitCode")}
                      </p>
                      <div className="flex gap-2 justify-center sm:justify-start" dir="ltr">
                        {otp.map((d, i) => (
                          <input
                            key={i}
                            ref={(el) => (phoneOtpRefs.current[i] = el)}
                            type="text"
                            maxLength={1}
                            value={d}
                            autoFocus={i === 0}
                            onPaste={(e) => handleOtpPaste(e, setOtp, phoneOtpRefs)}
                            onChange={(e) => {
                              const next = [...otp];
                              next[i] = e.target.value;
                              setOtp(next);
                              if (e.target.value && i < 5)
                                phoneOtpRefs.current[i + 1]?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !otp[i] && i > 0) {
                                phoneOtpRefs.current[i - 1]?.focus();
                              }
                            }}
                            className="w-10 h-10 text-center border border-gray-200 rounded-md text-[18px] font-bold focus:border-black outline-none"
                          />
                        ))}
                      </div>
                      <button
                        onClick={verifyEmailOTPForPhone}
                        disabled={isSaving || otp.join("").length < 6}
                        className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold"
                      >
                        {isSaving ? (
                          <Loader size="sm" text="" />
                        ) : (
                          t("verify")
                        )}
                      </button>
                    </div>
                  )}

                  {phoneStep === "enter_new" && (
                    <div className="space-y-4">
                      <p className="text-[14px] font-bold">
                        {t("newMobileNumber")}
                      </p>
                      <div dir="ltr" className="flex h-10 rounded-[3px] border border-gray-300 focus-within:border-[#be374f] focus-within:ring-1 focus-within:ring-[#be374f] overflow-hidden transition-all bg-white">
                        <div className="flex items-center gap-1 bg-gray-50 border-r border-gray-300 px-3 text-[14px] text-gray-700 select-none">
                          <span>+962</span>
                          <ChevronDown size={14} className="text-gray-500" />
                        </div>
                        <input
                          type="tel"
                          dir="ltr"
                          value={newPhone.replace(/^\+962/, "")}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^\d\s-]/g, "");
                            if (val.startsWith("0")) val = val.substring(1);
                            setNewPhone("+962" + val);
                          }}
                          placeholder="7X XXX XXXX"
                          className="flex-1 h-full bg-transparent px-3 text-[14px] outline-none min-w-0"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={saveNewPhoneDirectly}
                        disabled={isSaving}
                        className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold"
                      >
                        {isSaving ? (
                          <Loader size="sm" text="" />
                        ) : (
                          t("save")
                        )}
                      </button>
                    </div>
                  )}

                  {phoneStep !== "verify_password_phone" && (
                    <button
                      onClick={handleCancelEdit}
                      className="mt-4 text-[13px] text-gray-400 hover:text-black"
                    >
                      {t("cancel")}
                    </button>
                  )}
                </div>
              )}
            </div>
            {!editingField && (
              <button
                onClick={handleEditPhone}
                className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all shrink-0"
              >
                {t("edit")}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}