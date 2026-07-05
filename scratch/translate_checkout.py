import sys
import json
import re

en_file = "messages/en.json"
ar_file = "messages/ar.json"
component_file = "src/app/[locale]/checkout/page.js"

# Add translations to en.json
with open(en_file, "r", encoding="utf-8") as f:
    en_data = json.load(f)

if "Checkout" not in en_data:
    en_data["Checkout"] = {}

en_data["Checkout"].update({
    "errFirstNameRequired": "First name is required.",
    "errEmailRequired": "Email is required.",
    "errEmailInvalid": "Please enter a valid email address.",
    "errPhoneRequired": "Phone number is required.",
    "errAddressRequired": "Address is required.",
    "errFormFix": "Please fix the errors in the shipping form.",
    "errCartEmpty": "Your shopping cart is empty.",
    "errServer": "Server error ({status}). Please try again later.",
    "errOrderFailed": "Failed to place order.",
    "errOrderFailedTryAgain": "Failed to place order. Please try again.",
    "loadingSession": "Verifying your session...",
    "orderSuccessTitle": "Order Placed, Thank You!",
    "orderNumber": "Order #{orderId}",
    "orderProcessing": "Your order is being processed and will be shipped soon.",
    "continueShopping": "Continue Shopping",
    "mahally": "Mahally",
    "checkoutTitle": "Checkout",
    "shippingAddress": "Shipping Address",
    "firstNamePlaceholder": "First Name *",
    "lastNamePlaceholder": "Last Name",
    "emailPlaceholder": "Email Address *",
    "phonePlaceholder": "Phone Number (e.g. 079XXXXXXX) *",
    "addressPlaceholder": "Street name and area *",
    "countryJordan": "Jordan",
    "paymentMethod": "Payment Method",
    "cashOnDelivery": "Cash on Delivery (COD)",
    "payCashOnDelivery": "Pay in cash upon receiving your order.",
    "reviewItems": "Review items and shipping",
    "qty": "Qty: {quantity}",
    "confirmingOrder": "Confirming order...",
    "confirmOrder": "Confirm Order",
    "processing": "Processing...",
    "agreeToConditions": "By confirming your order, you agree to Mahally's ",
    "termsOfUse": "Terms of Use",
    "orderSummary": "Order Summary",
    "items": "Items:",
    "shippingAndHandling": "Shipping & Handling:",
    "vendorRatesApplied": "Vendor rates applied",
    "totalBeforeTax": "Total before tax:",
    "estimatedTax": "Estimated tax:",
    "orderTotal": "Order Total:"
})

with open(en_file, "w", encoding="utf-8") as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)

# Add translations to ar.json
with open(ar_file, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

if "Checkout" not in ar_data:
    ar_data["Checkout"] = {}

ar_data["Checkout"].update({
    "errFirstNameRequired": "الاسم الأول مطلوب.",
    "errEmailRequired": "البريد الإلكتروني مطلوب.",
    "errEmailInvalid": "يرجى إدخال بريد إلكتروني صحيح.",
    "errPhoneRequired": "رقم الهاتف مطلوب.",
    "errAddressRequired": "العنوان مطلوب.",
    "errFormFix": "يرجى إصلاح الأخطاء في نموذج الشحن.",
    "errCartEmpty": "سلة التسوق فارغة.",
    "errServer": "خطأ في الخادم ({status}). يرجى المحاولة لاحقاً.",
    "errOrderFailed": "فشل تقديم الطلب.",
    "errOrderFailedTryAgain": "فشل تقديم الطلب. يرجى المحاولة مرة أخرى.",
    "loadingSession": "جاري التحقق من جلستك...",
    "orderSuccessTitle": "تم تقديم الطلب، شكراً لك!",
    "orderNumber": "رقم الطلب #{orderId}",
    "orderProcessing": "جاري معالجة طلبك وسيتم شحنه قريباً.",
    "continueShopping": "متابعة التسوق",
    "mahally": "محلي",
    "checkoutTitle": "إتمام الطلب",
    "shippingAddress": "عنوان الشحن",
    "firstNamePlaceholder": "الاسم الأول *",
    "lastNamePlaceholder": "الاسم الأخير",
    "emailPlaceholder": "البريد الإلكتروني *",
    "phonePlaceholder": "رقم الهاتف (مثال: 079XXXXXXX) *",
    "addressPlaceholder": "اسم الشارع والمنطقة *",
    "countryJordan": "الأردن",
    "paymentMethod": "طريقة الدفع",
    "cashOnDelivery": "الدفع عند الاستلام (COD)",
    "payCashOnDelivery": "ادفع نقداً عند استلام طلبك.",
    "reviewItems": "مراجعة المنتجات والشحن",
    "qty": "الكمية: {quantity}",
    "confirmingOrder": "جاري تأكيد الطلب...",
    "confirmOrder": "تأكيد الطلب",
    "processing": "جاري المعالجة...",
    "agreeToConditions": "بتأكيد طلبك، أنت توافق على ",
    "termsOfUse": "شروط الاستخدام",
    "orderSummary": "ملخص الطلب",
    "items": "المنتجات:",
    "shippingAndHandling": "الشحن والتوصيل:",
    "vendorRatesApplied": "تم تطبيق أسعار التاجر",
    "totalBeforeTax": "المجموع قبل الضريبة:",
    "estimatedTax": "الضريبة المقدرة:",
    "orderTotal": "المجموع الكلي:"
})

with open(ar_file, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)

# Update checkout/page.js
with open(component_file, "r", encoding="utf-8") as f:
    content = f.read()

if 'useTranslations' not in content:
    content = content.replace('import { useAuth } from "@/context/AuthContext";', 'import { useAuth } from "@/context/AuthContext";\nimport { useTranslations } from "next-intl";')

if 'const t = useTranslations("Checkout");' not in content:
    content = content.replace('export default function CheckoutPage() {', 'export default function CheckoutPage() {\n  const t = useTranslations("Checkout");')

replacements = {
    '"الاسم الأول مطلوب."': 't("errFirstNameRequired")',
    '"البريد الإلكتروني مطلوب."': 't("errEmailRequired")',
    '"يرجى إدخال بريد إلكتروني صحيح."': 't("errEmailInvalid")',
    '"رقم الهاتف مطلوب."': 't("errPhoneRequired")',
    '"العنوان مطلوب."': 't("errAddressRequired")',
    '"يرجى إصلاح الأخطاء في نموذج الشحن."': 't("errFormFix")',
    '"سلة التسوق فارغة."': 't("errCartEmpty")',
    '`خطأ في الخادم (${response.status}). يرجى المحاولة لاحقاً.`': 't("errServer", { status: response.status })',
    '"فشل تقديم الطلب."': 't("errOrderFailed")',
    '"فشل تقديم الطلب. يرجى المحاولة مرة أخرى."': 't("errOrderFailedTryAgain")',
    '"جاري التحقق من جلستك..."': 't("loadingSession")',
    'تم تقديم الطلب، شكراً لك!': '{t("orderSuccessTitle")}',
    'رقم الطلب #{orderId}': '{t("orderNumber", { orderId })}',
    'جاري معالجة طلبك وسيتم شحنه قريباً.': '{t("orderProcessing")}',
    'متابعة التسوق': '{t("continueShopping")}',
    'محلي': '{t("mahally")}',
    'إتمام الطلب': '{t("checkoutTitle")}',
    'عنوان الشحن': '{t("shippingAddress")}',
    '"الاسم الأول *"': 't("firstNamePlaceholder")',
    '"الاسم الأخير"': 't("lastNamePlaceholder")',
    '"البريد الإلكتروني *"': 't("emailPlaceholder")',
    '"رقم الهاتف (مثال: 079XXXXXXX) *"': 't("phonePlaceholder")',
    '"اسم الشارع والمنطقة *"': 't("addressPlaceholder")',
    '"الأردن"': 't("countryJordan")',
    'طريقة الدفع': '{t("paymentMethod")}',
    'الدفع عند الاستلام (COD)': '{t("cashOnDelivery")}',
    'ادفع نقداً عند استلام طلبك.': '{t("payCashOnDelivery")}',
    'مراجعة المنتجات والشحن': '{t("reviewItems")}',
    'الكمية: {item.quantity}': '{t("qty", { quantity: item.quantity })}',
    '"جاري تأكيد الطلب..." : "تأكيد الطلب"': 't("confirmingOrder") : t("confirmOrder")',
    '"جاري المعالجة..." : "تأكيد الطلب"': 't("processing") : t("confirmOrder")',
    'بتأكيد طلبك، أنت توافق على': '{t("agreeToConditions")}',
    '>شروط الاستخدام<': '>{t("termsOfUse")}<',
    'ملخص الطلب': '{t("orderSummary")}',
    'المنتجات:': '{t("items")}',
    'الشحن والتوصيل:': '{t("shippingAndHandling")}',
    'تم تطبيق أسعار التاجر': '{t("vendorRatesApplied")}',
    'المجموع قبل الضريبة:': '{t("totalBeforeTax")}',
    'الضريبة المقدرة:': '{t("estimatedTax")}',
    'المجموع الكلي:': '{t("orderTotal")}'
}

for ar, en in replacements.items():
    content = content.replace(ar, en)

with open(component_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Translation update complete.")
