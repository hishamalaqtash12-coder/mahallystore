import re
import json

header_path = "src/components/Header.js"

with open(header_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'aria-label="اختر القسم"': "aria-label={t('categoriesMenu')}",
    "لوحة {t('admin')}": "{t('adminBoard')}",
    "بوابة البائع": "{t('vendorPortal')}",
    " إضافة منتج جديد": " {t('addNewProduct')}",
    " المخزون": " {t('inventory')}",
    " التقييمات": " {t('reviews')}",
    " التقارير": " {t('reports')}",
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(header_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
