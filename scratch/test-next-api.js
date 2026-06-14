async function test() {
  const res = await fetch("http://localhost:3000/api/merchant/products?wooId=35");
  const json = await res.json();
  console.log(json.slice(0,2).map(p => ({
      id: p.id,
      name: p.name,
      stock_status: p.stock_status,
      stock_quantity: p.stock_quantity,
      manage_stock: p.manage_stock
    })));
}
test();
