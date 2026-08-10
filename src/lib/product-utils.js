/**
 * Shared product utilities that can be used in both Server and Client components.
 */

export function isProductOutOfStock(product) {
  if (!product) return true;
  if (product.stock_status === "outofstock") return true;
  // If stock quantity is explicitly 0 or less, treat as out of stock (catches WooCommerce sync issues)
  if (product.stock_quantity !== null && parseInt(product.stock_quantity) <= 0) return true;
  return false;
}

export function getProductMerchant(product) {
  if (!product) return { name: null, id: null, slug: null };
  const name =
    product.store?.shop_name ||
    product.store?.name ||
    product.meta_data?.find(m => m.key === "merchant_name")?.value ||
    product.meta_data?.find(m => m.key === "mahally_owner_name")?.value ||
    null;
  const id =
    product.meta_data?.find(m => m.key === "_vendor_id")?.value ||
    product.meta_data?.find(m => m.key === "mahally_owner_id")?.value ||
    product.store?.id ||
    product.author ||
    null;
  
  let slug = null;
  if (product.store?.url) {
    const parts = product.store.url.replace(/\/$/, '').split('/');
    slug = parts[parts.length - 1];
  }
  
  return { name, id, slug };
}

export function getProductIdentifier(product, merchantOverride = null) {
  if (!product) return "";
  let storeName = "";
  let storeId = "";

  if (merchantOverride) {
    storeName = merchantOverride.storeName || "";
    storeId = merchantOverride.storeId || "";
  } else if (product.store) {
    storeName = product.store.shop_name || product.store.name || "";
    storeId = product.store.id || "";
  } else if (product.meta_data) {
    const mName = product.meta_data.find((m) => m.key === "merchant_name" || m.key === "mahally_owner_name");
    const mId = product.meta_data.find((m) => m.key === "_vendor_id" || m.key === "mahally_owner_id");
    if (mName) storeName = mName.value;
    if (mId) storeId = mId.value;
  }
  if (!storeName && product.author) {
    storeId = product.author;
  }

  const cleanStoreName = (storeName || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
  const storePrefix = cleanStoreName ? cleanStoreName.substring(0, 3).padEnd(3, "X") : "";
  const vendorIdStr = storeId || "";
  const productId = product.product_id || product.databaseId || product.id || 0;
  
  // Use the WooCommerce SKU if it follows the MAH-... registered format
  if (product.sku && /^MAH-/i.test(product.sku)) {
    return product.sku.toUpperCase();
  }
  
  if (storePrefix && vendorIdStr) {
    return `MAH-${storePrefix}-${vendorIdStr}-${productId}`;
  } else {
    return `MAH-${productId}`;
  }
}

export function getProductUrl(product, merchantOverride = null) {
  if (!product) return "/";
  const productId = product.product_id || product.databaseId || product.id || 0;
  const wpSlug = product.slug
    ? product.slug
    : (product.name || product.product_name || "product")
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-|-$/g, "");
        
  // If SKU is MAH-AMM-35-8965, the base identifier is MAH-AMM-35
  const identifier = getProductIdentifier(product, merchantOverride);
  
  // They requested MAH-[vendor]-[vendorid]-[productName]-[serialnumber]
  // We remove the trailing -[productId] from identifier to insert the productName before it
  let baseIdentifier = identifier;
  if (baseIdentifier.endsWith(`-${productId}`)) {
    baseIdentifier = baseIdentifier.substring(0, baseIdentifier.lastIndexOf(`-${productId}`));
  }
  
  return `/product/${baseIdentifier}-${wpSlug}-${productId}`;
}

// Complete Exhaustive English Category Translations Dictionary
const CATEGORY_TRANSLATIONS_EN = {
  // Main Parent Categories
  "أزياء": "Fashion",
  "أطفال وألعاب": "Kids & Toys",
  "إلكترونيات": "Electronics",
  "تغليف المنتجات": "Product Packaging",
  "منزل ومطبخ": "Home & Kitchen",
  "جمال وعناية": "Beauty & Care",
  "مستلزمات رياضية": "Sports & Outdoor",
  "سيارات ولوازمها": "Automotive",
  "قرطاسية ومكتبية": "Stationery & Office",
  "هدايا ومناسبات": "Gifts & Occasions",
  "حرف يدوية ومنتجات محلية": "Handcrafts & Local Products",
  "منتجات رقمية": "Digital Products",
  "رحلات وتجارب": "Trips & Experiences",
  "حدائق وزراعة": "Gardens & Agriculture",
  "مستلزمات حيوانات": "Pet Supplies",
  "مستلزمات الشحن": "Shipping Supplies",

  // Subcategories
  "أثاث وديكور": "Furniture & Decor",
  "أجهزة مطبخ صغيرة": "Small Kitchen Appliances",
  "أجهزة منزلية كبيرة": "Large Home Appliances",
  "أحذية": "Shoes",
  "أدوات التغليف": "Packaging Tools",
  "أدوات الحدائق": "Garden Tools",
  "أدوات الكتابة": "Writing Instruments",
  "أدوات المائدة": "Tableware & Cutlery",
  "أدوات هندسية ومدرسية": "School & Engineering Tools",
  "أزياء أطفال": "Kids Fashion",
  "أزياء رجالية": "Men's Fashion",
  "أزياء نسائية": "Women's Fashion",
  "ألعاب الفيديو": "Video Games",
  "ألعاب تعليمية وترفيهية": "Educational & Fun Toys",
  "أواني وأدوات طبخ": "Cookware & Kitchenware",
  "إضاءة": "Lighting",
  "إضاءة وخارجية": "Outdoor Lighting",
  "إكسسوارات أزياء": "Fashion Accessories",
  "إكسسوارات الحفلات": "Party Accessories",
  "اشتراكات رقمية": "Digital Subscriptions",
  "التخزين والشبكات": "Storage & Networking",
  "التخييم والأنشطة الخارجية": "Camping & Outdoor Activities",
  "الزينة والديكور": "Decoration & Decor",
  "العناية والحماية": "Care & Protection",
  "باقات تخييم ويوم واحد": "Camping & Day Packages",
  "تابلت وإكسسوارات": "Tablets & Accessories",
  "تجارب وأنشطة": "Experiences & Activities",
  "تخزين وتنظيم": "Storage & Organization",
  "تراث أردني": "Jordanian Heritage",
  "تعليم إلكتروني": "E-Learning",
  "تقنية السيارة": "Car Technology",
  "تلفزيونات وشاشات": "TVs & Displays",
  "تنظيف ومكانس": "Cleaning & Vacuuming",
  "حقائب وشنط": "Bags & Luggage",
  "داخلية السيارة": "Car Interior",
  "دفاتر وملفات": "Notebooks & Folders",
  "دمى وسيارات أطفال": "Dolls & Toy Cars",
  "رياضات محددة": "Specific Sports",
  "زجاجات وتغذية رياضية": "Sport Bottles & Nutrition",
  "زهور وبوكسات": "Flowers & Boxes",
  "ساعات ذكية وأجهزة قابلة للارتداء": "Smart Watches & Wearables",
  "سكوترات ودراجات": "Scooters & Bicycles",
  "سماعات وصوتيات": "Headphones & Audio",
  "شعر": "Hair Care",
  "صيانة وأدوات": "Maintenance & Tools",
  "طباعة": "Printing",
  "عطور": "Perfumes & Fragrances",
  "عناية بالبشرة": "Skincare",
  "عناية رجالية": "Men's Grooming",
  "عناية شخصية": "Personal Care",
  "فنون بصرية": "Visual Arts",
  "قوالب وتصاميم": "Templates & Designs",
  "كاميرات مراقبة واجهزة الانذار": "Security Cameras & Alarms",
  "كاميرات وتصوير": "Cameras & Photography",
  "لابتوبات وحواسيب": "Laptops & Computers",
  "لوازم سيارات": "Car Supplies",
  "لوازم مكتب": "Office Supplies",
  "لوازم وإكسسوارات": "Supplies & Accessories",
  "مستلزمات حفلات": "Party Supplies",
  "مستلزمات رضع": "Baby Essentials",
  "مستلزمات زراعية": "Agricultural Supplies",
  "مصنوعات خشبية": "Wooden Crafts",
  "معدات لياقة": "Fitness Equipment",
  "مفروشات ونسيج": "Furniture & Textiles",
  "مكياج": "Makeup",
  "ملابس رياضية": "Sportswear",
  "ملابس وأحذية أطفال": "Kids Clothes & Shoes",
  "ملفات جاهزة": "Ready Files",
  "مواد التغليف": "Packaging Materials",
  "موبايلات وإكسسوارات": "Mobiles & Accessories",
  "نظافة ورعاية": "Cleaning & Care",
  "هاند ميد": "Handmade",
  "هدايا رومانسية": "Romantic Gifts",
  "هدايا مؤسسية": "Corporate Gifts",
  "هدايا مخصصة (customized)": "Customized Gifts",
  "هدايا مخصصة (Customized)": "Customized Gifts",
  "هدايا مناسبات شخصية": "Personal Event Gifts",
  "وجهات محلية": "Local Destinations"
};

/**
 * Returns localized category name based on active locale ('ar' or 'en').
 * Respects WP ACF / Custom Meta keys: name_en, en_name, name_english.
 * Uses comprehensive dictionary fallback for all store categories in EN mode.
 */
export function getCategoryName(category, locale = "ar") {
  if (!category) return "";
  const rawName = typeof category === "string" ? category : (category.name || "");

  if (locale === "en") {
    // 1. Direct property if mapped
    if (typeof category === "object") {
      if (category.name_en) return category.name_en;
      if (category.en_name) return category.en_name;

      // 2. Check meta_data array from WooCommerce REST API or GraphQL
      if (Array.isArray(category.meta_data)) {
        const metaEn = category.meta_data.find(
          m => m.key === "name_en" || m.key === "en_name" || m.key === "name_english" || m.key === "english_name"
        );
        if (metaEn?.value) return metaEn.value;
      }

      // 3. Check ACF object if attached
      if (category.acf?.name_en) return category.acf.name_en;
      if (category.acf?.en_name) return category.acf.en_name;
    }

    // 4. Exhaustive Dictionary fallback for Arabic category name
    const trimmedName = rawName.trim();
    if (CATEGORY_TRANSLATIONS_EN[trimmedName]) {
      return CATEGORY_TRANSLATIONS_EN[trimmedName];
    }

    // Case insensitive match fallback
    const matchedKey = Object.keys(CATEGORY_TRANSLATIONS_EN).find(
      k => k.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (matchedKey) {
      return CATEGORY_TRANSLATIONS_EN[matchedKey];
    }
  }

  return rawName;
}

/**
 * Returns localized category slug based on active locale ('ar' or 'en').
 */
export function getCategorySlug(category, locale = "ar") {
  if (!category) return "";
  const rawSlug = category.slug || "";
  
  if (locale === "en") {
    // 1. Direct property if set
    if (category.slug_en) return category.slug_en;
    if (category.en_slug) return category.en_slug;

    // 2. Check meta_data array
    if (Array.isArray(category.meta_data)) {
      const metaSlugEn = category.meta_data.find(
        m => m.key === "slug_en" || m.key === "en_slug" || m.key === "slug_english"
      );
      if (metaSlugEn?.value) return metaSlugEn.value;
    }

    // 3. Fallback: generate English slug from getCategoryName
    const englishName = getCategoryName(category, "en");
    if (englishName && englishName !== category.name) {
      return englishName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  }

  return rawSlug;
}
