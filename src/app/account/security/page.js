"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  updatePhoneNumber, 
  PhoneAuthProvider, 
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail
} from "firebase/auth";
import { ChevronRight, ShieldCheck, Smartphone, Lock, User, Check, AlertCircle, Mail, Eye, EyeOff } from "lucide-react";
import Loader from "@/components/Loader";

export default function AccountSecurityPage() {
  const { user, customerName, email: wooEmail, phone: wooPhone, wooId, refreshAuth, loading } = useAuth();
  
  // Field States
  const [name, setName] = useState(customerName || "");
  const [email, setEmail] = useState(wooEmail || user?.email || "");

  // UI States
  const [editingField, setEditingField] = useState(null); // 'name' | 'email' | 'phone' | 'password'
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Phone Verification Wizard States
  const [phoneStep, setPhoneStep] = useState("verify_current"); // "verify_password_phone" | "verify_current" | "otp_current" | "enter_new" | "otp_new"
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPhone, setNewPhone] = useState("+962");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email Verification States
  const [emailStep, setEmailStep] = useState("enter_new"); // "enter_new" | "otp_new"
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const emailOtpRefs = useRef([]);

  // Check if provider is email/password
  const hasPassword = user?.providerData?.some(p => p.providerId === "password") || false;



  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      // Delay cleanup slightly so reCAPTCHA async callbacks don't hit null
      setTimeout(() => {
        if (recaptchaRef.current) {
          try {
            recaptchaRef.current.clear();
          } catch (e) {
            console.error("Recaptcha cleanup error", e);
          }
          recaptchaRef.current = null;
        }
      }, 500);
    };
  }, []);

  // Firebase Setup
  const setupRecaptcha = () => {
    if (!recaptchaRef.current) {
      try {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      } catch (err) {
        console.error("Recaptcha init error", err);
      }
    }
    return recaptchaRef.current;
  };

  const handleSaveName = async () => {
    setIsSaving(true);
    const parts = name.trim().split(" ");
    const updates = { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" };
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wooId, updates }),
      });
      if (res.ok) {
        await refreshAuth();
        setMessage({ type: 'success', text: "Name updated successfully." });
        setEditingField(null);
      }
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setIsSaving(false); }
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

  // --- EMAIL OTP LOGIC ---
  const handleSendEmailOTP = async () => {
    if (!email.trim() || email === (wooEmail || user?.email)) {
      setMessage({ type: 'error', text: "Please enter a new email address." });
      return;
    }
    
    // Quick regex validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: "Please enter a valid email address." });
      return;
    }

    if (hasPassword && !currentPassword) {
      setMessage({ type: 'error', text: "Current password is required to verify identity." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // First, try re-authenticating the user if they have a password to verify password is correct before sending OTP
      if (hasPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Check if email already registered in WooCommerce
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          throw new Error("This email is already associated with another account.");
        }
      }

      // Send OTP to new email
      const otpRes = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "send" }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || "Failed to send verification code.");

      setConfirmNewEmail(email);
      setEmailStep("otp_new");
      setEmailOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Failed to initiate email change." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyEmailOTPAndSave = async () => {
    const code = emailOtp.join("");
    if (code.length < 6) {
      setMessage({ type: 'error', text: "Please enter the full 6-digit code." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // 1. Verify OTP
      const verifyRes = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmNewEmail, code, action: "verify" }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Invalid verification code.");

      // 2. Re-authenticate
      if (hasPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // 3. Update Firebase email
      await updateEmail(auth.currentUser, confirmNewEmail);

      // 4. Update WooCommerce email
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wooId, updates: { email: confirmNewEmail } }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to sync changes to profile server.");
      }

      await refreshAuth();
      setMessage({ type: 'success', text: "Email address updated successfully." });
      setEditingField(null);
      setCurrentPassword("");
      setEmailStep("enter_new");
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Failed to update email address." });
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
    setEditingField('phone');
    if (!user?.phoneNumber) {
      if (hasPassword) {
        setPhoneStep('verify_password_phone');
      } else {
        setPhoneStep('enter_new');
      }
    } else {
      setPhoneStep('verify_current');
    }
    setOtp(["", "", "", "", "", ""]);
    setNewPhone("+962");
    setCurrentPassword("");
    setMessage(null);
  };

  const handleVerifyPasswordForPhone = async () => {
    if (!currentPassword) {
      setMessage({ type: 'error', text: "Current password is required." });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setPhoneStep("enter_new");
      setCurrentPassword("");
    } catch (err) {
      setMessage({ type: 'error', text: "Incorrect password. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const sendOTPToCurrent = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, user.phoneNumber, verifier);
      setConfirmationResult(result);
      setPhoneStep("otp_current");
    } catch (err) { setMessage({ type: 'error', text: "Failed to send OTP to current number." }); }
    finally { setIsSaving(false); }
  };

  const verifyCurrentOTP = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await confirmationResult.confirm(otp.join(""));
      setPhoneStep("enter_new");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) { setMessage({ type: 'error', text: "Invalid verification code." }); }
    finally { setIsSaving(false); }
  };

  const sendOTPToNew = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, newPhone, verifier);
      setConfirmationResult(result);
      setPhoneStep("otp_new");
    } catch (err) { setMessage({ type: 'error', text: "Failed to send OTP to new number." }); }
    finally { setIsSaving(false); }
  };

  const verifyNewOTPAndSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp.join(""));
      await updatePhoneNumber(auth.currentUser, credential);
      
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wooId, updates: { billing: { phone: newPhone }, shipping: { phone: newPhone } } }),
      });

      if (res.ok) {
        await refreshAuth();
        setMessage({ type: 'success', text: "Phone number updated successfully." });
        setEditingField(null);
      }
    } catch (err) { setMessage({ type: 'error', text: "Verification failed. " + err.message }); }
    finally { setIsSaving(false); }
  };

  // --- PASSWORD UPDATE LOGIC ---
  const handleSavePassword = async () => {
    if (!currentPassword) {
      setMessage({ type: 'error', text: "Current password is required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: "Password must be at least 6 characters." });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      // 1. Re-authenticate in Firebase
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Update Firebase Auth password
      await updatePassword(auth.currentUser, newPassword);

      // 3. Update WooCommerce/WordPress password
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wooId, updates: { password: newPassword } }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to sync password to WooCommerce.");
      }

      setMessage({ type: 'success', text: "Password updated successfully." });
      setEditingField(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Failed to update password. Please check your current password." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="w-full">
      <div id="recaptcha-container" />
      
      <h2 className="text-2xl font-bold mb-8 text-gray-900">Login & Security</h2>

      {message && (
        <div className={`mb-8 p-4 rounded-md border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
           {message.type === 'success' ? <Check size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
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
                  {!editingField || editingField !== 'name' ? (
                    <div>
                       <h3 className="text-[16px] font-bold text-gray-900">Name</h3>
                       <p className="text-[14px] text-gray-500 mt-1">{customerName || "Not set"}</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-[300px]">
                       <h3 className="text-[16px] font-bold text-gray-900 mb-4">Change Name</h3>
                       <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black mb-4" autoFocus />
                       <div className="flex gap-3">
                           <button onClick={handleSaveName} disabled={isSaving} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2 hover:bg-gray-800 transition-all">{isSaving ? <Loader size="sm" text="" /> : "Save"}</button>
                           <button onClick={handleCancelEdit} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all">Cancel</button>
                       </div>
                    </div>
                  )}
               </div>
               {!editingField && <button onClick={() => { handleCancelEdit(); setEditingField('name'); setName(customerName || ""); }} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all shrink-0">Edit</button>}
            </div>
         </div>

         {/* EMAIL SECTION */}
         <div className="p-8 flex flex-col gap-4 hover:bg-gray-50/5 transition-colors">
            <div className="flex items-start justify-between">
               <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-100 border-none shrink-0">
                     <Mail size={20} />
                  </div>
                  {!editingField || editingField !== 'email' ? (
                    <div>
                       <h3 className="text-[16px] font-bold text-gray-900">Email Address</h3>
                       <p className="text-[14px] text-gray-500 mt-1">{wooEmail || user?.email || "Not set"}</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-[300px]">
                       <h3 className="text-[16px] font-bold text-gray-900 mb-4">Change Email</h3>
                       
                       {emailStep === 'enter_new' && (
                         <div className="space-y-4">
                           <p className="text-[13px] text-gray-500">Note: Your email address is used for order updates and recovery.</p>
                           <div>
                             <label className="text-[13px] font-bold text-zinc-900 block mb-1">New Email Address</label>
                             <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black" />
                           </div>

                           {hasPassword && (
                             <div>
                               <label className="text-[13px] font-bold text-zinc-900 block mb-1">Current Password</label>
                               <div className="relative">
                                 <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Confirm your password" className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black" />
                                 <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                   {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                 </button>
                               </div>
                             </div>
                           )}

                           <div className="flex gap-3">
                             <button onClick={handleSendEmailOTP} disabled={isSaving} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2 hover:bg-gray-800 transition-all">
                               {isSaving ? <Loader size="sm" text="" /> : "Send Code"}
                             </button>
                             <button onClick={handleCancelEdit} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all">Cancel</button>
                           </div>
                         </div>
                       )}

                       {emailStep === 'otp_new' && (
                         <div className="space-y-4">
                           <p className="text-[14px] text-gray-500">For your security, we&apos;ve sent a 6-digit code to <span className="font-bold text-black">{confirmNewEmail}</span></p>
                           <div className="flex gap-2">
                             {emailOtp.map((d, i) => (
                               <input key={i} ref={el => emailOtpRefs.current[i] = el} type="text" maxLength={1} value={d} onChange={e => handleEmailOtpChange(e.target.value, i)} onKeyDown={e => handleEmailOtpKeyDown(e, i)} className="w-10 h-10 text-center border border-gray-200 rounded-md text-[18px] font-bold focus:border-black outline-none" />
                             ))}
                           </div>
                           <div className="flex gap-3">
                             <button onClick={handleVerifyEmailOTPAndSave} disabled={isSaving || emailOtp.join("").length < 6} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2">
                               {isSaving ? <Loader size="sm" text="" /> : "Verify & Save"}
                             </button>
                             <button onClick={() => { setEmailStep("enter_new"); setEmailOtp(["", "", "", "", "", ""]); }} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all">Back</button>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
               </div>
               {!editingField && <button onClick={() => { handleCancelEdit(); setEditingField('email'); setEmailStep('enter_new'); setEmail(wooEmail || user?.email || ""); }} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all shrink-0">Edit</button>}
            </div>
         </div>

         {/* PHONE SECTION */}
         <div className="p-8 flex flex-col gap-4 hover:bg-gray-50/5 transition-colors">
            <div className="flex items-start justify-between">
               <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-100 border-none shrink-0">
                     <Smartphone size={20} />
                  </div>
                  {!editingField || editingField !== 'phone' ? (
                    <div>
                       <h3 className="text-[16px] font-bold text-gray-900">Mobile Number</h3>
                       <p className="text-[14px] text-gray-500 mt-1">{user?.phoneNumber || "Add a mobile number"}</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-[300px]">
                       <h3 className="text-[16px] font-bold text-gray-900 mb-4">Change Mobile Number</h3>
                       
                       {phoneStep === 'verify_password_phone' && (
                         <div className="space-y-4">
                           <p className="text-[14px] text-gray-500 mb-2">Please verify your password to continue.</p>
                           <div>
                             <label className="text-[13px] font-bold text-zinc-900 block mb-1">Current Password</label>
                             <div className="relative">
                               <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Confirm your password" className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black" />
                               <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                 {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                               </button>
                             </div>
                           </div>
                           <div className="flex gap-3">
                             <button onClick={handleVerifyPasswordForPhone} disabled={isSaving} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2">
                               {isSaving ? <Loader size="sm" text="" /> : "Continue"}
                             </button>
                             <button onClick={handleCancelEdit} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all">Cancel</button>
                           </div>
                         </div>
                       )}

                       {phoneStep === 'verify_current' && (
                          <div className="space-y-4">
                             <p className="text-[14px] text-gray-500">Verify current number: <span className="font-bold text-black">{user.phoneNumber}</span></p>
                             <button onClick={sendOTPToCurrent} disabled={isSaving} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2">
                                {isSaving ? <Loader size="sm" text="" /> : "Send Code"}
                             </button>
                          </div>
                       )}

                       {(phoneStep === 'otp_current' || phoneStep === 'otp_new') && (
                          <div className="space-y-4">
                             <p className="text-[14px] font-bold">Enter 6-digit code</p>
                             <div className="flex gap-2">
                                {otp.map((d, i) => (
                                  <input key={i} type="text" maxLength={1} value={d} onChange={e => {
                                     const next = [...otp]; next[i] = e.target.value; setOtp(next);
                                     if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                                  }} className="w-10 h-10 text-center border border-gray-200 rounded-md text-[18px] font-bold focus:border-black outline-none" />
                                ))}
                             </div>
                             <button onClick={phoneStep === 'otp_current' ? verifyCurrentOTP : verifyNewOTPAndSave} disabled={isSaving || otp.join("").length < 6} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold">
                                {isSaving ? <Loader size="sm" text="" /> : "Verify"}
                             </button>
                          </div>
                       )}

                       {phoneStep === 'enter_new' && (
                          <div className="space-y-4">
                             <p className="text-[14px] font-bold">New mobile number</p>
                             <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black" />
                             <button onClick={sendOTPToNew} disabled={isSaving} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold">
                                {isSaving ? <Loader size="sm" text="" /> : "Verify New Number"}
                             </button>
                          </div>
                       )}

                       {phoneStep !== 'verify_password_phone' && (
                         <button onClick={handleCancelEdit} className="mt-4 text-[13px] text-gray-400 hover:text-black">Cancel</button>
                       )}
                    </div>
                  )}
               </div>
               {!editingField && <button onClick={handleEditPhone} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all shrink-0">Edit</button>}
            </div>
         </div>

         {/* PASSWORD SECTION */}
         <div className="p-8 flex flex-col gap-4 hover:bg-gray-50/5 transition-colors">
            <div className="flex items-start justify-between">
               <div className="flex gap-4 w-full">
                  <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-100 border-none shrink-0">
                     <Lock size={20} />
                  </div>
                  {!hasPassword ? (
                    <div>
                       <h3 className="text-[16px] font-bold text-gray-900">Password</h3>
                       <p className="text-[14px] text-gray-500 mt-1">Password login is not set up for this account. (Signed in via Mobile Phone)</p>
                    </div>
                  ) : !editingField || editingField !== 'password' ? (
                    <div>
                       <h3 className="text-[16px] font-bold text-gray-900">Password</h3>
                       <p className="text-[14px] text-gray-500 mt-1">********</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-[300px]">
                       <h3 className="text-[16px] font-bold text-gray-900 mb-6">Change Password</h3>
                       <div className="space-y-4 mb-6">
                          <div>
                            <label className="text-[13px] font-bold text-zinc-900 block mb-1">Current Password</label>
                            <div className="relative">
                              <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black" />
                              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[13px] font-bold text-zinc-900 block mb-1">New Password</label>
                            <div className="relative">
                              <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 characters)" className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black" />
                              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[13px] font-bold text-zinc-900 block mb-1">Confirm New Password</label>
                            <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full h-10 px-4 border border-gray-200 rounded-md text-[14px] outline-none focus:border-black" />
                          </div>
                       </div>
                       <div className="flex gap-3">
                           <button onClick={handleSavePassword} disabled={isSaving} className="h-10 px-8 bg-black text-white rounded-md text-[14px] font-bold flex items-center gap-2">
                             {isSaving ? <Loader size="sm" text="" /> : "Save"}
                           </button>
                           <button onClick={handleCancelEdit} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all">Cancel</button>
                       </div>
                    </div>
                  )}
               </div>
               {!editingField && hasPassword && <button onClick={() => { handleCancelEdit(); setEditingField('password'); }} className="h-10 px-8 bg-white border border-gray-200 rounded-md text-[14px] font-bold hover:bg-gray-50 transition-all shrink-0">Edit</button>}
            </div>
         </div>
      </div>
    </div>
  );
}
