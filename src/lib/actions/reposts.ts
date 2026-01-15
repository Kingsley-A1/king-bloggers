"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { auth } from "@/lib/auth";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function repostPost(postId: string): Promise<
  | { ok: true; slug: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { ok: false, error: "Sign in to repost." };

  const [original] = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      content: posts.content,
      category: posts.category,
      coverImageUrl: posts.coverImageUrl,
      videoUrl: posts.videoUrl,
      status: posts.status,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!original || original.status !== "published") {
    return { ok: false, error: "Post not found." };
  }

  const title = `Repost: ${original.title}`.slice(0, 180);
  const baseSlug = slugify(title) || "repost";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const attribution = `<p><strong>Reposted</strong> from <a href="/blog/${original.slug}">${original.title}</a></p>`;
  const content = `${attribution}${original.content}`;

  await db.insert(posts).values({
    authorId: userId,
    title,
    slug,
    excerpt: original.excerpt,
    content,
    category: original.category,
    coverImageUrl: original.coverImageUrl,
    videoUrl: original.videoUrl ?? null,
    status: "published",
  });

  revalidatePath("/");
  revalidatePath(`/blog/${slug}`);

  return { ok: true, slug };
}
