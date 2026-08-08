import sys

file_path = "src/app/[locale]/vendors/[slug]/page.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add useTranslations
if 'useTranslations' not in content:
    content = content.replace('import { useAuth } from "@/context/AuthContext";', 'import { useAuth } from "@/context/AuthContext";\nimport { useTranslations } from "next-intl";')

if 'const t = useTranslations("VendorProfile");' not in content:
    content = content.replace('export default function VendorProfilePage() {', 'export default function VendorProfilePage() {\n  const t = useTranslations("VendorProfile");')

replacements = {
    '"تم تحديث الملف الشخصي بنجاح!"': 't("profileUpdated")',
    '"فشل حفظ الملف الشخصي: "': 't("profileUpdateFailed")',
    'alert(t("profileUpdateFailed") + err.message)': 'alert(`${t("profileUpdateFailed")} ${err.message}`)',
    '"المتجر غير موجود"': 't("storeNotFound")',
    '"هذا التاجر غير موجود أو تم تعطيله."': 't("storeDisabledDesc")',
    '"العودة إلى المتاجر"': 't("backToStores")',
    '"يرجى تسجيل الدخول لمتابعة هذا المتجر!"': 't("loginToFollow")',
    '"أنت"': 't("you")',
    '"تغيير صورة الغلاف"': 't("changeCover")',
    '"تعديل الموضع"': 't("adjustPosition")',
    '"(أنا)"': '`(${t("me")})`',
    '"متجر"': 't("storeFallback")',
    '{v.followerCount || "0"} متابع': '{t("followerCount", { count: v.followerCount || 0 })}',
    'بائع موثوق': '{t("trustedSeller")}',
    '<>متابع</>': '<>{t("following")}</>',
    '<>متابعة</>': '<>{t("follow")}</>',
    'متابع': '{t("following")}',
    'إلغاء المتابعة': '{t("unfollow")}',
    'واتساب': '{t("whatsapp")}',
    'مراسلة': '{t("message")}',
    'حفظ ملف المتجر': '{t("saveProfile")}',
    'الإبلاغ عن المتجر': 't("reportStore")',
    "title=\"الإبلاغ عن المتجر\"": "title={t(\"reportStore\")}",
    'label: \'المنتجات\'': 'label: t("tabProducts")',
    'label: \'معلومات البائع\'': 'label: t("tabAbout")',
    'label: \'التقييمات\'': 'label: t("tabReviews")',
    'label: \'المتابعون\'': 'label: t("tabFollowers")',
    'ابحث داخل المتجر': '{t("searchStore")}',
    'placeholder="ابحث عن منتجات..."': 'placeholder={t("searchProductsPlaceholder")}',
    'نطاق السعر': '{t("priceRange")}',
    'placeholder="الحد الأدنى"': 'placeholder={t("minPrice")}',
    'placeholder="الحد الأقصى"': 'placeholder={t("maxPrice")}',
    'ترتيب حسب': '{t("sortBy")}',
    '>الأكثر ملاءمة<': '>{t("sortRelevant")}<',
    '>السعر من الأقل إلى الأعلى<': '>{t("sortPriceAsc")}<',
    '>السعر من الأعلى إلى الأقل<': '>{t("sortPriceDesc")}<',
    '>الأحدث<': '>{t("sortNewest")}<',
    'فئات المتجر': '{t("storeCategories")}',
    '"الكل" : cat': 't("all") : cat',
    'خدمة العملاء': '{t("customerService")}',
    'هذا التاجر عادةً يرد خلال 24 ساعة. لمعلومات الإرجاع، يرجى مراجعة سياسة محلي للإرجاع.': '{t("customerServiceDesc")}',
    'المنتجات المميزة': '{t("featuredProducts")}',
    '>عرض:<': '>{t("viewLabel")}<',
    'لم يتم العثور على منتجات تطابق بحثك.': '{t("noProductsFound")}',
    '>اسم المنتج<': '>{t("colProductName")}<',
    '>السعر<': '>{t("colPrice")}<',
    '>الفئة<': '>{t("colCategory")}<',
    '>الإجراء<': '>{t("colAction")}<',
    'alt={p.name || "منتج"}': 'alt={p.name || t("productImageAlt")}',
    'نفدت الكمية': '{t("outOfStock")}',
    'أضف للسلة': '{t("addToCart")}',
    'تحديد الخيارات': '{t("options")}',
}

for ar, en in replacements.items():
    content = content.replace(ar, en)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done replacing.")
