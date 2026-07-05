import json
import re

header_path = "src/components/Header.js"
en_path = "messages/en.json"
ar_path = "messages/ar.json"

translations = {
    "welcomePrefix": {
        "en": "Welcome, ",
        "ar": "مرحبًا، ",
        "target": "مرحبًا، "
    },
    "customer": {
        "en": "Customer",
        "ar": "العميل",
        "target": "العميل"
    },
    "login": {
        "en": "Login",
        "ar": "تسجيل الدخول",
        "target": "تسجيل الدخول"
    },
    "adminBoard": {
        "en": "Admin Board",
        "ar": "لوحة المشرف",
        "target": "لوحة المشرف"
    },
    "vendorPortal": {
        "en": "Seller Portal",
        "ar": "بوابة البائع",
        "target": "بوابة البائع"
    },
    "merchant": {
        "en": "Merchant",
        "ar": "التاجر",
        "target": "التاجر"
    },
    "admin": {
        "en": "Admin",
        "ar": "المشرف",
        "target": "المشرف"
    },
    "dashboard": {
        "en": "Dashboard",
        "ar": "لوحة التحكم",
        "target": "لوحة التحكم"
    },
    "ordersAndAccount": {
        "en": "Orders & Account",
        "ar": "الطلبات والحساب",
        "target": "الطلبات والحساب"
    },
    "adminDashboard": {
        "en": "Admin Dashboard",
        "ar": "لوحة تحكم المشرف",
        "target": "لوحة تحكم المشرف"
    },
    "manageVendors": {
        "en": "Manage Vendors",
        "ar": "إدارة البائعين",
        "target": "إدارة البائعين"
    },
    "siteFeedback": {
        "en": "Site Feedback",
        "ar": "ملاحظات الموقع",
        "target": "ملاحظات الموقع"
    },
    "generalSettings": {
        "en": "General Settings",
        "ar": "الإعدادات العامة",
        "target": "الإعدادات العامة"
    },
    "vendorDashboard": {
        "en": "Vendor Dashboard",
        "ar": "لوحة البائع",
        "target": "لوحة البائع"
    },
    "addNewProduct": {
        "en": "Add New Product",
        "ar": "إضافة منتج جديد",
        "target": "إضافة منتج جديد"
    },
    "products": {
        "en": "Products",
        "ar": "المنتجات",
        "target": "المنتجات"
    },
    "inventory": {
        "en": "Inventory",
        "ar": "المخزون",
        "target": "المخزون"
    },
    "orders": {
        "en": "Orders",
        "ar": "الطلبات",
        "target": "الطلبات"
    },
    "reviews": {
        "en": "Reviews",
        "ar": "التقييمات",
        "target": "التقييمات"
    },
    "reports": {
        "en": "Reports",
        "ar": "التقارير",
        "target": "التقارير"
    },
    "storeSettings": {
        "en": "Store Settings",
        "ar": "إعدادات المتجر",
        "target": "إعدادات المتجر"
    },
    "yourProfile": {
        "en": "Your Profile",
        "ar": "ملفك الشخصي",
        "target": "ملفك الشخصي"
    },
    "accountSecurity": {
        "en": "Account Security",
        "ar": "أمان الحساب",
        "target": "أمان الحساب"
    },
    "yourOrders": {
        "en": "Your Orders",
        "ar": "طلباتك",
        "target": "طلباتك"
    },
    "yourReviews": {
        "en": "Your Reviews",
        "ar": "تقييماتك",
        "target": "تقييماتك"
    },
    "addresses": {
        "en": "Addresses",
        "ar": "العناوين",
        "target": "العناوين"
    },
    "couponsAndOffers": {
        "en": "Coupons & Offers",
        "ar": "القسائم والعروض",
        "target": "القسائم والعروض"
    },
    "logout": {
        "en": "Logout",
        "ar": "تسجيل الخروج",
        "target": "تسجيل الخروج"
    },
    "browsingHistory": {
        "en": "Browsing History",
        "ar": "سجل التصفح",
        "target": "سجل التصفح"
    },
    "trending": {
        "en": "Trending",
        "ar": "الرائج",
        "target": "الرائج"
    },
    "featuredProductsMenu": {
        "en": "Featured Products",
        "ar": "منتجات مميزة",
        "target": "منتجات مميزة"
    },
    "newProducts": {
        "en": "New Products",
        "ar": "المنتجات الجديدة",
        "target": "المنتجات الجديدة"
    },
    "shopByCategory": {
        "en": "Shop by Category",
        "ar": "التسوق حسب القسم",
        "target": "التسوق حسب القسم"
    },
    "viewAllMenu": {
        "en": "View All",
        "ar": "عرض الكل",
        "target": "عرض الكل"
    },
    "viewLess": {
        "en": "View Less",
        "ar": "عرض أقل",
        "target": "عرض أقل"
    },
    "ourMerchants": {
        "en": "Our Merchants",
        "ar": "تجارنا",
        "target": "تجارنا"
    },
    "allVendors": {
        "en": "All Vendors",
        "ar": "جميع البائعين",
        "target": "جميع البائعين"
    },
    "location": {
        "en": "Location",
        "ar": "الموقع",
        "target": "الموقع"
    },
    "deliveryToGov": {
        "en": "Delivery to",
        "ar": "التوصيل إلى",
        "target": "التوصيل إلى"
    },
    "updateLocation": {
        "en": "Update Location",
        "ar": "تحديث الموقع",
        "target": "تحديث الموقع"
    },
    "helpAndSettings": {
        "en": "Help & Settings",
        "ar": "المساعدة والإعدادات",
        "target": "المساعدة والإعدادات"
    },
    "yourAccount": {
        "en": "Your Account",
        "ar": "حسابك",
        "target": "حسابك"
    },
    "aboutMahally": {
        "en": "About Mahally",
        "ar": "عن محلي",
        "target": "عن محلي"
    },
    "customerService": {
        "en": "Customer Service",
        "ar": "خدمة العملاء",
        "target": "خدمة العملاء"
    },
    "scrollRight": {
        "en": "Scroll Right",
        "ar": "التمرير لليمين",
        "target": "التمرير لليمين"
    },
    "scrollLeft": {
        "en": "Scroll Left",
        "ar": "التمرير ليسار",
        "target": "التمرير ليسار"
    },
    "categoriesMenu": {
        "en": "Categories",
        "ar": "الأقسام",
        "target": "الأقسام"
    },
    "almostOutOfStock": {
        "en": "Almost out of stock",
        "ar": "يكاد ينفد",
        "target": "يكاد ينفد"
    },
    "onlyLeft": {
        "en": "only left",
        "ar": "يتبقى فقط",
        "target": "يتبقى فقط"
    }
}

with open(header_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace targets in Header.js
for key, data in translations.items():
    if key in ['welcomePrefix']:
        content = content.replace("'مرحبًا، '", "t('welcomePrefix')")
        content = content.replace("`مرحبًا، ${", "`\\${t('welcomePrefix')}${")
    elif key in ['adminBoard', 'vendorPortal']:
        content = content.replace(f"'{data['target']} ('", f"t('{key}') + ' ('")
    elif key in ['deliveryToGov']:
        content = content.replace("التوصيل إلى ", "{t('deliveryToGov')} ")
    elif key in ['almostOutOfStock']:
        content = content.replace("يكاد ينفد (يتبقى فقط ${p.stock_quantity})", "{t('almostOutOfStock')} ({t('onlyLeft')} ${p.stock_quantity})")
    else:
        # replace exact string matches with {t('key')} inside JSX, or t('key') if in string template
        content = content.replace(f">{data['target']}<", f">{{t('{key}')}}<")
        content = content.replace(f" {data['target']} ", f" {{t('{key}')}} ")
        content = content.replace(f"'{data['target']}'", f"t('{key}')")
        content = content.replace(f"\"{data['target']}\"", f"t('{key}')")

with open(header_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update en.json
with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

if 'Header' not in en_data:
    en_data['Header'] = {}

for key, data in translations.items():
    en_data['Header'][key] = data['en']

with open(en_path, 'w', encoding='utf-8') as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)

# Update ar.json
with open(ar_path, 'r', encoding='utf-8') as f:
    ar_data = json.load(f)

if 'Header' not in ar_data:
    ar_data['Header'] = {}

for key, data in translations.items():
    ar_data['Header'][key] = data['ar']

with open(ar_path, 'w', encoding='utf-8') as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)

print("Done")
