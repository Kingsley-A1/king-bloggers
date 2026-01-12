"use client";

import * as React from "react";
import { ThumbsDown, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { setReaction } from "@/app/actions/reactions";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS - IG-Style Reaction Bar
// ============================================
// Features: Pop animation, sound effect, particles
// ============================================

// Sound effect for like (create a simple pop sound using Web Audio API)
function playLikeSound() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // Create oscillator for a short "pop" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch {
    // Audio not supported, fail silently
  }
}

// Particle component for burst effect
function LikeParticle({ index }: { index: number }) {
  const angle = (index / 6) * Math.PI * 2;
  const distance = 40 + Math.random() * 20;
  
  return (
    <motion.div
      initial={{ 
        opacity: 1, 
        scale: 0,
        x: 0, 
        y: 0 
      }}
      animate={{ 
        opacity: 0, 
        scale: 1,
        x: Math.cos(angle) * distance, 
        y: Math.sin(angle) * distance 
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute w-2 h-2 rounded-full bg-king-orange"
      style={{ left: "50%", top: "50%", marginLeft: -4, marginTop: -4 }}
    />
  );
}

// Floating hearts for IG-style effect
function FloatingHeart({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        y: [-10, -30, -50, -70],
        x: (Math.random() - 0.5) * 30
      }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className="absolute -top-2 left-1/2 -ml-2"
    >
      <Heart className="h-4 w-4 fill-king-orange text-king-orange" />
    </motion.div>
  );
}

export type ReactionBarProps = {
  postId: string;
  initialUp: number;
  initialDown: number;
  initialMyValue: "up" | "down" | null;
};

export function ReactionBar({
  postId,
  initialUp,
  initialDown,
  initialMyValue,
}: ReactionBarProps) {
  const [up, setUp] = React.useState(initialUp);
  const [down, setDown] = React.useState(initialDown);
  const [myValue, setMyValue] = React.useState<"up" | "down" | null>(
    initialMyValue
  );
  const [busy, setBusy] = React.useState(false);
  const [showBurst, setShowBurst] = React.useState(false);
  const [showHearts, setShowHearts] = React.useState(false);
  const [popDown, setPopDown] = React.useState(false);

  async function apply(next: "up" | "down") {
    if (busy) return;

    // Trigger animations and sound for like
    if (next === "up" && myValue !== "up") {
      playLikeSound();
      setShowBurst(true);
      setShowHearts(true);
      setTimeout(() => setShowBurst(false), 500);
      setTimeout(() => setShowHearts(false), 1000);
    }
    
    if (next === "down") {
      setPopDown(true);
      setTimeout(() => setPopDown(false), 400);
    }

    // Optimistic update
    const prev = myValue;
    let nextMy: "up" | "down" | null = next;
    if (prev === next) nextMy = null;

    const nextUp = (prev === "up" ? up - 1 : up) + (nextMy === "up" ? 1 : 0);
    const nextDown =
      (prev === "down" ? down - 1 : down) + (nextMy === "down" ? 1 : 0);

    setUp(nextUp);
    setDown(nextDown);
    setMyValue(nextMy);

    setBusy(true);
    const res = await setReaction({ postId, value: nextMy ?? "none" });
    setBusy(false);

    if (!res.ok) {
      // Revert on failure
      setUp(up);
      setDown(down);
      setMyValue(prev);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Like Button - IG Style */}
      <button
        onClick={() => void apply("up")}
        disabled={busy}
        className={cn(
          "group relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
          "border bg-foreground/5 hover:bg-foreground/10",
          myValue === "up"
            ? "border-king-orange/50 bg-king-orange/10 text-king-orange"
            : "border-foreground/10 text-foreground/70 hover:text-foreground",
          "disabled:opacity-50 disabled:pointer-events-none",
          "active:scale-90"
        )}
      >
        {/* Main Heart Icon with IG-style animation */}
        <motion.div
          animate={myValue === "up" ? {
            scale: [1, 1.3, 0.9, 1.1, 1],
          } : { scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all duration-200",
              myValue === "up" && "fill-king-orange text-king-orange"
            )}
          />
          
          {/* Sparkle overlay when liked */}
          <AnimatePresence>
            {myValue === "up" && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="h-3 w-3 text-sovereign-gold" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <motion.span 
          className="text-sm font-bold tabular-nums"
          animate={showBurst ? { scale: [1, 1.2, 1] } : {}}
        >
          {up}
        </motion.span>
        
        {/* Particle Burst Effect */}
        <AnimatePresence>
          {showBurst && (
            <>
              {[...Array(8)].map((_, i) => (
                <LikeParticle key={i} index={i} />
              ))}
            </>
          )}
        </AnimatePresence>
        
        {/* Floating Hearts */}
        <AnimatePresence>
          {showHearts && (
            <>
              <FloatingHeart delay={0} />
              <FloatingHeart delay={0.1} />
              <FloatingHeart delay={0.2} />
            </>
          )}
        </AnimatePresence>
        
        {/* Ring burst on click */}
        <AnimatePresence>
          {showBurst && (
            <motion.span
              initial={{ opacity: 0.8, scale: 0.8 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full border-2 border-king-orange/60"
            />
          )}
        </AnimatePresence>
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => void apply("down")}
        disabled={busy}
        className={cn(
          "group relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
          "border bg-foreground/5 hover:bg-foreground/10",
          myValue === "down"
            ? "border-red-500/50 bg-red-500/10 text-red-500"
            : "border-foreground/10 text-foreground/70 hover:text-foreground",
          "disabled:opacity-50 disabled:pointer-events-none",
          "active:scale-90"
        )}
      >
        <motion.div
          animate={popDown ? { scale: [1, 1.2, 0.9, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ThumbsDown className="h-5 w-5" />
        </motion.div>
        <span className="text-sm font-bold tabular-nums">{down}</span>
      </button>
    </div>
  );
}
