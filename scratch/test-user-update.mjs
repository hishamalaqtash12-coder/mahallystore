import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const user = process.env.WP_ADMIN_USER;
const pass = process.env.WP_ADMIN_APP_PASS;

const credentials = Buffer.from(`${user}:${pass}`).toString("base64");

async function run() {
  try {
    console.log("Fetching users list to find Ammar...");
    const res = await fetch(`${url}/wp-json/wp/v2/users?context=edit`, {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    });

    if (!res.ok) {
      console.error("Fetch users failed:", res.status, await res.text());
      return;
    }

    const users = await res.json();
    console.log("Users in WordPress:");
    users.forEach(u => {
      console.log(`ID: ${u.id} | Username: ${u.username} | Name: ${u.name} | Nickname: ${u.nickname} | Roles: ${JSON.stringify(u.roles)}`);
    });

    // Find a vendor or seller user (like Ammar)
    const ammar = users.find(u => u.username.toLowerCase().includes("ammar") || u.name.toLowerCase().includes("ammar"));
    if (!ammar) {
      console.log("Ammar user not found in the first batch of users. Let's try searching...");
      return;
    }

    console.log(`\nFound Ammar: ID=${ammar.id}`);
    console.log("Attempting to update display name and nickname...");

    const updateRes = await fetch(`${url}/wp-json/wp/v2/users/${ammar.id}`, {
      method: "POST", // WordPress REST API accepts POST/PUT for updates
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`
      },
      body: JSON.stringify({
        name: "Ammar One Stop Shop",
        nickname: "Ammar One Stop Shop",
        first_name: "Ammar One Stop Shop",
        last_name: ""
      })
    });

    console.log("Update status:", updateRes.status);
    const updateResult = await updateRes.json();
    console.log("Update response:", JSON.stringify(updateResult, null, 2));

  } catch (err) {
    console.error("Error occurred:", err);
  }
}

run();
