import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;
const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

/**
 * Custom Dokan API wrapper
 */
class DokanApi {
  constructor() {
    this.url = WP_URL;
    this.consumerKey = WC_KEY;
    this.consumerSecret = WC_SECRET;
  }

  async fetch(endpoint, options = {}) {
    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
    const url = `${this.url}/wp-json/dokan/v1/${endpoint}`;
    
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      }
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Dokan API error: ${res.status}`);
    }

    return res.json();
  }

  // Dashboard Stats
  async getStats(vendorId) {
    return this.fetch(`vendor-dashboard?vendor_id=${vendorId}`);
  }

  // Balance & Settings Info
  async getBalance(vendorId) {
    // Note: Dokan REST might require context or specific permissions
    return this.fetch(`withdraw/balance?vendor_id=${vendorId}`);
  }

  async getWithdrawCharges() {
    return this.fetch(`withdraw/charges`);
  }

  // Get Store Settings
  async getSettings(vendorId) {
    return this.fetch(`settings?vendor_id=${vendorId}`);
  }

  // Update Store Settings
  async updateSettings(vendorId, data) {
    return this.fetch(`settings?vendor_id=${vendorId}`, {
      method: 'PUT', // or POST depending on Dokan version, StoreSettingController uses EDITABLE which maps to POST/PUT/PATCH
      body: JSON.stringify(data)
    });
  }

  // Sales Reports
  async getSalesReports(vendorId, from, to) {
    return this.fetch(`vendor-dashboard/sales?vendor_id=${vendorId}&from=${from}&to=${to}`);
  }

  // Withdrawals
  async getWithdrawals(vendorId) {
    return this.fetch(`withdraw?vendor_id=${vendorId}`);
  }

  async requestWithdraw(vendorId, amount, method) {
    return this.fetch(`withdraw`, {
      method: 'POST',
      body: JSON.stringify({
        vendor_id: vendorId,
        amount: amount,
        method: method
      })
    });
  }

  // Products
  async getProducts(vendorId) {
    return this.fetch(`products?vendor_id=${vendorId}&per_page=100&status=any`);
  }

  // Reviews
  async getReviews(vendorId) {
    return this.fetch(`reviews?vendor_id=${vendorId}`);
  }

  // Orders
  async getOrders(vendorId, options = {}) {
    const params = new URLSearchParams({ ...options, vendor_id: vendorId }).toString();
    return this.fetch(`orders?${params}`);
  }

  async updateOrder(orderId, data) {
    return this.fetch(`orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Refunds
  async getRefunds(vendorId) {
    return this.fetch(`refunds?vendor_id=${vendorId}`);
  }

  // Stores (Vendors)
  async createStore(data) {
    return this.fetch(`stores`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // New: Product Creation via Dokan API for better authorship handling
  async createProduct(data, vendorId) {
    const endpoint = vendorId ? `products?vendor_id=${vendorId}` : `products`;
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async updateProduct(id, data, vendorId) {
    const endpoint = vendorId ? `products/${id}?vendor_id=${vendorId}` : `products/${id}`;
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Announcements
  async getAnnouncements(vendorId) {
    // If vendorId is provided, Dokan usually filters by the vendor's visibility
    const endpoint = vendorId ? `announcement?vendor_id=${vendorId}` : `announcement`;
    return this.fetch(endpoint);
  }

  async createAnnouncement(data) {
    return this.fetch(`announcement`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getStores(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.fetch(`stores?${q}`);
  }
}

export const dokanApi = new DokanApi();
