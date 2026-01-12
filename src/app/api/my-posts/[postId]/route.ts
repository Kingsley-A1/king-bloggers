import { NextResponse } from "next/server";

import { deletePost, getPostForEdit } from "@/lib/queries/posts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const post = await getPostForEdit(postId);
    
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json(
      { error: "Failed to load post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const result = await deletePost(postId);
    
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
