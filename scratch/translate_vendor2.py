import sys
import json

file_path = "src/app/[locale]/vendors/[slug]/page.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    '"المتجر غير موجود"': 't("storeNotFound")',
    '"هذا التاجر غير موجود أو تم تعطيله."': 't("storeDisabledDesc")',
    'العودة إلى المتاجر': '{t("backToStores")}',
    '"تغيير صورة الغلاف"': 't("changeCover")',
    '"تعديل الموضع"': 't("adjustPosition")',
    '>(أنا)<': '>({t("me")})<',
    'إلغاء ال{t("following")}ة': '{t("unfollow")}',
    'ال{t("following")}ون': '{t("tabFollowers")}',
    'من': '{t("from")}',
    'د.أ': '{t("currency")}',
    'نظرة سريعة': '{t("quickLook")}',
    'عرض الخيارات': '{t("viewOptions")}',
    'نبذة عن': '{t("aboutStore")}',
    'نبذة عن التاجر': '{t("aboutSellerLabel")}',
    '"هذا التاجر عضو موثوق في مجتمع مهالي، ويسعى لتقديم منتجات عالية الجودة وخدمة عملاء متميزة."': 't("defaultStoreDesc")',
    'معلومات النشاط التجاري': '{t("businessInfo")}',
    'الموقع: عمان، الأردن': '{t("locationAmman")}',
    'عضو في مهالي منذ:': '{t("memberSince")}',
    'طرق الاتصال': '{t("contactMethods")}',
    'الدردشة عبر {t("whatsapp")}': '{t("chatViaWhatsapp")}',
    'معلومات الاتصال خاصة.': '{t("contactPrivate")}',
    'عبر مهالي &gt;': '{t("viaMahally")} &gt;',
    'من 5': '{t("outOf5")}',
    '"تقييم"': 't("ratingSingular")',
    '"التقييمات"': 't("ratingPlural")',
    'نجوم': '{t("stars")}',
    'أبرز التقييمات لهذا البائع': '{t("topReviews")}',
    'شراء موثوق': '{t("verifiedPurchase")}',
    'تمت المراجعة في ': '{t("reviewedOn")} ',
    'لا توجد تقييمات بعد': '{t("noReviewsYet")}',
    'لم يترك العملاء أي ملاحظات بعد على متجر هذا البائع. التقييمات تساعد المشترين الآخرين على اتخاذ قرار أفضل.': '{t("noReviewsDesc")}',
    'عضو موثوق': '{t("trustedMember")}',
    'لا يوجد {t("following")}ون بعد': '{t("noFollowersYet")}',
    'كن أول من يتابع': '{t("beFirstToFollow")}',
    'لتصلك تحديثاتهم عن المنتجات والعروض الجديدة!': '{t("toGetUpdates")}',
    '(\'ar-EG\', { month: \'long\', day: \'numeric\', year: \'numeric\' })': '()', # Remove hardcoded Arabic locale in date formatting
}

for ar, en in replacements.items():
    content = content.replace(ar, en)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done replacing.")
