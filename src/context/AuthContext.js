"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";

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
  const checkCacheRef = useRef({}); // Simple cache for check-user results

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

  // Main session initialization
  useEffect(() => {
    const saved = localStorage.getItem("mahally_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Block unapproved vendors from logging in
        if ((parsed.role === "vendor" || parsed.role === "shop_manager") && parsed.vendorStatus !== "approved") {
          localStorage.removeItem("mahally_user");
          setUser(null);
          setRole("customer");
          setLoading(false);
          return;
        }

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
        
        // Set a mock user object for backward compatibility
        setUser({ uid: parsed.uid || String(parsed.wooId), email: parsed.email, phone: parsed.phone, _fromCache: true });
        setLoading(false);
        
        // Sync with backend asynchronously
        syncWithBackend(parsed);
      } catch (e) {
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [router]);

  const syncWithBackend = async (parsedUser) => {
    try {
      const cacheKey = parsedUser.email || parsedUser.phone;
      if (checkCacheRef.current[cacheKey]) {
        const cached = checkCacheRef.current[cacheKey];
        if (Date.now() - cached.time < 60000) return; // 1 minute cache
      }

      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsedUser.email || undefined,
          phone: parsedUser.phone || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        checkCacheRef.current[cacheKey] = { time: Date.now() }; 
        setBackendError(null);

        if (data.exists && data.customer) {
          if ((data.customer.role === "vendor" || data.customer.role === "shop_manager") && data.customer.vendorStatus !== "approved") {
            await logout();
            return;
          }

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
            uid: parsedUser.uid || String(data.customer.id),
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
          setUser({ uid: userData.uid, email: userData.email, phone: userData.phone });
        } else if (data.exists === false) {
          setWooCustomerDeleted(true);
          await logout();
        }
      } else if (res.status === 401) {
        await logout();
      }
    } catch (e) {
      console.warn("Backend sync failed:", e);
    }
  };

  const logout = async () => {
    localStorage.removeItem("mahally_user");
    setUser(null);
    setRole("customer");
    setVendorStatus(null);
    setWooId(null);
    setPublicId(null);
    setCustomerName(null);
    setAvatarUrl(null);
    setAvatarBgColor("#9b8676");
    setEmail(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  };

  const refreshAuth = async () => {
    const saved = localStorage.getItem("mahally_user");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      await syncWithBackend(parsed);
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
