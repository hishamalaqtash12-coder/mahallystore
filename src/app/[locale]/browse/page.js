import { getProducts, getCategories } from "@/lib/woocommerce";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = 'force-dynamic';

export default async function BrowsePage({ searchParams }) {
  const params = await searchParams;
  const { q = "", cat = "", page = 1, onDiscount } = params;

  let products = [];
  let totalPages = 1;
  let categories = [];

  try {
    categories = await getCategories({ hide_empty: false, per_page: 100 });
    const options = { page, per_page: 24, status: 'publish' };

    if (onDiscount === "true") {
      options.on_sale = true;
    }

    if (cat) {
      const found = categories.find(c => decodeURIComponent(c.slug) === decodeURIComponent(cat));
      if (found) options.category = found.id;
    }

    if (q) {
      const matchingCat = categories.find(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        q.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchingCat && !cat) options.category = matchingCat.id;
      else options.search = q;
    }

    const result = await getProducts(options, true);
    products = result.data;
    totalPages = result.totalPages;
  } catch (error) {
    console.error("Browse page error:", error);
  }

  return (
    <div className="bg-[#f6f6f6] min-h-screen pb-20">
      <ProductGrid initialProducts={products} totalPages={totalPages} />
    </div>
  );
}
