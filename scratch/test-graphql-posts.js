// test-graphql-posts.js
// Run this file using: node scratch/test-graphql-posts.js

async function testGraphQLPosts() {
  const WP_URL = "http://mahally-test.local/graphql"; 
  
  const query = `
    query TestPosts {
      posts(first: 3) {
        nodes {
          databaseId
          title
          slug
        }
      }
    }
  `;

  console.log(`Connecting to: ${WP_URL}`);
  console.log("Running Test Query for POSTS...\n");

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
    } else {
      console.log("✅ Success! Received Posts Data:");
      console.log(JSON.stringify(json.data, null, 2));
    }
  } catch (error) {
    console.error("❌ Network or Fetch Error:");
    console.error(error.message);
  }
}

testGraphQLPosts();
