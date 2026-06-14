const WP_URL = "http://mahally-test.local/graphql";

async function main() {
  const query = `
    {
      products(first: 1) {
        nodes {
          ... on SimpleProduct {
            sku
            link
            featured
            attributes {
              nodes {
                name
                options
              }
            }
            productTags {
              nodes {
                name
                slug
              }
            }
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
    console.log(JSON.stringify(json, null, 2));
  } catch(e) { console.error(e) }
}
main();
