const WP_URL = "http://mahally-test.local/graphql";

async function main() {
  const query = `
    {
      users(first: 1) {
        nodes {
          databaseId
          name
          metaData {
            key
            value
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
