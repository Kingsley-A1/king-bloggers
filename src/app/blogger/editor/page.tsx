"use client";

import { ImageUploader } from "@/components/features/ImageUploader";
import { SectionHeader } from "@/components/features/SectionHeader";
import { SovereignEditor } from "@/components/forms/SovereignEditor";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { Upload, FileText, Sparkles } from "lucide-react";

import * as React from "react";

export default function BloggerEditorPage() {
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);

  return (
    <main className="min-h-screen py-10 md:py-14">
      <Container>
        <GlassCard className="p-8 md:p-12">
          <SectionHeader
            title="Blogger Studio"
            subtitle="Write with authority. Save drafts locally, then publish to the live feed."
          />
          
          {/* Quick Tips */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 border border-foreground/10">
              <FileText className="h-5 w-5 text-king-orange shrink-0" />
              <span className="text-xs text-foreground/70">Write your story with the rich text editor below</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 border border-foreground/10">
              <Upload className="h-5 w-5 text-king-orange shrink-0" />
              <span className="text-xs text-foreground/70">Upload a cover image to make your post stand out</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 border border-foreground/10">
              <Sparkles className="h-5 w-5 text-king-orange shrink-0" />
              <span className="text-xs text-foreground/70">Choose a category and hit Publish when ready</span>
            </div>
          </div>
        </GlassCard>

        {/* Cover Image Upload - Moved to top for easier access */}
        <div className="mt-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-sm">Cover Image</h3>
                <p className="text-xs text-foreground/60 mt-0.5">Recommended: 1200×630px for best social sharing</p>
              </div>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            {coverUrl ? (
              <div className="relative aspect-[1200/630] rounded-xl overflow-hidden border border-foreground/10">
                <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <ImageUploader onUploaded={(x) => setCoverUrl(x.publicUrl)} />
            )}
          </GlassCard>
        </div>

        <div className="mt-6">
          <SovereignEditor coverImageUrl={coverUrl} onCoverImageUrlChange={setCoverUrl} />
        </div>
      </Container>
    </main>
  );
}
