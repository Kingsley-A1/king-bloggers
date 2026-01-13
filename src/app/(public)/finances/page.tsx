import { CategoryFeedPage } from "@/components/pages/CategoryFeedPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finances",
  description:
    "Personal finance, investing, money management, and financial literacy from the King Bloggers community.",
};

export default function FinancesCategoryPage() {
  return <CategoryFeedPage category="finances" activeHref="/finances" />;
}
