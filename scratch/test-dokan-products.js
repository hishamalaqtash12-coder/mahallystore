const { dokanApi } = require('./src/lib/dokan.js');

async function check() {
  try {
    const products = await dokanApi.getProducts(35); // Ammar's vendor id is 35 from previous logs
    console.log("Length:", products?.length);
    if (products?.length > 0) {
      console.log("First product store:", products[0].store);
    }
  } catch (e) { console.error(e) }
}
check();
