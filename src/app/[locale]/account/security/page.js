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

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email Verification States
  const [emailStep, setEmailStep] = useState("enter_new");
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const emailOtpRefs = useRef([]);

  const hasPassword = true;

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
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setCurrentPassword("");
    setEmailStep("enter_new");
    setPhoneStep("verify_current");
    setOtp(["", "", "", "", "", ""]);
    setEmailOtp(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
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
      setEditingField(null);
      setCurrentPassword("");
      setEmailStep("enter_new");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || t("failedUpdateEmail"),
      });
    } finally {
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
    if (!wooPhone) {
      setPhoneStep("enter_new");
    } else {
      setPhoneStep("verify_current");
    }
    setOtp(["", "", "", "", "", ""]);
    setNewPhone("+962");
    setCurrentPassword("");
    setMessage(null);
  };

  const handleVerifyPasswordForPhone = async () => {
    if (!currentPassword) {
      setMessage({ type: "error", text: t("passwordRequired") });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      await verifyPasswordWithBackend(currentPassword);
      setPhoneStep("enter_new");
      setCurrentPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const sendOTPToCurrent = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: wooPhone, action: "send" }),
      });
      if (!res.ok) throw new Error("Failed");
      setPhoneStep("otp_current");
    } catch (err) {
      setMessage({ type: "error", text: t("failedSendOtpCurrent") });
    } finally {
      setIsSaving(false);
    }
  };

  const verifyCurrentOTP = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: wooPhone,
          code: otp.join(""),
          action: "verify",
        }),
      });
      if (!res.ok) throw new Error("Invalid code");
      setPhoneStep("enter_new");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setMessage({ type: "error", text: t("invalidCode") });
    } finally {
      setIsSaving(false);
    }
  };

  const sendOTPToNew = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone, action: "send" }),
      });
      if (!res.ok) throw new Error("Failed");
      setPhoneStep("otp_new");
    } catch (err) {
      setMessage({ type: "error", text: t("failedSendOtpNew") });
    } finally {
      setIsSaving(false);
    }
  };

  const verifyNewOTPAndSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const verifyRes = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newPhone,
          code: otp.join(""),
          action: "verify",
        }),
      });
      if (!verifyRes.ok) throw new Error(t("invalidCode"));

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
        await refreshAuth();
        setMessage({ type: "success", text: t("phoneUpdated") });
        setEditingField(null);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: t("verificationFailed", { error: err.message }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- PASSWORD UPDATE LOGIC ---
  const handleSavePassword = async () => {
    if (!currentPassword) {
      setMessage({ type: "error", text: t("passwordRequired") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("passwordsDoNotMatch") });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: t("passwordMinLength") });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      await verifyPasswordWithBackend(currentPassword);

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wooId,
          updates: { password: newPassword },
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || t("failedSyncPassword"));
      }

      setMessage({ type: "success", text: t("passwordUpdated") });
      setEditingField(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || t("failedUpdatePassword"),
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
                      <p className="text-[14px] text-gray-500">
                        {t("otpSentTo", { email: confirmNewEmail })}
                      </p>
                      <div className="flex gap-2">
                        {emailOtp.map((d, i) => (
                          <input
                            key={i}
                            ref={(el) => (emailOtpRefs.current[i] = el)}
                            type="text"
                            maxLength={1}
                            value={d}
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

                  {phoneStep === "verify_password_phone" && (
                    <div className="space-y-4">
                      <p className="text-[14px] text-gray-500 mb-2">
                        {t("verifyPasswordContinue")}
                      </p>
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
                      <div className="flex gap-3">
                        <button
                          onClick={handleVerifyPasswordForPhone}
                          disabled={isSaving}
                          className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2"
                        >
                          {isSaving ? (
                            <Loader size="sm" text="" />
                          ) : (
                            t("continue")
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

                  {phoneStep === "verify_current" && (
                    <div className="space-y-4">
                      <p className="text-[14px] text-gray-500">
                        {t("verifyCurrentNumber")}{" "}
                        <span className="font-bold text-black">
                          {wooPhone || user?.phone}
                        </span>
                      </p>
                      <button
                        onClick={sendOTPToCurrent}
                        disabled={isSaving}
                        className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2"
                      >
                        {isSaving ? (
                          <Loader size="sm" text="" />
                        ) : (
                          t("sendCode")
                        )}
                      </button>
                    </div>
                  )}

                  {(phoneStep === "otp_current" ||
                    phoneStep === "otp_new") && (
                      <div className="space-y-4">
                        <p className="text-[14px] font-bold">
                          {t("enter6DigitCode")}
                        </p>
                        <div className="flex gap-2">
                          {otp.map((d, i) => (
                            <input
                              key={i}
                              type="text"
                              maxLength={1}
                              value={d}
                              onChange={(e) => {
                                const next = [...otp];
                                next[i] = e.target.value;
                                setOtp(next);
                                if (e.target.value && e.target.nextSibling)
                                  e.target.nextSibling.focus();
                              }}
                              className="w-10 h-10 text-center border border-gray-200 rounded-md text-[18px] font-bold focus:border-black outline-none"
                            />
                          ))}
                        </div>
                        <button
                          onClick={
                            phoneStep === "otp_current"
                              ? verifyCurrentOTP
                              : verifyNewOTPAndSave
                          }
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
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black"
                      />
                      <button
                        onClick={sendOTPToNew}
                        disabled={isSaving}
                        className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold"
                      >
                        {isSaving ? (
                          <Loader size="sm" text="" />
                        ) : (
                          t("verifyNewNumber")
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

        {/* PASSWORD SECTION */}
        <div className="p-8 flex flex-col gap-4 hover:bg-gray-50/5 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 w-full">
              <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-100 border-none shrink-0">
                <Lock size={20} />
              </div>
              {!editingField || editingField !== "password" ? (
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    {t("password")}
                  </h3>
                  <p className="text-[14px] text-gray-500 mt-1">********</p>
                </div>
              ) : (
                <div className="flex-1 min-w-[300px]">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-6">
                    {t("changePassword")}
                  </h3>
                  <div className="space-y-4 mb-6">
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
                          placeholder={t("enterCurrentPassword")}
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
                    <div>
                      <label className="text-[13px] font-bold text-zinc-900 block mb-1">
                        {t("newPassword")}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t("newPasswordPlaceholder")}
                          className="w-full h-10 px-4 pe-10 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(!showNewPassword)
                          }
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showNewPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-bold text-zinc-900 block mb-1">
                        {t("confirmNewPassword")}
                      </label>
                      <input
                        type="password"
                        placeholder={t("confirmNewPasswordPlaceholder")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSavePassword}
                      disabled={isSaving}
                      className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2"
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
            {!editingField && hasPassword && (
              <button
                onClick={() => {
                  handleCancelEdit();
                  setEditingField("password");
                }}
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