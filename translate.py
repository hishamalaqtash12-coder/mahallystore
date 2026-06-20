import json
import re

with open('c:/Users/ASUS/Desktop/FE/messages/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)['Header']

with open('c:/Users/ASUS/Desktop/FE/src/components/Header.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'التوصيل إلى': '{t("deliveryTo")}',
    'الأقسام': '{t("categories")}',
    'ابحث في محلي': '{t("searchPlaceholder")}',
    'لا توجد نتائج': '{t("noResults")}',
    'لوحة التحكم': '{t("dashboard")}',
    'الطلبات والحساب': '{t("ordersAndAccount")}',
    'بوابة البائع': '{t("vendorPortal")}',
    'لوحة المشرف': '{t("adminPanel")}',
    'تسجيل الدخول': '{t("login")}',
    'لوحة تحكم المشرف': '{t("adminDashboard")}',
    'إدارة البائعين': '{t("manageVendors")}',
    'ملاحظات الموقع': '{t("siteFeedback")}',
    'الإعدادات العامة': '{t("generalSettings")}',
    'لوحة البائع': '{t("vendorDashboard")}',
    'إضافة منتج جديد': '{t("addNewProduct")}',
    'المنتجات': '{t("products")}',
    'المخزون': '{t("inventory")}',
    'الطلبات': '{t("orders")}',
    'التقييمات': '{t("reviews")}',
    'التقارير': '{t("reports")}',
    'إعدادات المتجر': '{t("storeSettings")}',
    'ملفك الشخصي': '{t("profile")}',
    'أمان الحساب': '{t("security")}',
    'طلباتك': '{t("yourOrders")}',
    'تقييماتك': '{t("yourReviews")}',
    'العناوين': '{t("addresses")}',
    'القسائم والعروض': '{t("coupons")}',
    'تسجيل الخروج': '{t("logout")}',
    'سجل التصفح': '{t("browsingHistory")}',
    'غير متوفر': '{t("outOfStock")}',
    'متوفر': '{t("inStock")}',
    'أضف إلى السلة': '{t("addToCart")}',
    'لا توجد عناصر تمت مشاهدتها مؤخرًا.': '{t("noRecentItems")}',
    'الرسائل': '{t("messages")}',
    'المفضلة': '{t("wishlist")}',
    'السلة': '{t("cart")}',
    'المتاجر': '{t("vendors")}',
    'منتجات مميزة': '{t("featuredProducts")}',
    'المساعدة والدعم': '{t("helpAndSupport")}',
    'تصفح جميع المنتجات': '{t("browseAllProducts")}'
}

for ar_text, t_expr in replacements.items():
    content = content.replace(f'>{ar_text}<', f'>{t_expr}<')
    content = content.replace(f'"{ar_text}"', t_expr)

with open('c:/Users/ASUS/Desktop/FE/src/components/Header.js', 'w', encoding='utf-8') as f:
    f.write(content)
