# Authentication & Transaction Flow

This document details the exact step-by-step logic of how a user (vendor) authenticates and retrieves protected data (like their products) in the Mahally application.

The Mahally Platform uses a hybrid authentication architecture: **JWT for Client Sessions**, and **Admin Basic Auth / Consumer Keys for Server Data Fetching**.

---

## The Transaction Lifecycle: From Login to Data Retrieval

### Phase 1: User Login (Client-Side)
1. **User Input**: The vendor enters their email and password on the Next.js frontend login page.
2. **API Request**: The Next.js client calls `loginMerchant()` (from `src/lib/auth.js`). This triggers a `POST` request directly to the WordPress JWT Authentication endpoint: `/wp-json/jwt-auth/v1/token`.
3. **Validation**: WordPress validates the credentials against the `wp_users` database table.
4. **Token Generation**: If valid, WordPress returns a JSON Web Token (JWT) along with basic user info (email, display name).
5. **Session Storage**: The Next.js client stores this token and user data in the browser's `localStorage` (as `mahally_merchant_token` and `mahally_merchant_user`).

### Phase 2: Route Protection & Authorization
6. **Navigation**: The vendor navigates to a protected route, such as `/dashboard/products`.
7. **Client Verification**: Next.js (either via a Higher Order Component, Context API, or Middleware) checks `localStorage` for the `mahally_merchant_token`. If missing, the user is redirected back to `/login`.

### Phase 3: Data Fetching (Server-Side)
*Because Next.js hides sensitive API keys, actual data fetching happens on the Node.js server (via Server Components, `getServerSideProps`, or Next.js API Routes).*

8. **Client Requests Data**: The Next.js frontend component requests data, passing the vendor's identifier (retrieved from the stored session) to a server-side function.
9. **Server Authentication Construction**: 
   - Instead of passing the user's JWT to WordPress, the Next.js server utilizes its elevated privileges. 
   - It reads `process.env.WP_ADMIN_USER` and `process.env.WP_ADMIN_APP_PASS` and encodes them into a Base64 string for Basic Authentication.
   - *Alternatively, for WooCommerce REST API calls, it uses the `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET`.*
10. **The Server-to-Server Request**: The Next.js server calls the WordPress backend (e.g., `GET /wp-json/dokan/v1/products?vendor_id=15`) and attaches the `Authorization: Basic <base64_admin_credentials>` header.

### Phase 4: Data Processing & Response
11. **WordPress Processing**: WordPress receives the request. Because the request uses the Admin's Application Password, WordPress grants the request full administrative capabilities.
12. **Database Query**: The Dokan/WooCommerce API queries the MySQL database (e.g., querying `wp_posts` where `post_type = 'product'` and `post_author = 15`).
13. **Data Return**: WordPress returns the JSON array of products to the Next.js server.
14. **Client Render**: The Next.js server passes the product data down to the React Client Component, which renders the products on the vendor's screen.

---

## Why this Architecture?

You might wonder why the app uses Admin credentials to fetch data instead of the vendor's JWT.

1. **Security**: Storing Consumer Keys or App Passwords in the browser is a massive security risk. They must be kept on the Next.js server.
2. **Performance**: Server-to-server requests are generally faster and don't suffer from CORS preflight delays.
3. **Flexibility**: By using elevated server credentials, Next.js can perform administrative tasks (like approving a vendor or standardizing `mahally_id`s) that a standard vendor token would be denied permission to do.
