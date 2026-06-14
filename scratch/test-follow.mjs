import { updateCustomerMeta, getCustomerById } from "file:///c:/Users/LENOVO/Desktop/nextjs-woocommerce-graphqlapi/src/lib/woocommerce.js";

async function run() {
  try {
    const vendorId = 35;
    const userId = 36;
    
    console.log("Fetching vendor 35...");
    const vendor = await getCustomerById(vendorId);
    console.log("Vendor meta keys:", vendor.meta_data.map(m => m.key));
    
    console.log("Fetching user 36...");
    const user = await getCustomerById(userId);
    console.log("User meta keys:", user.meta_data.map(m => m.key));
    
    // Test follow
    console.log("Updating metadata: adding user 36 to vendor 35 followers...");
    const vendorMeta = Object.fromEntries((vendor.meta_data || []).map(m => [m.key, m.value]));
    let followerIds = vendorMeta.mahally_follower_ids ? JSON.parse(vendorMeta.mahally_follower_ids) : [];
    followerIds = followerIds.map(id => parseInt(id)).filter(Boolean);
    if (!followerIds.includes(userId)) followerIds.push(userId);
    
    await updateCustomerMeta(vendorId, {
      mahally_follower_count: String(followerIds.length),
      mahally_follower_ids: JSON.stringify(followerIds)
    });
    
    console.log("Updating metadata: adding vendor 35 to user 36 followed list...");
    const userMeta = Object.fromEntries((user.meta_data || []).map(m => [m.key, m.value]));
    let followed = userMeta.mahally_followed_stores ? JSON.parse(userMeta.mahally_followed_stores) : [];
    followed = followed.map(id => parseInt(id)).filter(Boolean);
    if (!followed.includes(vendorId)) followed.push(vendorId);
    
    await updateCustomerMeta(userId, {
      mahally_followed_stores: JSON.stringify(followed)
    });
    
    console.log("Verification - Fetching user 36 again...");
    const verifiedUser = await getCustomerById(userId);
    const updatedUserMeta = Object.fromEntries((verifiedUser.meta_data || []).map(m => [m.key, m.value]));
    console.log("Updated mahally_followed_stores value:", updatedUserMeta.mahally_followed_stores);
    
    console.log("Verification - Fetching vendor 35 again...");
    const verifiedVendor = await getCustomerById(vendorId);
    const updatedVendorMeta = Object.fromEntries((verifiedVendor.meta_data || []).map(m => [m.key, m.value]));
    console.log("Updated mahally_follower_ids value:", updatedVendorMeta.mahally_follower_ids);
    console.log("Updated mahally_follower_count value:", updatedVendorMeta.mahally_follower_count);
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

run();
