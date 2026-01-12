"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  Palette,
  Mic,
  Scale,
  DollarSign,
  Church,
  Activity,
  Heart,
} from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { saveUserInterests } from "@/lib/actions/onboarding";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS - Interest Selection
// ============================================
// Spotify/TikTok-style onboarding for personalization
// Mobile-first, immersive experience
// ============================================

interface InterestCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  imageUrl: string;
  gradient: string;
}

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "tech",
    label: "Tech",
    description: "AI, gadgets, startups & innovation",
    icon: Zap,
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    id: "art_culture",
    label: "Art & Culture",
    description: "Music, fashion, design & creativity",
    icon: Palette,
    imageUrl:
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=400&fit=crop",
    gradient: "from-purple-500 to-pink-400",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    description: "Movies, celebrities, gaming & pop culture",
    icon: Mic,
    imageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
    gradient: "from-orange-500 to-red-400",
  },
  {
    id: "sport",
    label: "Sport",
    description: "Football, athletics, sports news & highlights",
    icon: Activity,
    imageUrl:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop",
    gradient: "from-green-500 to-emerald-400",
  },
  {
    id: "health",
    label: "Health",
    description: "Wellness, fitness, nutrition & mental health",
    icon: Heart,
    imageUrl:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop",
    gradient: "from-pink-500 to-rose-400",
  },
  {
    id: "politics",
    label: "Politics",
    description: "Government, policies & current affairs",
    icon: Scale,
    imageUrl:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=400&fit=crop",
    gradient: "from-red-500 to-orange-400",
  },
  {
    id: "economics",
    label: "Economics",
    description: "Finance, markets & business trends",
    icon: DollarSign,
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    id: "religion",
    label: "Religion",
    description: "Faith, spirituality & philosophy",
    icon: Church,
    imageUrl:
      "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=400&fit=crop",
    gradient: "from-amber-500 to-yellow-400",
  },
];

function InterestCard({
  category,
  selected,
  onToggle,
}: {
  category: InterestCategory;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = category.icon;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative w-full h-40 sm:h-44 md:h-48 rounded-2xl overflow-hidden",
        "transition-all duration-300 ease-out",
        "group focus:outline-none focus:ring-2 focus:ring-king-orange focus:ring-offset-2 focus:ring-offset-black",
        selected && "ring-2 ring-king-orange"
      )}
    >
      {/* Background Image */}
      <Image
        src={category.imageUrl}
        alt={category.label}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority
        className={cn(
          "object-cover transition-all duration-500",
          selected
            ? "scale-110 brightness-50"
            : "scale-100 brightness-75 group-hover:scale-105"
        )}
      />

      {/* Gradient Overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-60 transition-opacity",
          `bg-gradient-to-br ${category.gradient}`,
          selected && "opacity-80"
        )}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
        {/* Selected Checkmark */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="absolute top-3 right-3 w-8 h-8 bg-king-orange rounded-full flex items-center justify-center shadow-lg"
            >
              <Check className="w-5 h-5 text-black" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div animate={{ scale: selected ? 1.2 : 1 }} className="mb-2">
          <Icon className="w-10 h-10 drop-shadow-lg" />
        </motion.div>

        {/* Label */}
        <h3 className="text-lg font-black tracking-tight drop-shadow-lg">
          {category.label}
        </h3>

        {/* Description */}
        <p className="text-xs text-white/80 text-center mt-1 line-clamp-2 px-2">
          {category.description}
        </p>
      </div>

      {/* Selection Pulse */}
      {selected && (
        <motion.div
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-king-orange rounded-2xl"
        />
      )}
    </motion.button>
  );
}

export function OnboardingClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const userName = session?.user?.name?.split(" ")[0] || "there";

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="h-12 w-12 text-king-orange" />
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  const toggleCategory = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(INTEREST_CATEGORIES.map((c) => c.id)));
  };

  const handleContinue = () => {
    if (selected.size === 0) {
      setError("Please select at least one interest");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveUserInterests(Array.from(selected));
      if (result.ok) {
        router.push("/");
      } else {
        setError(result.error ?? "Failed to save interests");
      }
    });
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-4">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-king-orange" />
            <span className="text-lg font-black">Hey, {userName}!</span>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            What interests you?
          </h1>
          <p className="text-foreground/60">
            Select topics to personalize your feed. Choose as many as you like!
          </p>
        </motion.div>

        {/* Select All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <button
            type="button"
            onClick={selectAll}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold transition-all",
              "border border-king-orange/30 hover:border-king-orange",
              "text-king-orange hover:bg-king-orange/10",
              selected.size === INTEREST_CATEGORIES.length &&
                "bg-king-orange/20"
            )}
          >
            {selected.size === INTEREST_CATEGORIES.length
              ? "✓ All Selected"
              : "Select All"}
          </button>
        </motion.div>

        {/* Interest Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {INTEREST_CATEGORIES.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <InterestCard
                category={category}
                selected={selected.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Selection Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-6 text-sm text-foreground/50"
        >
          {selected.size === 0
            ? "No interests selected"
            : `${selected.size} interest${
                selected.size > 1 ? "s" : ""
              } selected`}
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
          <GlassButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={isPending}
          >
            {isPending ? (
              "Saving..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </GlassButton>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-8 h-1 rounded-full bg-king-orange" />
            <div className="w-8 h-1 rounded-full bg-foreground/20" />
          </div>
        </div>
      </div>

      {/* Bottom Padding for Fixed Footer */}
      <div className="h-32" />
    </main>
  );
}
