const EXPLICIT_MADE_IN_JORDAN_KEYS = [
  "made_in_jordan",
  "made-in-jordan",
  "made_in_jordan_flag",
  "mahally_made_in_jordan",
  "_made_in_jordan"
];

const EXPLICIT_MADE_IN_JORDAN_VALUES = [
  "yes",
  "true",
  "1",
  "active",
  "enabled",
  "on"
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsExplicitSignal(value) {
  const normalized = normalizeText(value);
  if (!normalized) return false;

  const hasExplicitMarker = EXPLICIT_MADE_IN_JORDAN_KEYS.some((key) => normalized.includes(key));
  const hasExplicitValue = EXPLICIT_MADE_IN_JORDAN_VALUES.some((val) => normalized.includes(val));

  return hasExplicitMarker || normalized.includes("made in jordan") || normalized.includes("made-in-jordan") || normalized.includes("صنع في الأردن") || normalized.includes("صنع في الاردن");
}

export function isMadeInJordanProduct(product) {
  if (!product) return false;

  // 1. Explicit override from Merchant Dashboard
  if (Array.isArray(product.meta_data)) {
    const explicitMeta = product.meta_data.find(m => m.key === "mahally_made_in_jordan");
    if (explicitMeta) {
      return explicitMeta.value === "yes";
    }
  }

  const haystack = [
    product.name,
    product.description,
    product.short_description,
    product.slug,
    Array.isArray(product.categories) ? product.categories.map(c => `${c.name || ""} ${c.slug || ""}`).join(" ") : "",
    Array.isArray(product.tags) ? product.tags.map(t => `${t.name || ""} ${t.slug || ""}`).join(" ") : "",
    Array.isArray(product.meta_data) ? product.meta_data.map(m => `${m.key || ""} ${m.value || ""}`).join(" ") : ""
  ].join(" ");

  const normalized = normalizeText(haystack);
  if (!normalized) return false;

  if (containsExplicitSignal(haystack)) return true;

  const strongSignals = [
    "made in jordan",
    "made-in-jordan",
    "made_in_jordan",
    "صنع في الأردن",
    "صنع في الاردن",
    "jordania",
    "jordanian",
    "أردني",
    "أردنية",
    "تراث أردني",
    "حرف أردنية"
  ];

  return strongSignals.some((signal) => normalized.includes(signal));
}

export function getMadeInJordanProducts(products = []) {
  return (products || []).filter((product) => isMadeInJordanProduct(product));
}
