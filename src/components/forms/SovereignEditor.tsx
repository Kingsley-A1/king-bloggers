"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { cn } from "../../lib/utils";
import { createPost, publishPost, updatePost } from "../../lib/actions/posts";
import { GlassCard } from "../ui/GlassCard";
import { GlassButton } from "../ui/GlassButton";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Spinner } from "../ui/Spinner";
import { Toast } from "../features/Toast";
import {
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from "../../lib/safe-storage";

const STORAGE_KEY = "king_bloggers_draft_v1";

type Draft = {
  postId?: string;
  title: string;
  html: string;
  category?: Category;
  excerpt?: string;
  coverImageUrl?: string;
  videoUrl?: string;
};

const CATEGORIES = [
  "tech",
  "art_culture",
  "entertainment",
  "politics",
  "economics",
  "religion",
  "sports",
  "health",
  "finances",
  
] as const;
type Category = (typeof CATEGORIES)[number];

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

function safeParseDraft(raw: string | null): Draft {
  if (!raw) return { title: "", html: "" };
  try {
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      postId: parsed.postId,
      title: parsed.title ?? "",
      html: parsed.html ?? "",
      category: parsed.category,
      excerpt: parsed.excerpt,
      coverImageUrl: parsed.coverImageUrl,
      videoUrl: parsed.videoUrl,
    };
  } catch (error) {
    void error;
    return { title: "", html: "" };
  }
}

function textFromHtml(html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent ?? "").replace(/\s+/g, " ").trim();
}

export type SovereignEditorProps = {
  className?: string;
  coverImageUrl?: string | null;
  onCoverImageUrlChange?: (url: string | null) => void;
};

export function SovereignEditor({
  className,
  coverImageUrl,
  onCoverImageUrlChange,
}: SovereignEditorProps) {
  const router = useRouter();
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [postId, setPostId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [html, setHtml] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [category, setCategory] = React.useState<Category>("tech");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<{ open: boolean; message: string }>(
    () => ({ open: false, message: "" })
  );

  // Restore draft on mount - intentionally only run once
  React.useEffect(() => {
    const draft = safeParseDraft(safeLocalStorageGet(STORAGE_KEY));
    setPostId(draft.postId ?? null);
    setTitle(draft.title);
    setHtml(draft.html);
    setCategory(draft.category ?? "tech");
    setExcerpt(draft.excerpt ?? "");
    setVideoUrl(draft.videoUrl ?? "");
    if (draft.coverImageUrl && !coverImageUrl) {
      onCoverImageUrlChange?.(draft.coverImageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (typeof coverImageUrl === "string") {
      // Keep draft in sync when uploader updates.
      const existing = safeParseDraft(safeLocalStorageGet(STORAGE_KEY));
      const payload: Draft = {
        ...existing,
        postId: existing.postId ?? postId ?? undefined,
        title,
        html,
        category,
        excerpt,
        coverImageUrl,
      };
      safeLocalStorageSet(STORAGE_KEY, JSON.stringify(payload));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverImageUrl]);

  React.useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [html]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      const payload: Draft = {
        postId: postId ?? undefined,
        title,
        html,
        category,
        excerpt,
        coverImageUrl: coverImageUrl ?? undefined,
        videoUrl,
      };
      safeLocalStorageSet(STORAGE_KEY, JSON.stringify(payload));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [postId, title, html, category, excerpt, coverImageUrl, videoUrl]);

  function exec(cmd: string, value?: string) {
    const el = editorRef.current;
    el?.focus();
    // Deprecated but still widely supported and fits the "no extra libs" constraint.
    document.execCommand(cmd, false, value);
    setHtml(el?.innerHTML ?? "");
  }

  function saveNow() {
    const payload: Draft = {
      postId: postId ?? undefined,
      title,
      html,
      category,
      excerpt,
      coverImageUrl: coverImageUrl ?? undefined,
      videoUrl,
    };
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(payload));
    setToast({ open: true, message: "Draft saved." });
  }

  function clear() {
    safeLocalStorageRemove(STORAGE_KEY);
    setPostId(null);
    setTitle("");
    setHtml("");
    setExcerpt("");
    setCategory("tech");
    setVideoUrl("");
    onCoverImageUrlChange?.(null);
    if (editorRef.current) editorRef.current.innerHTML = "";
    setToast({ open: true, message: "Draft cleared." });
  }

  async function saveToBackend() {
    if (busy) return;
    if (!title.trim() || !html.trim()) {
      setToast({ open: true, message: "Title and content are required." });
      return;
    }

    setBusy(true);
    try {
      const computedExcerpt =
        excerpt.trim() || textFromHtml(html).slice(0, 220);

      if (!postId) {
        const res = await createPost({
          title: title.trim(),
          content: html,
          category,
          excerpt: computedExcerpt || undefined,
          coverImageUrl: coverImageUrl ?? undefined,
          videoUrl: videoUrl.trim() || undefined,
        });
        if (!res.ok) {
          setToast({ open: true, message: res.error });
          return;
        }
        setPostId(res.postId);
        setToast({ open: true, message: "Saved to backend." });
        return;
      }

      const res = await updatePost({
        postId,
        title: title.trim(),
        content: html,
        category,
        excerpt: computedExcerpt || null,
        coverImageUrl: coverImageUrl ?? null,
        videoUrl: videoUrl.trim() || null,
      });
      if (!res.ok) {
        setToast({ open: true, message: res.error });
        return;
      }
      setToast({ open: true, message: "Saved to backend." });
    } finally {
      setBusy(false);
    }
  }

  async function publishNow() {
    if (busy) return;

    setBusy(true);
    try {
      let id = postId;
      if (!id) {
        const created = await createPost({
          title: title.trim(),
          content: html,
          category,
          excerpt:
            excerpt.trim() || textFromHtml(html).slice(0, 220) || undefined,
          coverImageUrl: coverImageUrl ?? undefined,
          videoUrl: videoUrl.trim() || undefined,
        });
        if (!created.ok) {
          setToast({ open: true, message: created.error });
          return;
        }
        id = created.postId;
        setPostId(id);
      }

      const published = await publishPost({ postId: id });
      if (!published.ok) {
        setToast({ open: true, message: published.error });
        return;
      }

      setToast({ open: true, message: "Published." });
      router.replace(`/blog/${published.slug}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <GlassCard className={cn("p-6 md:p-10", className)}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-mono text-foreground/50">
              Sovereign Write
            </p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Blogger Studio
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <GlassButton variant="glass" onClick={() => exec("bold")}>
              Bold
            </GlassButton>
            <GlassButton variant="glass" onClick={() => exec("italic")}>
              Italic
            </GlassButton>
            <GlassButton variant="glass" onClick={() => exec("underline")}>
              Underline
            </GlassButton>
            <GlassButton
              variant="glass"
              onClick={() => exec("formatBlock", "h2")}
            >
              H2
            </GlassButton>
            <GlassButton
              variant="glass"
              onClick={() => {
                const url = window.prompt("Enter link URL");
                if (url) exec("createLink", url);
              }}
            >
              Link
            </GlassButton>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-mono text-foreground/50">
                  Category
                </div>
                <div className="mt-2">
                  <Select
                    value={category}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (isCategory(next)) setCategory(next);
                    }}
                  >
                    <option value="tech">Technology</option>
                    <option value="art_culture">Art & Culture</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="politics">Politics</option>
                    <option value="economics">Economics</option>
                    <option value="religion">Religion</option>
                  </Select>
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-foreground/50">
                  Cover Image URL
                </div>
                <div className="mt-2">
                  <Input
                    value={coverImageUrl ?? ""}
                    onChange={(e) =>
                      onCoverImageUrlChange?.(e.target.value || null)
                    }
                    placeholder="Paste uploaded image URL"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-foreground/50">
                Video URL (optional)
              </div>
              <div className="mt-2">
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://... (mp4 or YouTube URL)"
                />
              </div>
            </div>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
            />

            <Input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Excerpt (optional)"
            />

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) =>
                setHtml((e.currentTarget as HTMLDivElement).innerHTML)
              }
              className={cn(
                "min-h-[320px] rounded-2xl border border-foreground/10 bg-foreground/5 backdrop-blur-xl p-4",
                "outline-none focus:border-king-orange/60",
                "prose dark:prose-invert max-w-none"
              )}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-mono text-foreground/50">
                Auto-saves to localStorage
              </div>
              <div className="flex gap-2">
                <GlassButton variant="glass" onClick={saveNow}>
                  Save Draft
                </GlassButton>
                <GlassButton variant="ghost" onClick={clear}>
                  Clear
                </GlassButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <GlassButton
                variant="glass"
                onClick={() => void saveToBackend()}
                disabled={busy}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Working…
                  </span>
                ) : postId ? (
                  "Update (Backend)"
                ) : (
                  "Save (Backend)"
                )}
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={() => void publishNow()}
                disabled={busy || !title || !html}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Publishing…
                  </span>
                ) : (
                  "Publish"
                )}
              </GlassButton>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-mono text-foreground/50">
              Live Preview
            </div>
            <div className="min-h-[420px] rounded-2xl border border-foreground/10 bg-foreground/5 backdrop-blur-xl p-5 overflow-auto">
              <h1 className="text-2xl font-black tracking-tight">
                {title || "Untitled"}
              </h1>
              <div
                className="mt-4 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: html || "<p class='opacity-60'>Start writing…</p>",
                }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </>
  );
}
