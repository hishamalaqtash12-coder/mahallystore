const WP_URL = "http://mahally-test.local/graphql";

async function main() {
  const query = `
    query Test($categoryId: Int, $category: String) {
      products(first: 5, where: { categoryId: $categoryId, category: $category }) {
        nodes { name }
      }
    }
  `;
  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query,
        variables: { categoryId: 131, category: null }
      }),
    });
    const json = await res.json();
    console.log("With ID:", JSON.stringify(json, null, 2));

    const res2 = await fetch(WP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query,
        variables: { categoryId: null, category: "flowers-gifts" }
      }),
    });
    const json2 = await res2.json();
    console.log("With Slug:", JSON.stringify(json2, null, 2));
  } catch(e) { console.error(e) }
}
main();
