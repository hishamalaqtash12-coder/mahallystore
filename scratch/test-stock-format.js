async function test() {
  // Test 1: Merchant products API (used by Product Inventory page)
  const res1 = await fetch("http://localhost:3000/api/merchant/products?wooId=35");
  const products = await res1.json();
  console.log("=== /api/merchant/products ===");
  products.slice(0,3).forEach(p => {
    console.log(`  ${p.name}: stock_status="${p.stock_status}", stock_quantity=${p.stock_quantity}, manage_stock=${p.manage_stock}`);
  });

  // Test 2: Inventory stats API (used by Inventory & Sales Analytics page)
  const res2 = await fetch("http://localhost:3000/api/merchant/inventory-stats?vendorId=35");
  const data2 = await res2.json();
  console.log("\n=== /api/merchant/inventory-stats ===");
  (data2.stats || []).slice(0,3).forEach(s => {
    console.log(`  ${s.name}: stockStatus="${s.stockStatus}", currentStock=${s.currentStock}`);
  });
}
test();
