export async function fetchGraphQL(query, variables = {}, customHeaders = {}) {
  const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL;

  if (!WP_URL) {
    throw new Error("NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL is not defined");
  }

  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...customHeaders,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // Using Next.js caching behaviour
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    const json = await res.json();
    
    if (json.errors) {
      console.error("GraphQL Errors:", json.errors);
      throw new Error("Failed to fetch GraphQL API");
    }

    return json.data;
  } catch (error) {
    console.error(error);
    throw new Error("Network error fetching GraphQL API");
  }
}
