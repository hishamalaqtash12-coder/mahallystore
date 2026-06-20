import { getProducts } from "@/lib/woocommerce";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Products | Mahally Store",
  description: "Browse our premium collection of products.",
};

export default async function ProductsPage() {
  let products = [];
  try {
    products = await getProducts({ per_page: 20 });
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white mb-4">All Products</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Discover our full range of premium items.
        </p>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-xl text-zinc-500">No products found.</p>
        </div>
      )}
    </div>
  );
}
