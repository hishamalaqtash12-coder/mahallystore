const { fetchGraphQL } = require('./src/lib/graphql.js');
const { getAuthHeaders } = require('./src/lib/woocommerce.js');

async function test() {
  const query = `
    query {
      users(first: 5, where: { roleIn: [SELLER, ADMINISTRATOR] }) {
        nodes {
          databaseId
          name
          roles {
            nodes {
              name
            }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchGraphQL(query, {}, {});
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
