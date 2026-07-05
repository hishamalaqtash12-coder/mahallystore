import re
import json

header_path = "src/components/Header.js"

with open(header_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    " ملفك الشخصي": " {t('yourProfile')}",
    " أمان الحساب": " {t('accountSecurity')}",
    " طلباتك": " {t('yourOrders')}",
    " تقييماتك": " {t('yourReviews')}",
    " العناوين": " {t('addresses')}",
    " القسائم والعروض": " {t('couponsAndOffers')}",
    " تسجيل الخروج": " {t('logout')}",
    "سجل التصفح ": "{t('browsingHistory')} ",
    " سجل التصفح": " {t('browsingHistory')}",
    "يكاد ينفد (يتبقى فقط ": "{t('almostOutOfStock')} ({t('onlyLeft')} ",
    "})</p>": "})</p>",
    " د.أ": " {t('jod')}",
    " الأقسام": " {t('categoriesMenu')}",
    " منتجات مميزة": " {t('featuredProductsMenu')}",
    "{t('products')} الجديدة": "{t('newProducts')}",
    "عرض أقل ": "{t('viewLess')} ",
    "عرض الكل ": "{t('viewAllMenu')} ",
    " جميع البائعين": " {t('allVendors')}",
    " لوحة البائع": " {t('vendorDashboard')}",
    "مرحبًا، ": "{t('welcomePrefix')}",
    " لوحة تحكم المشرف": " {t('adminDashboardMenu')}",
    " إدارة البائعين": " {t('manageVendors')}",
    " ملاحظات الموقع": " {t('siteFeedback')}",
    " الإعدادات العامة": " {t('generalSettings')}",
    " المنتجات</Link>": " {t('products')}</Link>",
    " الطلبات</Link>": " {t('orders')}</Link>",
    " إعدادات المتجر</Link>": " {t('storeSettings')}</Link>",
    "اختر موقعك": "{t('chooseLocation')}",
    "قد تختلف خيارات الشحن وسرعة التوصيل حسب الموقع.": "{t('shippingOptionsMayVary')}",
    ">تم<": ">{t('done')}<",
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(header_path, 'w', encoding='utf-8') as f:
    f.write(content)

en_additions = {
    "jod": "JOD",
    "chooseLocation": "Choose Your Location",
    "shippingOptionsMayVary": "Shipping options and delivery speed may vary depending on the location.",
    "done": "Done"
}

ar_additions = {
    "jod": "د.أ",
    "chooseLocation": "اختر موقعك",
    "shippingOptionsMayVary": "قد تختلف خيارات الشحن وسرعة التوصيل حسب الموقع.",
    "done": "تم"
}

for path, additions in [("messages/en.json", en_additions), ("messages/ar.json", ar_additions)]:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for k, v in additions.items():
        if k not in data.get('Header', {}):
            data.setdefault('Header', {})[k] = v
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Done")
