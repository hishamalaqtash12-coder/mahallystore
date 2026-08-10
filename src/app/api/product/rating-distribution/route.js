import { NextResponse } from "next/server";
import { getProductReviews } from "@/lib/woocommerce";

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const reviews = await getProductReviews(productId);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalCount = 0;
    let sumRating = 0;

    if (Array.isArray(reviews)) {
      reviews.forEach(review => {
        const rating = parseInt(review.rating, 10);
        if (rating >= 1 && rating <= 5) {
          distribution[rating] += 1;
          totalCount += 1;
          sumRating += rating;
        }
      });
    }

    const average = totalCount > 0 ? (sumRating / totalCount).toFixed(1) : 0;
    const percentages = {};
    for (let i = 1; i <= 5; i++) {
      percentages[i] = totalCount > 0 ? Math.round((distribution[i] / totalCount) * 100) : 0;
    }

    return NextResponse.json({ average, totalCount, distribution, percentages });
  } catch (err) {
    console.error("Error fetching rating distribution:", err);
    return NextResponse.json({ error: "Failed to fetch rating distribution" }, { status: 500 });
  }
}
