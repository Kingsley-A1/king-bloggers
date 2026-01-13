import { CategoryFeedPage } from "@/components/pages/CategoryFeedPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self Growth",
  description:
    "Personal development, mindset, habits, and growth stories from the King Bloggers community.",
};

export default function SelfGrowthCategoryPage() {
  return <CategoryFeedPage category="self_growth" activeHref="/self-growth" />;
}
