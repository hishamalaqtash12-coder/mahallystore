const WP_URL = "http://mahally-test.local/graphql";

async function main() {
  const query = `
    {
      p1: products(first: 5, where: { category: "flowers-gifts" }) { nodes { name } }
      p2: products(first: 5, where: { category: "131" }) { nodes { name } }
      p3: products(first: 5, where: { categoryIn: ["flowers-gifts"] }) { nodes { name } }
      p4: products(first: 5, where: { categoryId: 131 }) { nodes { name } }
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
