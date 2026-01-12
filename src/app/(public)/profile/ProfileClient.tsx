"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Crown,
  User,
  LogOut,
  Camera,
  ChevronRight,
  Bell,
  Settings,
  MessageSquare,
  Edit3,
  Check,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { ImageUploader } from "@/components/features/ImageUploader";
import { Toast } from "@/components/features/Toast";
import { GlassButton } from "@/components/ui/GlassButton";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { updateMyProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS - Mobile-First Profile
// ============================================
// Clean, app-like experience
// ============================================

export type ProfileClientProps = {
  initial: {
    email: string;
    role: "reader" | "blogger";
    name: string | null;
    state: string | null;
    lga: string | null;
    imageUrl: string | null;
  };
  commentCount: number;
  postCount: number;
};

type EditField = "name" | "location" | null;

export function ProfileClient({ initial, commentCount, postCount }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initial.name ?? "");
  const [state, setState] = React.useState(initial.state ?? "");
  const [lga, setLga] = React.useState(initial.lga ?? "");
  const [imageUrl, setImageUrl] = React.useState<string>(initial.imageUrl ?? "");
  const [editField, setEditField] = React.useState<EditField>(null);
  const [showUploader, setShowUploader] = React.useState(false);

  const [busy, startTransition] = React.useTransition();
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    variant?: "success" | "error";
  }>({ open: false, message: "" });

  function save(_field?: EditField) {
    startTransition(async () => {
      const res = await updateMyProfile({
        name: name.trim() || null,
        state: state.trim() || null,
        lga: lga.trim() || null,
        imageUrl: imageUrl.trim() || null,
      });

      if (!res.ok) {
        setToast({ open: true, message: res.error, variant: "error" });
        return;
      }

      setToast({ open: true, message: "Saved!", variant: "success" });
      setEditField(null);
      router.refresh();
    });
  }

  const displayName = name.trim() || initial.email.split("@")[0];

  return (
    <main className="min-h-screen pb-24">
      {/* Profile Header - Gradient Background */}
      <div className="relative">
        <div className="absolute inset-0 h-40 bg-gradient-to-b from-king-orange/20 to-transparent" />
        
        <Container className="relative pt-8 pb-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-xl bg-foreground/10">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-foreground/30" />
                  </div>
                )}
              </div>
              
              {/* Camera Button */}
              <button
                type="button"
                onClick={() => setShowUploader(!showUploader)}
                className={cn(
                  "absolute -bottom-1 -right-1 p-2 rounded-full",
                  "bg-king-orange text-white shadow-lg",
                  "active:scale-95 transition-transform"
                )}
                aria-label="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Name & Role */}
            <h1 className="mt-4 text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-foreground/60 mt-0.5">{initial.email}</p>
            
            <div className="mt-2">
              {initial.role === "blogger" ? (
                <Badge variant="gold" className="flex items-center gap-1.5">
                  <Crown className="h-3 w-3" />
                  Blogger
                </Badge>
              ) : (
                <Badge variant="tech" className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  Reader
                </Badge>
              )}
            </div>
          </div>

          {/* Image Uploader (Collapsible) */}
          {showUploader && (
            <div className="mt-6 animate-in slide-in-from-top-2 duration-200">
              <ImageUploader
                maxSize={5}
                onUploaded={(r) => {
                  if (r.publicUrl) {
                    setImageUrl(r.publicUrl);
                    setShowUploader(false);
                    save();
                  }
                }}
              />
            </div>
          )}
        </Container>
      </div>

      <Container className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 text-center">
            <MessageSquare className="w-5 h-5 mx-auto text-king-orange mb-2" />
            <p className="text-2xl font-bold">{commentCount}</p>
            <p className="text-xs text-foreground/60">Comments</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Edit3 className="w-5 h-5 mx-auto text-sovereign-gold mb-2" />
            <p className="text-2xl font-bold">{postCount}</p>
            <p className="text-xs text-foreground/60">Posts</p>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="glass-card overflow-hidden">
          <h2 className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/50 border-b border-foreground/5">
            Personal Info
          </h2>

          {/* Name Field */}
          <div className="px-4 py-3 border-b border-foreground/5">
            {editField === "name" ? (
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => save("name")}
                  disabled={busy}
                  className="p-2 rounded-full bg-king-orange text-white active:scale-95 transition-transform"
                >
                  {busy ? <Spinner size={16} /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditField("name")}
                className="w-full flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-foreground/50">Name</p>
                  <p className="mt-0.5 font-medium">
                    {name.trim() || "Not set"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30" />
              </button>
            )}
          </div>

          {/* Location Field */}
          <div className="px-4 py-3">
            {editField === "location" ? (
              <div className="space-y-3">
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State (e.g. Lagos)"
                  autoFocus
                />
                <Input
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  placeholder="LGA (e.g. Ikeja)"
                />
                <GlassButton
                  variant="primary"
                  onClick={() => save("location")}
                  disabled={busy}
                  className="w-full"
                >
                  {busy ? <Spinner size={16} /> : "Save Location"}
                </GlassButton>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditField("location")}
                className="w-full flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-foreground/50">Location</p>
                  <p className="mt-0.5 font-medium">
                    {state.trim() && lga.trim()
                      ? `${lga}, ${state}`
                      : state.trim() || lga.trim() || "Not set"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass-card overflow-hidden">
          <h2 className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/50 border-b border-foreground/5">
            Quick Links
          </h2>

          <a
            href="/notifications"
            className="flex items-center gap-3 px-4 py-3.5 border-b border-foreground/5 active:bg-foreground/5 transition-colors"
          >
            <Bell className="w-5 h-5 text-foreground/60" />
            <span className="flex-1 font-medium">Notifications</span>
            <ChevronRight className="w-4 h-4 text-foreground/30" />
          </a>

          {initial.role === "blogger" && (
            <a
              href="/bloggers/dashboard"
              className="flex items-center gap-3 px-4 py-3.5 border-b border-foreground/5 active:bg-foreground/5 transition-colors"
            >
              <Settings className="w-5 h-5 text-foreground/60" />
              <span className="flex-1 font-medium">Blogger Dashboard</span>
              <ChevronRight className="w-4 h-4 text-foreground/30" />
            </a>
          )}
        </div>

        {/* Sign Out */}
        <GlassButton
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </GlassButton>
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
