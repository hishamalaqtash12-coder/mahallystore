const { getProducts } = require('./src/lib/woocommerce.js');

async function test() {
  try {
    const products = await getProducts({ per_page: 2 });
    console.log('SUCCESS! Found', products.data.length, 'products');
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
