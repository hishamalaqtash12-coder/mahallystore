export async function fetchGraphQL(query, variables = {}, customHeaders = {}, nextOptions = {}) {
  let WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || process.env.WORDPRESS_GRAPHQL_URL;

  if (!WP_URL && process.env.NEXT_PUBLIC_WORDPRESS_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL.replace(/\/$/, "");
    WP_URL = `${baseUrl}/graphql`;
  }

  if (!WP_URL && process.env.WORDPRESS_URL) {
    const baseUrl = process.env.WORDPRESS_URL.replace(/\/$/, "");
    WP_URL = `${baseUrl}/graphql`;
  }

  if (!WP_URL) {
    console.warn("GraphQL URL is not configured in environment variables.");
    return null;
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
      next: { revalidate: 60, ...nextOptions }
    });

    if (!res.ok) {
      console.warn(`GraphQL fetch failed with HTTP status ${res.status}`);
      return null;
    }

    const json = await res.json();
    
    if (json.errors) {
      console.error("GraphQL Errors:", json.errors);
      return json.data || null;
    }

    return json.data;
  } catch (error) {
    console.error("GraphQL API error:", error.message);
    return null;
  }
}
