// test-full-queries.js — Tests the exact queries used by the website
// Run: node scratch/test-full-queries.js

const WP_URL = "http://mahally-test.local/graphql";

async function testQuery(label, query, variables = {}) {
  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) {
      console.log(`\n❌ ${label}:`);
      json.errors.forEach(e => console.log(`   → ${e.message}`));
      return false;
    }
    const count = Object.values(json.data)[0]?.nodes?.length ?? '(single)';
    console.log(`✅ ${label} — ${count} results`);
    return true;
  } catch (e) {
    console.log(`❌ ${label}: Network error — ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("=== Testing Actual Website Queries ===\n");

  // GET_PRODUCTS (as used by getProducts in woocommerce.js)
  await testQuery("GET_PRODUCTS", `
    query GetProducts($first: Int, $after: String, $category: String, $search: String) {
      products(first: $first, after: $after, where: { category: $category, search: $search }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId name slug status
          image { sourceUrl altText }
          galleryImages { nodes { sourceUrl altText } }
          productCategories { nodes { databaseId name slug } }
          averageRating reviewCount
          metaData { key value }
          ... on SimpleProduct { price regularPrice salePrice stockStatus stockQuantity }
          ... on VariableProduct { price regularPrice salePrice stockStatus stockQuantity }
        }
      }
    }
  `, { first: 10 });

  // GET_CATEGORIES (as used by getCategories)
  await testQuery("GET_CATEGORIES", `
    query GetCategories($first: Int, $after: String) {
      productCategories(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { databaseId name slug description count image { sourceUrl altText } parent { node { databaseId name } } }
      }
    }
  `, { first: 100 });

  // GET_VENDORS (as used by getVendors — no role filter)
  await testQuery("GET_VENDORS", `
    query GetVendors($first: Int, $after: String) {
      users(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { databaseId name firstName lastName email registeredDate avatar { url } }
      }
    }
  `, { first: 40 });

  // GET_ORDERS
  await testQuery("GET_ORDERS", `
    query GetOrders($first: Int, $after: String) {
      orders(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId orderKey status total currency date
          billing { firstName lastName email phone address1 city }
          shipping { firstName lastName address1 city }
          lineItems { nodes { product { node { databaseId name } } quantity total } }
        }
      }
    }
  `, { first: 10 });

  console.log("\n=== All Website Queries Tested ===");
}

main();
