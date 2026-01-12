"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Twitter,
} from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";
import Image from "next/image";

// Storage key for tracking if the user dismissed the modal
const DISMISSED_KEY = "kb_exit_share_dismissed";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Check if user has recently dismissed
function hasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) return false;
    const timestamp = parseInt(dismissed, 10);
    return Date.now() - timestamp < DISMISS_DURATION;
  } catch {
    return false;
  }
}

// Mark as dismissed
function markDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * ExitShareModal – A Sovereign Exit-Intent Share Modal
 *
 * Appears when user is about to leave (mouse near top of viewport)
 * or when they switch tabs. Encourages sharing the platform.
 *
 * Design: Compact, scrollable, glass morphism styling
 */
export function ExitShareModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://kingbloggers.com";
  const shareTitle = "King Bloggers – The Sovereign Blogging Platform";
  const shareText =
    "Discover intelligent content from verified creators on King Bloggers. Join the movement!";

  // Close modal handler
  const closeModal = useCallback(() => {
    setIsOpen(false);
    markDismissed();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  // Exit intent detection
  useEffect(() => {
    if (hasRecentlyDismissed() || hasTriggered) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves to top of viewport (exit intent)
      if (e.clientY < 10 && !hasTriggered) {
        setIsOpen(true);
        setHasTriggered(true);
      }
    };

    // Also trigger on visibility change (switching tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !hasTriggered) {
        // Don't show immediately, but mark for next visit
        setHasTriggered(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasTriggered]);

  // Share handlers
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        closeModal();
      } catch {
        // User cancelled or error
      }
    }
  };

  const handleCopyLink = async () => {
    const success = await copyTextToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `${shareTitle}\n\n${shareText}\n\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop + Centering Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
            onClick={closeModal}
            aria-hidden="true"
          >
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="exit-share-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glass Card - Scrollable Content */}
              <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a0a]/95 via-[#111]/95 to-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl">
                {/* Close Button - Always visible */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white active:scale-95"
                  aria-label="Close share modal"
                >
                  <X size={18} />
                </button>

                {/* Content */}
                <div className="p-5">
                  {/* Header */}
                  <div className="mb-4 pr-8">
                    <h2
                      id="exit-share-title"
                      className="text-xl font-bold text-white"
                    >
                      Leaving so soon?
                    </h2>
                    <p className="mt-1 text-sm text-white/60">
                      Share King Bloggers with your friends and support
                      independent creators!
                    </p>
                  </div>

                  {/* OG Image Preview - Compact */}
                  <div className="relative mb-5 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <div className="aspect-[2/1] relative">
                      <Image
                        src="/icons/og.png"
                        alt="King Bloggers Preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-medium text-white/90">
                          king-bloggers.vercel.app
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Share Buttons Grid */}
                  <div className="mb-4 grid grid-cols-4 gap-2">
                    {/* Native Share (mobile) - only show if Web Share API is available */}
                    {typeof navigator !== "undefined" &&
                      typeof navigator.share === "function" && (
                        <button
                          type="button"
                          onClick={handleNativeShare}
                          className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 p-3 transition-all hover:from-orange-500/30 hover:to-amber-500/30 active:scale-95"
                        >
                          <Share2 size={20} className="text-orange-400" />
                          <span className="text-[10px] font-medium text-white/70">
                            Share
                          </span>
                        </button>
                      )}

                    {/* Twitter/X */}
                    <button
                      type="button"
                      onClick={handleTwitterShare}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10 active:scale-95"
                    >
                      <Twitter size={20} className="text-sky-400" />
                      <span className="text-[10px] font-medium text-white/70">
                        Twitter
                      </span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10 active:scale-95"
                    >
                      <MessageCircle size={20} className="text-green-400" />
                      <span className="text-[10px] font-medium text-white/70">
                        WhatsApp
                      </span>
                    </button>

                    {/* Telegram */}
                    <button
                      type="button"
                      onClick={handleTelegramShare}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10 active:scale-95"
                    >
                      <Send size={20} className="text-blue-400" />
                      <span className="text-[10px] font-medium text-white/70">
                        Telegram
                      </span>
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={handleFacebookShare}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10 active:scale-95"
                    >
                      <svg
                        className="h-5 w-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span className="text-[10px] font-medium text-white/70">
                        Facebook
                      </span>
                    </button>
                  </div>

                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-green-400" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="text-white/60" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* Dismiss Text */}
                  <p className="mt-4 text-center text-xs text-white/40">
                    Press{" "}
                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                      Esc
                    </kbd>{" "}
                    or click outside to close
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ExitShareModal;
