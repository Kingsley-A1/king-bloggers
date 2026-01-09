"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Crown, User } from "lucide-react";

import { ImageUploader } from "@/components/features/ImageUploader";
import { Toast } from "@/components/features/Toast";
import { GlassButton } from "@/components/ui/GlassButton";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { updateMyProfile } from "@/lib/actions/profile";

export type ProfileClientProps = {
  initial: {
    email: string;
    role: "reader" | "blogger";
    name: string | null;
    state: string | null;
    lga: string | null;
    imageUrl: string | null;
  };
};

export function ProfileClient({ initial }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initial.name ?? "");
  const [state, setState] = React.useState(initial.state ?? "");
  const [lga, setLga] = React.useState(initial.lga ?? "");
  const [imageUrl, setImageUrl] = React.useState<string>(
    initial.imageUrl ?? ""
  );

  const [busy, startTransition] = React.useTransition();
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    variant?: "success" | "error";
  }>({ open: false, message: "" });

  function save() {
    startTransition(async () => {
      const res = await updateMyProfile({
        name: name.trim() ? name.trim() : null,
        state: state.trim() ? state.trim() : null,
        lga: lga.trim() ? lga.trim() : null,
        imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      });

      if (!res.ok) {
        setToast({ open: true, message: res.error, variant: "error" });
        return;
      }

      setToast({ open: true, message: "Profile updated.", variant: "success" });
      router.refresh();
    });
  }

  return (
    <div className="glass-card p-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-mono opacity-60">Profile</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Your Account
          </h1>
          <p className="mt-2 opacity-60">
            Update your photo, name, and location.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3">
            <div className="text-xs font-mono opacity-60">Signed in as</div>
            <div className="mt-1 font-mono text-sm break-all">
              {initial.email}
            </div>
          </div>
          {/* SEC-008: Role is display-only, not editable */}
          <div className="flex items-center gap-2">
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
            <span className="text-xs text-foreground/50">
              Contact admin to change role
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="rounded-3xl border border-foreground/10 bg-foreground/5 p-6">
          <div className="text-xs font-mono opacity-60">Profile Photo</div>

          <div className="mt-4 flex items-center justify-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-foreground/10 bg-background/30">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Profile image"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-mono opacity-60">
                  No image
                </div>
              )}
            </div>
          </div>

          <ImageUploader
            className="mt-6"
            onUploaded={(r) => {
              if (r.publicUrl) setImageUrl(r.publicUrl);
            }}
          />
        </div>

        <div className="rounded-3xl border border-foreground/10 bg-foreground/5 p-6 md:p-8">
          <div className="text-xs font-mono opacity-60">Details</div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-xs font-mono opacity-60">Name</span>
              <div className="mt-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-mono opacity-60">State</span>
              <div className="mt-2">
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Lagos"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-mono opacity-60">LGA</span>
              <div className="mt-2">
                <Input
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  placeholder="e.g. Ikeja"
                />
              </div>
            </label>

            <div className="md:col-span-2 flex items-center justify-between gap-3 pt-4">
              <GlassButton
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </GlassButton>
              <GlassButton variant="primary" onClick={save} disabled={busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size={16} /> Saving…
                  </span>
                ) : (
                  "Save Changes"
                )}
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </div>
  );
}
