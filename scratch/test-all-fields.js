const WP_URL = "http://mahally-test.local/graphql";

async function main() {
  const query = `
    {
      products(first: 1) {
        nodes {
          ... on SimpleProduct {
            databaseId
            name
            slug
            type
            status
            description
            shortDescription
            sku
            link
            featured
            date
            modified
            onSale
            salePrice
            regularPrice
            price
            dateOnSaleTo
            dateOnSaleFrom
            stockStatus
            stockQuantity
            manageStock
            totalSales
            reviewsAllowed
            averageRating
            reviewCount
            weight
            purchasable
            virtual
            downloadable
            menuOrder
            image { sourceUrl altText }
            galleryImages { nodes { sourceUrl altText } }
            productCategories { nodes { databaseId name slug } }
            productTags { nodes { databaseId name slug } }
            attributes { nodes { name options } }
            metaData { key value }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    if (json.errors) {
      console.log("ERRORS:", JSON.stringify(json.errors, null, 2));
    } else {
      console.log("SUCCESS - All fields:");
      const product = json.data.products.nodes[0];
      for (const [key, val] of Object.entries(product)) {
        console.log(`  ${key}: ${JSON.stringify(val)?.substring(0, 120)}`);
      }
    }
  } catch(e) { console.error(e) }
}
main();
