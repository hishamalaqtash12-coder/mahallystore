// test-schema.js — Discovers what your WPGraphQL + WooGraphQL schema actually supports
// Run: node scratch/test-schema.js

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
      console.log(`❌ ${label}:`);
      json.errors.forEach(e => console.log(`   → ${e.message}`));
      return null;
    }
    console.log(`✅ ${label}: OK`);
    return json.data;
  } catch (e) {
    console.log(`❌ ${label}: Network error — ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("=== Testing WPGraphQL Schema ===\n");

  // Test 1: Basic products (minimal)
  const p1 = await testQuery("1. Basic products query", `{
    products(first: 2) {
      nodes { databaseId name slug }
    }
  }`);

  // Test 2: Products with inline fragment on SimpleProduct
  await testQuery("2. SimpleProduct inline fragment", `{
    products(first: 2) {
      nodes {
        ... on SimpleProduct {
          databaseId
          name
          price
          regularPrice
        }
        ... on VariableProduct {
          databaseId
          name
          price
          regularPrice
        }
      }
    }
  }`);

  // Test 3: Products with ... on Product
  await testQuery("3. ... on Product fragment", `{
    products(first: 2) {
      nodes {
        ... on Product {
          databaseId
          name
          slug
          status
        }
      }
    }
  }`);

  // Test 4: Products WITHOUT inline fragment (direct fields)
  await testQuery("4. Direct fields (no fragment)", `{
    products(first: 2) {
      nodes {
        databaseId
        name
        slug
      }
    }
  }`);

  // Test 5: image field
  await testQuery("5. Product image field", `{
    products(first: 1) {
      nodes {
        ... on SimpleProduct { databaseId image { sourceUrl } }
        ... on VariableProduct { databaseId image { sourceUrl } }
      }
    }
  }`);

  // Test 6: galleryImages
  await testQuery("6. Product galleryImages", `{
    products(first: 1) {
      nodes {
        ... on SimpleProduct { databaseId galleryImages { nodes { sourceUrl } } }
      }
    }
  }`);

  // Test 7: productCategories
  await testQuery("7. productCategories on product", `{
    products(first: 1) {
      nodes {
        ... on SimpleProduct { productCategories { nodes { databaseId name slug } } }
      }
    }
  }`);

  // Test 8: Top-level productCategories
  await testQuery("8. Top-level productCategories", `{
    productCategories(first: 5) {
      nodes { databaseId name slug count }
    }
  }`);

  // Test 9: Users query
  await testQuery("9. Users query (no role filter)", `{
    users(first: 3) {
      nodes { databaseId name email }
    }
  }`);

  // Test 10: Users with role filter
  await testQuery("10. Users with role SELLER", `{
    users(first: 3, where: { role: SELLER }) {
      nodes { databaseId name email }
    }
  }`);

  // Test 11: Orders query
  await testQuery("11. Orders query", `{
    orders(first: 2) {
      nodes { databaseId status total }
    }
  }`);

  // Test 12: Product with category and search where clause
  await testQuery("12. Products where clause (search)", `{
    products(first: 2, where: { search: "test" }) {
      nodes { databaseId name }
    }
  }`);

  // Test 13: Product with category where clause
  await testQuery("13. Products where clause (category)", `{
    products(first: 2, where: { category: "uncategorized" }) {
      nodes { databaseId name }
    }
  }`);

  // Test 14: Single product by DATABASE_ID
  if (p1?.products?.nodes?.[0]?.databaseId) {
    const pid = String(p1.products.nodes[0].databaseId);
    await testQuery("14. Single product by DATABASE_ID", `
      query($id: ID!) {
        product(id: $id, idType: DATABASE_ID) {
          ... on SimpleProduct { databaseId name price }
          ... on VariableProduct { databaseId name price }
        }
      }
    `, { id: pid });
  }

  // Test 15: metaData field on product
  await testQuery("15. Product metaData field", `{
    products(first: 1) {
      nodes {
        ... on SimpleProduct {
          databaseId
          metaData { key value }
        }
      }
    }
  }`);

  // Test 16: reviews on product
  await testQuery("16. Product reviews", `{
    products(first: 1) {
      nodes {
        ... on SimpleProduct {
          databaseId
          reviews { nodes { content } }
        }
      }
    }
  }`);

  // Test 17: averageRating / reviewCount
  await testQuery("17. Product averageRating", `{
    products(first: 1) {
      nodes {
        ... on SimpleProduct {
          databaseId
          averageRating
          reviewCount
        }
      }
    }
  }`);

  console.log("\n=== Schema Discovery Complete ===");
}

main();
