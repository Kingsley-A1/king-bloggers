"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/features/SectionHeader";
import { Toast } from "@/components/features/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS - My Blogs Management
// ============================================
// View, edit, delete your content
// ============================================

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
};

export default function MyBlogsPage() {
  const router = useRouter();
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    variant?: "success" | "error";
  }>({ open: false, message: "" });

  // Load posts on mount
  React.useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch("/api/my-posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch {
      setToast({
        open: true,
        message: "Failed to load posts",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId: string) {
    if (
      !confirm(
        "Are you sure you want to delete this post? This cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(postId);
    setActiveMenu(null);

    try {
      const res = await fetch(`/api/my-posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setToast({ open: true, message: "Post deleted", variant: "success" });
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      setToast({
        open: true,
        message: "Failed to delete post",
        variant: "error",
      });
    } finally {
      setDeleting(null);
    }
  }

  function handleEdit(postId: string) {
    setActiveMenu(null);
    router.push(`/bloggers/editor?edit=${postId}`);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function categoryLabel(category: string) {
    const labels: Record<string, string> = {
      tech: "Tech",
      art_culture: "Art & Culture",
      entertainment: "Entertainment",
      politics: "Politics",
      economics: "Economics",
      religion: "Religion",
    };
    return labels[category] ?? category;
  }

  return (
    <main className="min-h-screen py-10 md:py-14">
      <Container>
        {/* Header */}
        <GlassCard className="p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <SectionHeader
              title="My Blogs"
              subtitle="Manage your published and draft content."
            />
            <GlassButton
              variant="primary"
              onClick={() => router.push("/bloggers/editor?new=true")}
              className="gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              New Blog
            </GlassButton>
          </div>
        </GlassCard>

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} />
          </div>
        ) : posts.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-2">No blogs yet</h3>
            <p className="text-foreground/60 mb-6">
              Start sharing your thoughts with the world.
            </p>
            <GlassButton
              variant="primary"
              onClick={() => router.push("/bloggers/editor?new=true")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Blog
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <GlassCard
                key={post.id}
                className={cn(
                  "p-4 md:p-6 transition-all",
                  deleting === post.id && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex gap-4">
                  {/* Cover Image */}
                  <div className="shrink-0 w-24 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden bg-foreground/5 relative">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-foreground/20" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              post.status === "published"
                                ? "published"
                                : "draft"
                            }
                          >
                            {post.status}
                          </Badge>
                          <Badge variant="secondary">
                            {categoryLabel(post.category)}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg truncate">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-foreground/60 line-clamp-1 mt-1">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      {/* Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === post.id ? null : post.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {activeMenu === post.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] py-2 rounded-xl border border-foreground/10 bg-background/95 backdrop-blur-xl shadow-xl">
                            <button
                              onClick={() => handleEdit(post.id)}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-foreground/10"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </button>
                            {post.status === "published" && (
                              <Link
                                href={`/blog/${post.slug}`}
                                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-foreground/10"
                                onClick={() => setActiveMenu(null)}
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Post
                              </Link>
                            )}
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-foreground/10 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-foreground/50">
                      <span>{formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.reactionCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </Container>

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </main>
  );
}
