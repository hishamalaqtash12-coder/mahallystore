/**
 * Generates a branded Mahally ID with a specific prefix and a unique suffix.
 * @param {string} type - The entity type (cus, ven, prod, ord)
 * @param {string} vendorPrefix - Optional vendor slug to include in the ID
 * @returns {string} - The formatted Mahally ID
 */
export function generateMahallyId(type, vendorPrefix = "") {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) { // Slightly shorter suffix since we have vendor name
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const v = vendorPrefix ? `${vendorPrefix}-` : "";
  
  const prefixes = {
    customer: 'mah-cus',
    vendor: 'mah-ven',
    product: `mah-${v}prod`,
    order: `mah-${v}ord`
  };

  const prefix = prefixes[type] || `mah-${v}${type}`;
  return `${prefix}${suffix}`;
}
