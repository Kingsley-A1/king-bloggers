import { NextResponse } from "next/server";

import { getUserPosts } from "@/lib/queries/posts";

export async function GET() {
  try {
    const posts = await getUserPosts();
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 }
    );
  }
}
