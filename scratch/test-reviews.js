const WP_URL = "http://mahally-test.local/graphql";

async function main() {
  const query = `
  query GetProductReviews($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      ... on SimpleProduct {
        reviews {
          nodes {
            content
            author {
              node {
                name
              }
            }
          }
        }
        averageRating
        reviewCount
      }
      ... on VariableProduct {
        reviews {
          nodes {
            content
            author {
              node {
                name
              }
            }
          }
        }
        averageRating
        reviewCount
      }
    }
  }
  `;
  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { id: "883" } }),
    });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch(e) { console.error(e) }
}
main();
