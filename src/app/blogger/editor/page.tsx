"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  X,
  Bold,
  Italic,
  Link2,
  Heading2,
  Image as ImageIcon,
  Camera,
  Video,
  Send,
  Save,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { GlassButton } from "@/components/ui/GlassButton";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/features/Toast";
import { createPost, publishPost, updatePost } from "@/lib/actions/posts";
import {
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from "@/lib/safe-storage";
import { cn } from "@/lib/utils";
import { compressContentImage, formatBytes } from "@/lib/image-compression";

// ============================================
// 👑 KING BLOGGERS - TikTok-Speed Editor
// ============================================
// Frictionless single-screen publishing
// Goal: Write → Upload → Publish in under 60 seconds
// ============================================

const STORAGE_KEY = "king_bloggers_draft_v2";
const CATEGORIES = [
  { value: "tech", label: "Tech", emoji: "💻" },
  { value: "art_culture", label: "Art & Culture", emoji: "🎨" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "sport", label: "Sport", emoji: "⚽" },
  { value: "health", label: "Health", emoji: "🏥" },
  { value: "self_growth", label: "Self Growth", emoji: "🌱" },
  { value: "finances", label: "Finances", emoji: "💰" },
  { value: "politics", label: "Politics", emoji: "🏛️" },
  { value: "economics", label: "Economics", emoji: "📈" },
  { value: "religion", label: "Religion", emoji: "🙏" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

type Draft = {
  postId?: string;
  title: string;
  html: string;
  category: Category;
  coverImageUrl?: string;
};

function safeParseDraft(raw: string | null): Draft {
  if (!raw) return { title: "", html: "", category: "tech" };
  try {
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      postId: parsed.postId,
      title: parsed.title ?? "",
      html: parsed.html ?? "",
      category: parsed.category ?? "tech",
      coverImageUrl: parsed.coverImageUrl,
    };
  } catch {
    return { title: "", html: "", category: "tech" };
  }
}

function textFromHtml(html: string) {
  if (typeof document === "undefined")
    return html.replace(/<[^>]*>/g, " ").trim();
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent ?? "").replace(/\s+/g, " ").trim();
}

// Main page wrapper with Suspense for useSearchParams
export default function BloggerEditorPage() {
  return (
    <React.Suspense fallback={<EditorLoadingFallback />}>
      <EditorContent />
    </React.Suspense>
  );
}

function EditorLoadingFallback() {
  return (
    <main className="min-h-screen bg-background">
      <Container className="py-8">
        <div className="glass-card p-8 text-center">
          <Spinner size={32} className="mx-auto mb-4" />
          <p className="text-foreground/60">Loading editor...</p>
        </div>
      </Container>
    </main>
  );
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Check if we're editing an existing post or creating new
  const editPostId = searchParams.get("edit");
  const isNewMode = searchParams.get("new") === "true";

  // State
  const [postId, setPostId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [html, setHtml] = React.useState("");
  const [category, setCategory] = React.useState<Category>("tech");
  const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(null);
  const [inlineImages, setInlineImages] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(!!editPostId);
  const [isEditing, setIsEditing] = React.useState(false);
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    variant?: "success" | "error";
  }>({ open: false, message: "" });

  // Load post for editing function
  const loadPostForEdit = React.useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/my-posts/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.post) {
            setPostId(data.post.id);
            setTitle(data.post.title);
            setHtml(data.post.content);
            setCategory(data.post.category);
            setCoverImageUrl(data.post.coverImageUrl);
            setIsEditing(true);
          }
        } else {
          setToast({ open: true, message: "Post not found", variant: "error" });
          router.push("/blogger/my-blogs");
        }
      } catch {
        setToast({
          open: true,
          message: "Failed to load post",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Load post for editing or draft on mount
  React.useEffect(() => {
    if (editPostId) {
      loadPostForEdit(editPostId);
    } else if (isNewMode) {
      // Clear everything for new post
      clearDraft();
    } else {
      // Load draft from local storage
      const draft = safeParseDraft(safeLocalStorageGet(STORAGE_KEY));
      setPostId(draft.postId ?? null);
      setTitle(draft.title);
      setHtml(draft.html);
      setCategory(draft.category);
      setCoverImageUrl(draft.coverImageUrl ?? null);
    }
  }, [editPostId, isNewMode, loadPostForEdit]);

  // Sync editor content
  React.useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }, [html]);

  // Auto-save draft (debounced 1.5s) - only for new posts
  React.useEffect(() => {
    if (isEditing || editPostId) return; // Don't auto-save when editing existing

    const handle = window.setTimeout(() => {
      const payload: Draft = {
        postId: postId ?? undefined,
        title,
        html,
        category,
        coverImageUrl: coverImageUrl ?? undefined,
      };
      safeLocalStorageSet(STORAGE_KEY, JSON.stringify(payload));
    }, 1500);
    return () => window.clearTimeout(handle);
  }, [postId, title, html, category, coverImageUrl, isEditing, editPostId]);

  // Editor commands
  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  // Upload image/video via server proxy (avoids CORS issues)
  // 👑 Images are compressed client-side for faster uploads
  async function uploadImage(file: File) {
    setUploading(true);
    try {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
        );
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 50MB.");
      }

      let fileToUpload: File | Blob = file;
      let contentType = file.type;

      // 📸 Compress images before upload (not videos)
      if (file.type.startsWith("image/") && file.type !== "image/gif") {
        const originalSize = file.size;
        const compressedBlob = await compressContentImage(file);
        fileToUpload = compressedBlob;
        contentType = compressedBlob.type;

        // Show compression toast if significant reduction
        const savedPercent = Math.round(
          ((originalSize - compressedBlob.size) / originalSize) * 100
        );
        if (savedPercent > 20) {
          setToast({
            open: true,
            message: `Compressed: ${formatBytes(originalSize)} → ${formatBytes(
              compressedBlob.size
            )} (${savedPercent}% saved)`,
            variant: "success",
          });
        }
      }

      // Use server-side proxy to avoid CORS issues
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("fileName", file.name);
      formData.append("contentType", contentType);

      const response = await fetch("/api/upload", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data = await response.json();
      return data.publicUrl as string;
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : "Upload failed",
        variant: "error",
      });
      return null;
    } finally {
      setUploading(false);
    }
  }

  // Handle cover drop/select
  async function handleCoverUpload(file: File) {
    const url = await uploadImage(file);
    if (url) setCoverImageUrl(url);
  }

  // Clear draft
  function clearDraft() {
    safeLocalStorageRemove(STORAGE_KEY);
    setPostId(null);
    setTitle("");
    setHtml("");
    setCategory("tech");
    setCoverImageUrl(null);
    setIsEditing(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
  }

  // Quick Publish (single action)
  async function quickPublish() {
    if (busy) return;
    if (!title.trim()) {
      setToast({ open: true, message: "Add a title first!", variant: "error" });
      return;
    }
    if (!html.trim() || textFromHtml(html).length < 10) {
      setToast({
        open: true,
        message: "Write some content first!",
        variant: "error",
      });
      return;
    }

    setBusy(true);
    try {
      let id = postId;

      // Create or update post
      if (!id) {
        const excerpt = textFromHtml(html).slice(0, 220);
        const created = await createPost({
          title: title.trim(),
          content: html,
          category,
          excerpt: excerpt || undefined,
          coverImageUrl: coverImageUrl ?? undefined,
        });
        if (!created.ok) {
          setToast({ open: true, message: created.error, variant: "error" });
          return;
        }
        id = created.postId;
        setPostId(id);
      } else if (isEditing) {
        // Update existing post
        const excerpt = textFromHtml(html).slice(0, 220);
        const updated = await updatePost({
          postId: id,
          title: title.trim(),
          content: html,
          category,
          excerpt: excerpt || undefined,
          coverImageUrl: coverImageUrl ?? undefined,
        });
        if (!updated.ok) {
          setToast({ open: true, message: updated.error, variant: "error" });
          return;
        }
      }

      // Publish
      const published = await publishPost({ postId: id });
      if (!published.ok) {
        setToast({ open: true, message: published.error, variant: "error" });
        return;
      }

      // Clear draft and redirect
      safeLocalStorageRemove(STORAGE_KEY);
      setToast({ open: true, message: "🚀 Published!", variant: "success" });

      setTimeout(() => {
        router.replace(`/blog/${published.slug}`);
      }, 500);
    } finally {
      setBusy(false);
    }
  }

  // Save as draft
  async function saveDraft() {
    if (busy) return;
    if (!title.trim()) {
      setToast({ open: true, message: "Add a title first!", variant: "error" });
      return;
    }

    setBusy(true);
    try {
      const excerpt = textFromHtml(html).slice(0, 220);

      if (isEditing && postId) {
        // Update existing
        const updated = await updatePost({
          postId,
          title: title.trim(),
          content: html || "<p></p>",
          category,
          excerpt: excerpt || undefined,
          coverImageUrl: coverImageUrl ?? undefined,
        });
        if (!updated.ok) {
          setToast({ open: true, message: updated.error, variant: "error" });
          return;
        }
        setToast({ open: true, message: "Changes saved!", variant: "success" });
      } else {
        // Create new
        const created = await createPost({
          title: title.trim(),
          content: html || "<p></p>",
          category,
          excerpt: excerpt || undefined,
          coverImageUrl: coverImageUrl ?? undefined,
        });
        if (!created.ok) {
          setToast({ open: true, message: created.error, variant: "error" });
          return;
        }
        setPostId(created.postId);
        setToast({
          open: true,
          message: "Draft saved to cloud",
          variant: "success",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const canPublish = title.trim().length > 0 && textFromHtml(html).length >= 10;

  if (loading) {
    return (
      <main className="min-h-screen py-20 flex items-center justify-center">
        <Spinner size={32} />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-6 md:py-10">
      <Container className="max-w-4xl">
        {/* Header - Clean & Focused */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                onClick={() => router.push("/blogger/my-blogs")}
                className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <span className="font-black text-lg md:text-xl">
              {isEditing ? "✏️ Edit Post" : "✨ Create Post"}
            </span>
          </div>

          {/* Action Buttons - Redesigned Hierarchy */}
          <div className="flex items-center gap-2">
            {/* Clear/Trash - Ghost */}
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={clearDraft}
              disabled={busy}
              className="hidden md:flex"
            >
              <Trash2 className="h-4 w-4" />
            </GlassButton>

            {/* Save Draft - Secondary Glass */}
            <GlassButton
              variant="glass"
              size="sm"
              onClick={saveDraft}
              disabled={busy || !title.trim()}
              className="hidden sm:flex"
            >
              {busy ? <Spinner size={14} /> : <Save className="h-4 w-4 mr-1" />}
              <span className="hidden md:inline">Save</span>
            </GlassButton>

            {/* 👑 PUBLISH - Primary CTA (Most Prominent) */}
            <GlassButton
              variant="primary"
              onClick={quickPublish}
              disabled={busy || !canPublish}
              className="px-4 md:px-6 shadow-lg shadow-king-orange/30"
            >
              {busy ? (
                <Spinner size={16} />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {isEditing ? "Update" : "Publish"}
                </>
              )}
            </GlassButton>
          </div>
        </div>

        {/* 👑 CAMERA-FIRST: Cover Image Upload Zone (Made More Prominent) */}
        <div
          className={cn(
            "relative rounded-2xl border-2 border-dashed transition-all overflow-hidden mb-6",
            coverImageUrl
              ? "border-transparent"
              : "border-king-orange/40 hover:border-king-orange bg-gradient-to-br from-king-orange/5 to-amber-500/5 cursor-pointer"
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith("image/")) handleCoverUpload(file);
          }}
          onClick={() => !coverImageUrl && fileInputRef.current?.click()}
        >
          {coverImageUrl ? (
            <div className="relative aspect-[21/9]">
              <Image
                src={coverImageUrl}
                alt="Cover"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCoverImageUrl(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-12 md:py-16 cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
              />
              {uploading ? (
                <Spinner size={32} className="text-king-orange" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-king-orange/20 flex items-center justify-center mb-3">
                    <ImageIcon className="h-8 w-8 text-king-orange" />
                  </div>
                  <span className="text-base font-semibold text-foreground/80 mb-1">
                    Add Cover Image
                  </span>
                  <span className="text-sm text-foreground/50">
                    Tap or drag & drop
                  </span>
                </>
              )}
            </label>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
                category === cat.value
                  ? "bg-king-orange text-black"
                  : "bg-foreground/5 border border-foreground/10 hover:border-king-orange/50"
              )}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your headline..."
          className="w-full bg-transparent text-3xl md:text-4xl font-black tracking-tight placeholder:text-foreground/30 outline-none mb-4"
          autoFocus
        />

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 mb-3 pb-3 border-b border-foreground/10">
          <button
            type="button"
            onClick={() => exec("bold")}
            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => exec("formatBlock", "h2")}
            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
            title="Heading"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Enter URL");
              if (url) exec("createLink", url);
            }}
            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
            title="Link"
          >
            <Link2 className="h-4 w-4" />
          </button>

          {/* 📸 CAMERA BUTTON - Prominent for Mobile */}
          <button
            type="button"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.capture = "environment"; // Opens camera on mobile
              input.multiple = true;
              input.onchange = async (e) => {
                const files = Array.from(
                  (e.target as HTMLInputElement).files || []
                );
                if (files.length === 0) return;

                setUploading(true);
                const uploadedUrls: string[] = [];

                for (const file of files) {
                  const url = await uploadImage(file);
                  if (url) uploadedUrls.push(url);
                }

                setUploading(false);

                // Add images to inlineImages state for displaying below textarea
                if (uploadedUrls.length > 0) {
                  setInlineImages((prev) => [...prev, ...uploadedUrls]);
                  setToast({
                    open: true,
                    message: `${uploadedUrls.length} image${
                      uploadedUrls.length > 1 ? "s" : ""
                    } added`,
                    variant: "success",
                  });
                }
              };
              input.click();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm transition-all hover:from-blue-500/90 hover:to-cyan-500/90 active:scale-95 shadow-lg shadow-blue-500/25"
            title="Take Photo / Add Images"
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Photo</span>
          </button>

          {/* Inline Video Upload - PROMINENT BUTTON */}
          <button
            type="button"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "video/mp4,video/webm";
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  // Check video duration before upload
                  const video = document.createElement("video");
                  video.preload = "metadata";

                  video.onloadedmetadata = async () => {
                    window.URL.revokeObjectURL(video.src);
                    const duration = video.duration;

                    // 10 minutes = 600 seconds
                    if (duration > 600) {
                      setToast({
                        open: true,
                        message: `Video is too long (${Math.round(
                          duration / 60
                        )} min). Maximum is 10 minutes.`,
                        variant: "error",
                      });
                      return;
                    }

                    // Upload the video
                    setUploading(true);
                    const url = await uploadImage(file);
                    setUploading(false);
                    if (url) {
                      exec(
                        "insertHTML",
                        `<video src="${url}" controls style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;"></video>`
                      );
                    }
                  };

                  video.onerror = () => {
                    setToast({
                      open: true,
                      message: "Failed to read video file. Please try another.",
                      variant: "error",
                    });
                  };

                  video.src = URL.createObjectURL(file);
                }
              };
              input.click();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-king-orange to-amber-500 text-black font-semibold text-sm transition-all hover:from-king-orange/90 hover:to-amber-500/90 active:scale-95 shadow-lg shadow-king-orange/25"
            title="Insert Video (max 10 min)"
            disabled={uploading}
          >
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Video</span>
          </button>

          <div className="flex-1" />
          {uploading && (
            <span className="text-xs text-king-orange font-medium mr-2">
              Uploading...
            </span>
          )}
          <span className="text-xs text-foreground/40 font-mono">
            {textFromHtml(html).length} chars
          </span>
        </div>

        {/* Content Editor */}
        <div className="relative rounded-xl border-2 border-dashed border-foreground/10 bg-foreground/[0.02] p-4 md:p-6 transition-all focus-within:border-king-orange/30 focus-within:bg-foreground/[0.03] hover:border-foreground/20">
          {/* Editor hint */}
          <div className="absolute top-2 right-2 text-[10px] text-foreground/30 uppercase tracking-wider font-medium pointer-events-none">
            Content Area
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) =>
              setHtml((e.currentTarget as HTMLDivElement).innerHTML)
            }
            className={cn(
              "min-h-[250px] md:min-h-[350px] outline-none",
              "prose dark:prose-invert max-w-none",
              "text-base md:text-lg leading-relaxed",
              "[&:empty]:before:content-['Start_writing_your_story...'] [&:empty]:before:text-foreground/30 [&:empty]:before:italic"
            )}
          />
        </div>

        {/* 📸 Uploaded Images Gallery - Below Text Area */}
        {inlineImages.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-foreground/10 bg-foreground/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground/80">
                📸 Uploaded Images ({inlineImages.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  // Insert all images into the editor content
                  const imagesHtml = inlineImages
                    .map(
                      (url) =>
                        `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`
                    )
                    .join("");
                  exec("insertHTML", imagesHtml);
                  setInlineImages([]);
                  setToast({
                    open: true,
                    message: "Images added to content",
                    variant: "success",
                  });
                }}
                className="text-xs font-semibold text-king-orange hover:underline"
              >
                Insert All to Content
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {inlineImages.map((url, idx) => (
                <div
                  key={url}
                  className="relative group rounded-lg overflow-hidden aspect-square bg-foreground/5"
                >
                  <Image
                    src={url}
                    alt={`Uploaded image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* Delete button overlay */}
                  <button
                    type="button"
                    onClick={() =>
                      setInlineImages((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {/* Insert single image */}
                  <button
                    type="button"
                    onClick={() => {
                      exec(
                        "insertHTML",
                        `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`
                      );
                      setInlineImages((prev) =>
                        prev.filter((_, i) => i !== idx)
                      );
                      setToast({
                        open: true,
                        message: "Image added to content",
                        variant: "success",
                      });
                    }}
                    className="absolute bottom-1 left-1 right-1 py-1.5 text-[10px] font-bold uppercase tracking-wider text-center bg-king-orange text-black rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Insert
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload / Publish Actions - Sticky on Mobile */}
        <div className="mt-6 p-4 rounded-xl bg-foreground/5 border border-foreground/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={quickPublish}
            disabled={busy || !canPublish}
            className="flex-1 gap-2 text-base font-bold py-3"
          >
            {busy ? (
              <Spinner size={18} />
            ) : (
              <>
                <Send className="h-5 w-5" />
                {isEditing ? "Update & Publish" : "Upload Blog"}
              </>
            )}
          </GlassButton>
          <GlassButton
            variant="glass"
            size="lg"
            onClick={saveDraft}
            disabled={busy || !title.trim()}
            className="gap-2"
          >
            <Save className="h-5 w-5" />
            Save Draft
          </GlassButton>
        </div>

        {/* Status Bar */}
        <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center justify-between text-xs text-foreground/50">
          <span>{postId ? "✓ Synced to cloud" : "Auto-saving locally..."}</span>
          <span>
            {canPublish
              ? "✓ Ready to publish"
              : "Add title + content to publish"}
          </span>
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <GlassButton
            as="a"
            href="/"
            variant="ghost"
            size="sm"
            className="gap-2 text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </GlassButton>
        </div>
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
