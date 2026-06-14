const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

/**
 * Log in a merchant and store the JWT token
 */
export async function loginMerchant(username, password) {
  try {
    const response = await fetch(`${WP_URL}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle cases where the server returns an error but in JSON format
      throw new Error(data.message || 'Unauthorized: Please check your credentials.');
    }

    // Store token and user info
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahally_merchant_token', data.token);
      localStorage.setItem('mahally_merchant_user', JSON.stringify({
        displayName: data.user_display_name,
        email: data.user_email,
        nicename: data.user_nicename
      }));
    }

    return data;
  } catch (error) {
    console.error('Merchant Login Error:', error.message);
    throw error;
  }
}

/**
 * Get the current merchant session
 */
export function getMerchantSession() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mahally_merchant_token');
    const user = localStorage.getItem('mahally_merchant_user');
    return token ? { token, user: JSON.parse(user) } : null;
  }
  return null;
}

/**
 * Log out the merchant
 */
export function logoutMerchant() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mahally_merchant_token');
    localStorage.removeItem('mahally_merchant_user');
    window.location.href = '/login';
  }
}

/**
 * Create a new vendor (Merchant) registration
 */
export async function registerMerchant(vendorData) {
  try {
    // Note: This requires a custom endpoint in our WordPress plugin
    const response = await fetch(`${WP_URL}/wp-json/mahally/v1/vendor-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vendorData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Merchant Registration Error:', error.message);
    throw error;
  }
}
