import { getProducts, getCategories } from "@/lib/woocommerce";
import CategoryPageClient from "./CategoryPageClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const categories = await getCategories({ hide_empty: false, per_page: 100 });
  const category = categories.find(c => c.slug === slug);
  const name = category?.name?.replace(/&amp;/g, '&') || slug;
  return {
    title: `${name} | Mahally Marketplace`,
    description: category?.description
      ? category.description.replace(/<[^>]+>/g, '').slice(0, 160)
      : `Browse the best ${name} products from local merchants on Mahally.`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  let products = [];
  let categories = [];
  let category = null;
  let totalPages = 1;
  let siblingCategories = [];

  try {
    categories = await getCategories({ hide_empty: false, per_page: 100 });
    category = categories.find(c => c.slug === slug);

    if (category) {
      const result = await getProducts({
        per_page: 40,
        status: 'publish',
        category: category.slug,
      }, true);
      products = result.data;
      totalPages = result.totalPages;

      // Get sibling categories (same parent, excluding current)
      siblingCategories = categories.filter(c =>
        c.parent === (category.parent || 0) &&
        c.id !== category.id &&
        c.slug !== 'uncategorized'
      );
    }
  } catch (error) {
    console.error("Category page error:", error);
  }

  return (
    <CategoryPageClient
      category={category}
      products={products}
      totalPages={totalPages}
      siblingCategories={siblingCategories}
      slug={slug}
    />
  );
}
