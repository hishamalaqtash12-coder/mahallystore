"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [wooCustomerDeleted, setWooCustomerDeleted] = useState(false);
  const [role, setRole] = useState(null);           // "customer" | "vendor"
  const [vendorStatus, setVendorStatus] = useState(null); // "pending" | "approved" | "rejected"
  const [vendorSlug, setVendorSlug] = useState(null);
  const [wooId, setWooId] = useState(null);
  const [publicId, setPublicId] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarBgColor, setAvatarBgColor] = useState("#9b8676");
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [dokanEnabled, setDokanEnabled] = useState(false);
  const [email, setEmail] = useState(null);
  const [phone, setPhone] = useState(null);
  const [address, setAddress] = useState(null);
  const [city, setCity] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [billing, setBilling] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState(null);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [supportEmail, setSupportEmail] = useState("support@mahally.jo");
  const checkedUidRef = useRef(null);
  const checkCacheRef = useRef({}); // Simple cache for check-user results

  useEffect(() => {
    const saved = localStorage.getItem("mahally_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRole(parsed.role || "customer");
        setVendorStatus(parsed.vendorStatus || null);
        setVendorSlug(parsed.vendorSlug || null);
        setPublicId(parsed.publicId);
        setWooId(parsed.wooId);
        setCustomerName(parsed.name || null);
        setAvatarUrl(parsed.avatarUrl || null);
        setAvatarBgColor(parsed.avatarBgColor || "#9b8676");
        setEmail(parsed.email || null);
        setPhone(parsed.phone || null);
        setAddress(parsed.address || null);
        setCity(parsed.city || null);
        setIsAdmin(parsed.isAdmin || false);
        setBilling(parsed.billing || null);
        setShipping(parsed.shipping || null);
        // Immediately show the user as logged in from cache so UI doesn't wait for the API
        setUser({ uid: parsed.uid, email: parsed.email, _fromCache: true });
        setLoading(false);
      } catch (e) {}
    }
  }, []);

  // Fetch Public Settings (Features)
  useEffect(() => {
    async function fetchPublicSettings() {
      try {
          const res = await fetch("/api/settings/public", { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.messagingEnabled !== undefined) {
              setMessagingEnabled(data.messagingEnabled);
            }
            if (data.whatsappEnabled !== undefined) {
              setWhatsappEnabled(data.whatsappEnabled);
            }
            if (data.supportEmail !== undefined) {
              setSupportEmail(data.supportEmail);
            }
          }
      } catch (err) {}
    }
    fetchPublicSettings();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check Cache
          const cacheKey = firebaseUser.email || firebaseUser.phoneNumber;
          if (checkCacheRef.current[cacheKey]) {
            const cached = checkCacheRef.current[cacheKey];
            if (Date.now() - cached.time < 60000) { // 1 minute cache
               setUser(firebaseUser); // ← must still hydrate user from Firebase
               setLoading(false);
               return; // finally will call setLoading(false)
            }
          }

          let res;
          let retries = 3;
          while (retries > 0) {
            try {
              res = await fetch("/api/auth/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: firebaseUser.email || undefined,
                  phone: firebaseUser.phoneNumber || undefined,
                }),
              });
              if (res.ok) break;
            } catch (e) {
              console.warn(`Check-user fetch attempt failed, ${retries-1} left`);
            }
            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 1500));
          }
          
          if (res && res.ok) {
            const data = await res.json();
            checkCacheRef.current[cacheKey] = { time: Date.now() }; // Mark as checked
            setBackendError(null);
            if (data.exists && data.customer) {
              // Block unapproved vendors from logging in at all
              if ((data.customer.role === "vendor" || data.customer.role === "shop_manager") && data.customer.vendorStatus !== "approved") {
                await signOut(auth);
                setUser(null);
                setRole("customer");
                localStorage.removeItem("mahally_user");
                setLoading(false);
                return; // finally will call setLoading(false)
              }

              setUser(firebaseUser);
              setRole(data.customer.role || "customer");
              setVendorStatus(data.customer.vendorStatus || null);
              setVendorSlug(data.customer.storeSlug || null);
              setWooId(data.customer.id || null);
              setPublicId(data.customer.publicId || null);
              setCustomerName(data.customer.displayName || null);
              setAvatarUrl(data.customer.avatarUrl || null);
              setAvatarBgColor(data.customer.avatarBgColor || "#9b8676");
              setDokanEnabled(data.customer.dokanEnabled || false);
              setEmail(data.customer.email || null);
              setPhone(data.customer.phone || null);
              setAddress(data.customer.address || null);
              setCity(data.customer.city || null);
              setIsAdmin(data.customer.isAdmin || false);
              setBilling(data.customer.billing || null);
              setShipping(data.customer.shipping || null);
              setNotificationPreferences(data.customer.notificationPreferences || null);

              const userData = {
                uid: firebaseUser.uid,
                role: data.customer.role,
                vendorStatus: data.customer.vendorStatus || null,
                vendorSlug: data.customer.storeSlug || null,
                dokanEnabled: data.customer.dokanEnabled || false,
                publicId: data.customer.publicId,
                wooId: data.customer.id,
                name: data.customer.displayName,
                email: data.customer.email,
                phone: data.customer.phone,
                address: data.customer.address,
                city: data.customer.city,
                isAdmin: data.customer.isAdmin,
                billing: data.customer.billing,
                shipping: data.customer.shipping,
                notificationPreferences: data.customer.notificationPreferences,
                avatarUrl: data.customer.avatarUrl,
                avatarBgColor: data.customer.avatarBgColor || "#9b8676"
              };
              localStorage.setItem("mahally_user", JSON.stringify(userData));
              setWooCustomerDeleted(false);
            } else if (data.exists === false) {
              setWooCustomerDeleted(true);
              await signOut(auth);
            }
          } else {
            if (res && res.status === 401) {
              localStorage.removeItem("mahally_user");
              setUser(null);
              setRole("customer");
              setWooId(null);
              setPublicId(null);
              setCustomerName(null);
              setAvatarUrl(null);
              setAvatarBgColor("#9b8676");
              await signOut(auth);
              router.push("/login");
              setLoading(false);
              return; // finally will call setLoading(false)
            }
            // Handle any failure (404, 500, 503, or network error) — don't block the UI
            const errorData = res ? await res.json().catch(() => ({})) : { message: "Network error" };
            setBackendError({
              message: errorData.message || "Failed to sync with account server. Please refresh.",
              code: errorData.code || "SYNC_ERROR",
              status: res ? res.status : 0
            });
            // Still show the user as logged in (Firebase says they are)
            setUser(firebaseUser);
          }
        } catch (e) {
          console.warn("Auth sync error:", e);
          // Always show user as logged-in with Firebase identity on any error
          setUser(firebaseUser);
        } finally {
          // ALWAYS unblock the loading spinner — no matter what path was taken
          setLoading(false);
        }
      } else {
        // User is signed out
        setUser(null);
        setRole("customer");
        setVendorStatus(null);
        setWooId(null);
        setPublicId(null);
        setCustomerName(null);
        setAvatarUrl(null);
        setAvatarBgColor("#9b8676");
        setEmail(null);
        localStorage.removeItem("mahally_user");
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const logout = async () => {
    checkedUidRef.current = null;
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    await signOut(auth);
    router.push("/login");
  };

  const refreshAuth = async () => {
    if (!auth.currentUser) return;
    try {
      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.currentUser.email || undefined,
          phone: auth.currentUser.phoneNumber || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBackendError(null);
        if (data.exists && data.customer) {
          if ((data.customer.role === "vendor" || data.customer.role === "shop_manager") && data.customer.vendorStatus !== "approved") {
             await logout();
             return;
          }
          setCustomerName(data.customer.displayName || null);
          setAvatarUrl(data.customer.avatarUrl || null);
          setAvatarBgColor(data.customer.avatarBgColor || "#9b8676");
          setRole(data.customer.role || "customer");
          setVendorStatus(data.customer.vendorStatus || null);
          setVendorSlug(data.customer.storeSlug || null);
          setDokanEnabled(data.customer.dokanEnabled || false);
          setPublicId(data.customer.publicId || null);
          setWooId(data.customer.id || null);
          setIsAdmin(data.customer.isAdmin || false);
          setBilling(data.customer.billing || null);
          setShipping(data.customer.shipping || null);
          
          const userData = {
            uid: auth.currentUser.uid,
            role: data.customer.role,
            vendorStatus: data.customer.vendorStatus || null,
            vendorSlug: data.customer.storeSlug || null,
            dokanEnabled: data.customer.dokanEnabled || false,
            publicId: data.customer.publicId,
            wooId: data.customer.id,
            name: data.customer.displayName,
            avatarUrl: data.customer.avatarUrl,
            isAdmin: data.customer.isAdmin,
            billing: data.customer.billing,
            shipping: data.customer.shipping
          };
          localStorage.setItem("mahally_user", JSON.stringify(userData));
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 503 || errorData.code === "BACKEND_DOWN") {
          setBackendError({
            message: "Server is currently offline. Some features may be unavailable.",
            code: "BACKEND_DOWN"
          });
        }
      }
    } catch (e) {
      console.warn("Refresh Auth error:", e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      customerName,
      avatarUrl,
      setAvatarUrl,
      avatarBgColor,
      setAvatarBgColor,
      email,
      loading,
      logout,
      refreshAuth,
      wooCustomerDeleted,
      role,
      vendorStatus,
      vendorSlug,
      wooId,
      publicId,
      phone,
      address,
      city,
      billing,
      shipping,
      notificationPreferences,
      setNotificationPreferences,
      backendError,
      dokanEnabled,
      isAdmin,
      messagingEnabled,
      whatsappEnabled,
      supportEmail,
      isVendor: role === "vendor" || role === "shop_manager" || isAdmin,
      isApprovedVendor: (role === "vendor" || role === "shop_manager" || isAdmin) && (vendorStatus === "approved" || dokanEnabled),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Expose refreshAuth in the hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe guest/empty fallback context instead of crashing the site during Next.js page pre-rendering
    return {
      user: null,
      wooId: null,
      role: "guest",
      loading: false,
      customerName: "Guest",
      avatarUrl: "",
      avatarBgColor: "#9b8676",
      email: "",
      isAdmin: false,
      isVendor: false,
      isApprovedVendor: false,
      messagingEnabled: false,
      whatsappEnabled: false,
      supportEmail: "",
      logout: async () => {},
      login: async () => {},
      register: async () => {}
    };
  }
  return context;
}
