import sys
import json
import re

en_file = "messages/en.json"
ar_file = "messages/ar.json"
component_file = "src/components/QuickLookModal.js"

# Add translations to en.json
with open(en_file, "r", encoding="utf-8") as f:
    en_data = json.load(f)

if "QuickLook" not in en_data:
    en_data["QuickLook"] = {}

en_data["QuickLook"].update({
    "ratingSingular": "Rating",
    "ratingPlural": "Ratings",
    "limitedTimeOffer": "Limited time offer",
    "jod": "JOD",
    "originalPrice": "Original price:",
    "discount": "({discount}% off)",
    "noReturns": "Not eligible for return",
    "eligibleForReturn": "Eligible for return or refund within {days} days",
    "eligibleForReturnGlobal": "Eligible for return or refund",
    "expectedDelivery": "Expected Delivery:",
    "merchantView": "Merchant View:",
    "cannotBuyOwnProducts": "You cannot purchase your own products.",
    "manageProduct": "Manage Product",
    "purchasingDisabled": "Purchasing Disabled",
    "adminsCannotBuy": "Sellers and admins cannot purchase products.",
    "outOfStock": "Out of Stock",
    "unavailableForPurchase": "— Unavailable for purchase",
    "productInCart": "Product in your cart",
    "remove": "Remove",
    "addToCart": "Add to Cart",
    "buyNow": "Buy Now",
    "viewFullDetails": "View full product details",
    "soldBy": "Sold by {merchantName}"
})

with open(en_file, "w", encoding="utf-8") as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)

# Add translations to ar.json
with open(ar_file, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

if "QuickLook" not in ar_data:
    ar_data["QuickLook"] = {}

ar_data["QuickLook"].update({
    "ratingSingular": "تقييم",
    "ratingPlural": "تقييمات",
    "limitedTimeOffer": "عرض لفترة محدودة",
    "jod": "د.أ",
    "originalPrice": "السعر الأصلي:",
    "discount": "({discount}% خصم)",
    "noReturns": "لا يقبل الإرجاع",
    "eligibleForReturn": "مؤهل للإرجاع أو الاسترداد خلال {days} يوماً",
    "eligibleForReturnGlobal": "مؤهل للإرجاع أو الاسترداد",
    "expectedDelivery": "التوصيل المتوقع:",
    "merchantView": "عرض التاجر:",
    "cannotBuyOwnProducts": "لا يمكنك شراء منتجاتك الخاصة.",
    "manageProduct": "إدارة المنتج",
    "purchasingDisabled": "الشراء معطل",
    "adminsCannotBuy": "لا يمكن للتجار والمشرفين شراء المنتجات.",
    "outOfStock": "نفدت الكمية",
    "unavailableForPurchase": "— غير متاح للشراء",
    "productInCart": "المنتج في سلتك",
    "remove": "إزالة",
    "addToCart": "أضف إلى السلة",
    "buyNow": "اشتري الآن",
    "viewFullDetails": "عرض تفاصيل المنتج كاملة",
    "soldBy": "يباع بواسطة {merchantName}"
})

with open(ar_file, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)

# Update QuickLookModal.js
with open(component_file, "r", encoding="utf-8") as f:
    content = f.read()

if 'useTranslations' not in content:
    content = content.replace('import { useAuth } from "@/context/AuthContext";', 'import { useAuth } from "@/context/AuthContext";\nimport { useTranslations } from "next-intl";')

if 'const t = useTranslations("QuickLook");' not in content:
    content = content.replace('export default function QuickLookModal({ product: initialProduct, isOpen, onClose }) {', 'export default function QuickLookModal({ product: initialProduct, isOpen, onClose }) {\n  const t = useTranslations("QuickLook");')


replacements = {
    '"لا يقبل الإرجاع"': 't("noReturns")',
    '`مؤهل للإرجاع أو الاسترداد خلال ${itemReturnPeriod || "14"} يوماً`': 't("eligibleForReturn", { days: itemReturnPeriod || "14" })',
    '`مؤهل للإرجاع أو الاسترداد خلال ${globalPeriod || "14"} يوماً`': 't("eligibleForReturn", { days: globalPeriod || "14" })',
    '"مؤهل للإرجاع أو الاسترداد"': 't("eligibleForReturnGlobal")',
    'ratingCount === 1 ? \'تقييم\' : \'تقييمات\'': 'ratingCount === 1 ? t("ratingSingular") : t("ratingPlural")',
    'عرض لفترة محدودة': '{t("limitedTimeOffer")}',
    '>د.أ<': '>{t("jod")}<',
    'السعر الأصلي:': '{t("originalPrice")}',
    '({discount}% خصم)': '{t("discount", { discount })}',
    'التوصيل المتوقع:': '{t("expectedDelivery")}',
    '<strong>عرض التاجر:</strong> لا يمكنك شراء منتجاتك الخاصة.': '<strong>{t("merchantView")}</strong> {t("cannotBuyOwnProducts")}',
    'إدارة المنتج': '{t("manageProduct")}',
    '>الشراء معطل<': '>{t("purchasingDisabled")}<',
    '>لا يمكن للتجار والمشرفين شراء المنتجات.<': '>{t("adminsCannotBuy")}<',
    '>نفدت الكمية<': '>{t("outOfStock")}<',
    '>— غير متاح للشراء<': '>{t("unavailableForPurchase")}<',
    'المنتج في سلتك': '{t("productInCart")}',
    'إزالة': '{t("remove")}',
    '>أضف إلى السلة<': '>{t("addToCart")}<',
    '>اشتري الآن<': '>{t("buyNow")}<',
    'عرض تفاصيل المنتج كاملة': '{t("viewFullDetails")}',
    'يباع بواسطة {merchantName || "محلي الرسمي"}': '{t("soldBy", { merchantName: merchantName || "محلي الرسمي" })}'
}

for ar, en in replacements.items():
    content = content.replace(ar, en)

with open(component_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Translation update complete.")
