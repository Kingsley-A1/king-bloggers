"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Loader2,
  Clock,
  TrendingUp,
  ArrowRight,
  Mic,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS - Sovereign Search Bar
// ============================================
// Features:
// - Mobile-first, non-blocking design
// - Inline mode for pages, modal mode for navbar
// - Voice search support (Web Speech API)
// - Recent searches & trending topics
// - Instant search suggestions
// ============================================

// Web Speech API types (not all browsers support this)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

const RECENT_SEARCHES_KEY = "kb_recent_searches";
const MAX_RECENT_SEARCHES = 5;

// Get recent searches from localStorage
function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save search to recent
function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES))
    );
  } catch {
    // Ignore storage errors
  }
}

// Trending topics
const TRENDING_TOPICS = [
  "Technology",
  "Politics",
  "Economics",
  "Religion",
  "Entertainment",
  "Sports",
  "Health",
  "Art & Culture",
];

type SearchBarVariant = "inline" | "modal" | "compact" | "hero";

export type SearchBarProps = {
  /** Display variant - hero is a larger prominent version for landing pages */
  variant?: SearchBarVariant;
  /** Placeholder text */
  placeholder?: string;
  /** Custom class for container */
  className?: string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Show trending topics */
  showTrending?: boolean;
  /** Show recent searches */
  showRecent?: boolean;
  /** Custom search handler (overrides default navigation) */
  onSearch?: (query: string) => void;
  /** For controlled input */
  value?: string;
  /** For controlled input */
  onChange?: (value: string) => void;
};

/**
 * SearchBar - A powerful, reusable search component
 *
 * @example
 * // Inline on a page
 * <SearchBar variant="inline" showTrending showRecent />
 *
 * @example
 * // Compact in header
 * <SearchBar variant="compact" placeholder="Quick search..." />
 *
 * @example
 * // Controlled with custom handler
 * <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} />
 */
export function SearchBar({
  variant = "inline",
  placeholder = "Search articles, topics, creators...",
  className,
  autoFocus = false,
  showTrending = true,
  showRecent = true,
  onSearch,
  value,
  onChange,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // State
  const [internalQuery, setInternalQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [isListening, setIsListening] = React.useState(false);

  // Use controlled or internal state
  const query = value !== undefined ? value : internalQuery;
  const setQuery = onChange || setInternalQuery;

  // Load recent searches
  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Auto focus
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = React.useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setIsSearching(true);
      saveRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());

      if (onSearch) {
        onSearch(trimmed);
        setIsSearching(false);
        setIsFocused(false);
      } else {
        // Navigate to search results
        router.push(`/blog?search=${encodeURIComponent(trimmed)}`);
        setTimeout(() => {
          setIsSearching(false);
          setIsFocused(false);
          setQuery("");
        }, 300);
      }
    },
    [router, onSearch, setQuery]
  );

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(query);
    }
    if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // Voice search (Web Speech API)
  const startVoiceSearch = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      return;
    }

    const SpeechRecognitionConstructor =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition;

    if (!SpeechRecognitionConstructor) return;

    const recognition =
      new SpeechRecognitionConstructor() as SpeechRecognitionInstance;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setQuery(transcript);
        handleSearch(transcript);
      }
    };

    recognition.start();
  };

  // Clear recent
  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Ignore
    }
  };

  // Check voice support
  const hasVoiceSupport =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // Show dropdown
  const showDropdown =
    isFocused && (showTrending || (showRecent && recentSearches.length > 0));

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        variant === "compact" && "max-w-xs",
        className
      )}
    >
      {/* Input Container */}
      <div
        className={cn(
          "relative flex items-center transition-all duration-300",
          variant === "inline" && [
            "rounded-2xl border-2 bg-[#0a0a0a]/80 backdrop-blur-xl",
            isFocused
              ? "border-king-orange/50 shadow-lg shadow-king-orange/10"
              : "border-white/10 hover:border-white/20",
          ],
          variant === "hero" && [
            "rounded-2xl border-2 bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl",
            isFocused
              ? "border-king-orange/60 shadow-king-orange/20"
              : "border-white/15 hover:border-white/25",
          ],
          variant === "compact" && [
            "rounded-xl border bg-foreground/5",
            isFocused
              ? "border-king-orange/50"
              : "border-transparent hover:border-foreground/10",
          ],
          variant === "modal" && [
            "rounded-2xl border-2 border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl",
          ]
        )}
      >
        {/* Search Icon */}
        <div
          className={cn(
            "flex items-center justify-center shrink-0",
            (variant === "inline" || variant === "hero") && "pl-4 pr-2",
            variant === "compact" && "pl-3 pr-2",
            variant === "modal" && "pl-5 pr-3"
          )}
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin text-king-orange" />
          ) : (
            <Search
              className={cn(
                "h-5 w-5 transition-colors",
                isFocused ? "text-king-orange" : "text-foreground/40"
              )}
            />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-foreground/40",
            variant === "inline" && "py-3 text-base",
            variant === "hero" && "py-3 md:py-4 text-base md:text-lg",
            variant === "compact" && "py-2.5 text-sm",
            variant === "modal" && "py-3 text-base"
          )}
          autoComplete="off"
        />

        {/* Action Buttons */}
        <div
          className={cn(
            "flex items-center gap-1 shrink-0",
            (variant === "inline" || variant === "hero") && "pr-3",
            variant === "compact" && "pr-2",
            variant === "modal" && "pr-4"
          )}
        >
          {/* Clear button */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => setQuery("")}
                className="rounded-lg p-2 text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Voice Search */}
          {hasVoiceSupport && variant !== "compact" && (
            <button
              type="button"
              onClick={startVoiceSearch}
              disabled={isListening}
              className={cn(
                "rounded-lg p-2 transition-all",
                isListening
                  ? "bg-red-500/20 text-red-400 animate-pulse"
                  : "text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
              )}
              title="Voice search"
            >
              <Mic size={18} />
            </button>
          )}

          {/* Search Button (inline & hero only) */}
          {(variant === "inline" || variant === "hero") && query.trim() && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              type="button"
              onClick={() => handleSearch(query)}
              disabled={isSearching}
              className="flex items-center gap-2 rounded-xl bg-king-orange px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-king-orange/90 active:scale-95"
            >
              {isSearching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Search
                  <ArrowRight size={14} />
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl",
              variant === "compact" && "rounded-xl"
            )}
          >
            <div className="max-h-80 overflow-y-auto p-2">
              {/* Recent Searches */}
              {showRecent && recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2 text-xs font-medium text-foreground/50">
                      <Clock size={12} />
                      Recent
                    </span>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[10px] text-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      type="button"
                      onClick={() => handleSearch(search)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/5"
                    >
                      <Clock
                        size={14}
                        className="shrink-0 text-foreground/30"
                      />
                      <span className="flex-1 truncate">{search}</span>
                      <ArrowRight
                        size={14}
                        className="shrink-0 text-foreground/30"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Topics */}
              {showTrending && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground/50">
                    <TrendingUp size={12} />
                    Trending Topics
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                    {TRENDING_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleSearch(topic)}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-all hover:border-king-orange/30 hover:bg-king-orange/10 hover:text-king-orange active:scale-95"
                      >
                        <Sparkles size={10} className="text-king-orange/60" />
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
