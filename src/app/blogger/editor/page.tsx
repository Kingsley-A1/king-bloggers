"use client";

import { ImageUploader } from "@/components/features/ImageUploader";
import { SectionHeader } from "@/components/features/SectionHeader";
import { SovereignEditor } from "@/components/forms/SovereignEditor";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";

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
        </GlassCard>

        <div className="mt-8">
          <SovereignEditor coverImageUrl={coverUrl} onCoverImageUrlChange={setCoverUrl} />
        </div>

        <div className="mt-8">
          <ImageUploader onUploaded={(x) => setCoverUrl(x.publicUrl)} />
        </div>
      </Container>
    </main>
  );
}
