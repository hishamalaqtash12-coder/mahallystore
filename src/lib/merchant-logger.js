export const logMerchantAction = async (user, action, details) => {
  if (!user) return;
  try {
    await fetch("/api/merchant/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email || "",
        phone: user.phoneNumber || "",
        action,
        details
      })
    });
  } catch (err) {
    console.error("Failed to log action:", err);
  }
};
