"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Loader2, Clock, TrendingUp } from "lucide-react";

// Storage key for recent searches
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
    const recent = getRecentSearches().filter(s => s !== query);
    recent.unshift(query);
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES))
    );
  } catch {
    // Ignore storage errors
  }
}

// Trending/suggested searches
const TRENDING_SEARCHES = [
  "Technology",
  "Politics",
  "Economics",
  "Religion",
  "Entertainment",
  "Sports",
  "Health",
];

/**
 * NavSearch – Global Search Trigger & Modal
 * 
 * Features:
 * - Non-blocking search icon in navbar
 * - Full-screen modal on activation
 * - Keyboard shortcut (Cmd/Ctrl + K)
 * - Recent searches & trending topics
 * - Mobile-first responsive design
 */
export function NavSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsSearching(true);
    saveRecentSearch(trimmed);
    setRecentSearches(getRecentSearches());

    // Navigate to search results
    router.push(`/blog?search=${encodeURIComponent(trimmed)}`);
    
    setTimeout(() => {
      setIsSearching(false);
      setIsOpen(false);
      setQuery("");
    }, 300);
  }, [router]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(query);
    }
  };

  // Clear recent searches
  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Ignore
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full p-2 text-foreground/60 transition-all hover:bg-foreground/10 hover:text-foreground active:scale-95"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="h-5 w-5" />
        {/* Keyboard hint - desktop only */}
        <span className="hidden lg:flex items-center gap-1 text-[10px] text-foreground/40">
          <kbd className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono">⌘K</kbd>
        </span>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="mx-auto mt-20 w-[calc(100%-2rem)] max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 border-b border-white/5 p-4">
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-orange-400" />
                  ) : (
                    <Search className="h-5 w-5 shrink-0 text-white/40" />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search articles, topics, creators..."
                    className="flex-1 bg-transparent text-base text-white placeholder-white/40 outline-none md:text-lg"
                    autoComplete="off"
                    autoFocus
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSearch(query)}
                    disabled={!query.trim()}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      query.trim()
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    Search
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="border-b border-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Clock size={12} />
                        <span>Recent Searches</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearRecent}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSearch(search)}
                          className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                        >
                          <Clock size={12} className="text-white/30" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Topics */}
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                    <TrendingUp size={12} />
                    <span>Trending Topics</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSearch(topic)}
                        className="rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-3 py-2 text-sm text-orange-300/80 transition-all hover:from-orange-500/20 hover:to-amber-500/20 hover:text-orange-300 active:scale-95"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keyboard Hint */}
                <div className="border-t border-white/5 bg-white/5 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-white/30">
                    <span>
                      <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Enter</kbd> to search
                    </span>
                    <span>
                      <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Esc</kbd> to close
                    </span>
                    <span>
                      <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⌘K</kbd> to open
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NavSearch;
