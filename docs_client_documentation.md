# Mahally Next.js Client Documentation

This document covers the frontend (Next.js) libraries, server-side infrastructure, and backend integrations required to maintain the headless Mahally application.

## 1. Client Library Utilities

The Next.js application abstracts API communication into reusable library files located in `src/lib/`.

### `src/lib/woocommerce.js`
- **Purpose**: Handles general store data, public products, categories, and customer management.
- **Under the hood**: Uses the `@woocommerce/woocommerce-rest-api` NPM package.
- **Authentication**: Connects using `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET`.

### `src/lib/dokan.js`
- **Purpose**: Handles vendor-specific tasks (vendor dashboards, store settings, vendor order lists).
- **Under the hood**: Uses native browser `fetch()`.
- **Authentication**: Connects using HTTP Basic Auth combining `WP_ADMIN_USER` and `WP_ADMIN_APP_PASS`.

---

## 2. Infrastructure: The PHP Snippet (`mahally-vendor-admin.php`)

Located in `wp-headless-cms/app/public/wp-content/mu-plugins/`, this script bridges the gap between WordPress Core, Dokan, and our Headless API.

### Key Functions of the Snippet
1. **REST API Exposure**: Exposes critical custom fields (like `mahally_store_name`, `mahally_vendor_status`) to the REST API. Without this, Next.js `PUT` requests to update vendor statuses would be ignored by WordPress.
2. **Dokan Initialization Trigger**: When Next.js creates a user via API, it bypasses standard WordPress UI hooks. The snippet explicitly forces Dokan's `dokan_new_vendor` action to fire during REST API registrations, preventing broken vendor profiles.
3. **WP-Admin UI Enhancements**: It modifies the `wp-admin > Users` table, adding custom columns to render the vendor's Store Logo (Photo) and their approval status visually.
4. **Data Safety**: Removes confusing native "Approve/Reject" links from the WP-Admin screen to force administrators to manage vendors exclusively through the Dokan interface, preventing database corruption.

---

## 3. Dealing with CORS Origins

**Cross-Origin Resource Sharing (CORS)** blocks browsers from requesting data from a different domain than the one they are currently on.

### How CORS affects this project
- **Client-Side Requests**: When the browser hits `/wp-json/jwt-auth/v1/token` directly from `localhost:3000`, the WordPress server (running on `mahally-test.local`) must send back an `Access-Control-Allow-Origin: *` header, otherwise the browser kills the request. This is currently managed by the JWT authentication plugin.
- **Server-Side Requests**: Requests made from Next.js Server Components, API Routes, or `getServerSideProps` to WordPress **do not trigger CORS**. Browsers enforce CORS; Node.js servers do not. Therefore, functions inside `woocommerce.js` and `dokan.js` do not need special CORS handling.

---

## 4. Production Deployment Guide

When migrating the project from your local machine to a live environment, follow these rules.

### Removing the `wp-headless-cms` Folder
Removing the local `wp-headless-cms` folder **will not break the logic of the Next.js application**, assuming you have migrated the database and plugins to a live cloud host. The Next.js frontend is entirely decoupled from the folder structure.

### Steps for Going Live
1. **Host WordPress**: Upload the contents of `wp-headless-cms` to a standard hosting provider (Kinsta, WP Engine, DigitalOcean). Ensure HTTPS is enabled.
2. **Host Next.js**: Deploy your Next.js application to Vercel or AWS Amplify.
3. **Update API Keys**: Update the Environment Variables in your Vercel Dashboard:
   ```env
   NEXT_PUBLIC_WORDPRESS_URL=https://api.yourlivedomain.com
   WC_CONSUMER_KEY=ck_live_xxxxxxxxxxxxxxxxxxxxxxxxxxx
   WC_CONSUMER_SECRET=cs_live_xxxxxxxxxxxxxxxxxxxxxxxxxxx
   WP_ADMIN_USER=your_live_admin_username
   WP_ADMIN_APP_PASS=xxxx xxxx xxxx xxxx
   ```
4. **Image Optimization Setup**: Update `next.config.mjs` to allow the new live domain to serve images. Add your production domain to the `remotePatterns` array.
