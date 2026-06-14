# Mahally Platform API Reference

This document covers the exact backend structures, API endpoints, and JSON payloads used to manipulate data in the Mahally headless architecture.

## 1. Database & Table Structure Overview

WordPress utilizes an Entity-Attribute-Value (EAV) structure. Understanding this is critical for headless development.

### WooCommerce Core Tables
- **Products**: Stored in `wp_posts` (`post_type = 'product'`).
- **Product Metadata**: Prices, stock levels, `mahally_id`, and `_vendor_id` are stored in `wp_postmeta`.
- **Users / Vendors**: Stored in `wp_users`.
- **User Metadata**: Roles (`seller`), `mahally_vendor_status`, and `dokan_enable_selling` are stored in `wp_usermeta`.

### Dokan Custom Tables
While Dokan leverages core WP tables for products and users, it creates custom tables for performance and accounting:
- `wp_dokan_orders`: Tracks sub-orders for vendors.
- `wp_dokan_vendor_balance`: Tracks vendor earnings and ledger.
- `wp_dokan_withdraw`: Tracks payout requests.

---

## 2. API Endpoints & Request Bodies

### 2.1 Products API

#### GET: Fetch Products
- **Endpoint**: `GET /wp-json/wc/v3/products`
- **Query Params**: `?per_page=10&status=publish&author=[vendor_id]`
- **Response**: Array of Product Objects.

#### POST: Create Product
- **Endpoint**: `POST /wp-json/dokan/v1/products` (Preferred for vendor assignment) or `/wp-json/wc/v3/products`
- **Exact Body Payload**:
```json
{
  "name": "Mahally Premium Coffee",
  "type": "simple",
  "regular_price": "24.99",
  "description": "Premium roasted coffee beans.",
  "short_description": "250g bag of coffee.",
  "status": "publish",
  "manage_stock": true,
  "stock_quantity": 50,
  "categories": [
    { "id": 9 }
  ],
  "meta_data": [
    {
      "key": "mahally_id",
      "value": "prd_123456789" 
    },
    {
      "key": "_vendor_id",
      "value": "15" 
    }
  ]
}
```

#### PUT: Update Product
- **Endpoint**: `PUT /wp-json/dokan/v1/products/{id}`
- **Exact Body Payload**:
```json
{
  "regular_price": "19.99",
  "stock_quantity": 40
}
```
*(Only include the fields you wish to update. Unmentioned fields remain unchanged).*

#### DELETE: Delete Product
- **Endpoint**: `DELETE /wp-json/wc/v3/products/{id}?force=true`
- **Exact Body Payload**: None required. `force=true` bypasses the trash bin, permanently deleting the row from `wp_posts`.

---

### 2.2 Users & Vendors API

#### GET: Fetch Vendors
- **Endpoint**: `GET /wp-json/wc/v3/customers?role=seller`
- **Note**: Ensure you filter responses on the client where `meta_data[].key === "dokan_enable_selling"` equals `"yes"`.

#### POST: Create User/Vendor
- **Endpoint**: `POST /wp-json/wc/v3/customers`
- **Exact Body Payload**:
```json
{
  "email": "vendor@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe_store",
  "password": "SecurePassword123!",
  "billing": {
    "phone": "+1234567890"
  },
  "meta_data": [
    {
      "key": "mahally_role",
      "value": "vendor"
    },
    {
      "key": "mahally_store_name",
      "value": "John's Premium Goods"
    },
    {
      "key": "dokan_enable_selling",
      "value": "no" 
    }
  ]
}
```

#### PUT: Update User (Approve Vendor)
- **Endpoint**: `PUT /wp-json/wc/v3/customers/{id}`
- **Exact Body Payload**:
```json
{
  "meta_data": [
    {
      "key": "dokan_enable_selling",
      "value": "yes"
    },
    {
      "key": "mahally_vendor_status",
      "value": "approved"
    }
  ]
}
```

#### DELETE: Delete User
- **Endpoint**: `DELETE /wp-json/wc/v3/customers/{id}?reassign={admin_id}`
- **Exact Body Payload**: None. `reassign` transfers their products to an admin so products aren't orphaned in the database.
