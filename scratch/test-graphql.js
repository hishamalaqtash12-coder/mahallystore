// test-graphql.js
// Run this file using: node scratch/test-graphql.js

// Using native fetch, which is available in Node.js 18+
async function testGraphQL() {
  const WP_URL = "http://mahally-test.local/graphql"; // Update this if your URL is different
  
  const query = `
    query TestProducts {
      products(first: 3) {
        nodes {
          databaseId
          name
          slug
        }
      }
    }
  `;

  console.log(`Connecting to: ${WP_URL}`);
  console.log("Running Test Query...\n");

  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();
    
    if (json.errors) {
      console.error("❌ GraphQL Errors encountered:");
      console.error(JSON.stringify(json.errors, null, 2));
      console.log("\nMake sure WPGraphQL and WPGraphQL WooCommerce are active!");
    } else {
      console.log("✅ Success! Received Data:");
      console.log(JSON.stringify(json.data, null, 2));
    }
  } catch (error) {
    console.error("❌ Network or Fetch Error:");
    console.error(error.message);
  }
}

testGraphQL();
