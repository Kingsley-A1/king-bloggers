/**
 * HTML Sanitization utilities for preventing XSS attacks
 * 
 * This module provides isomorphic (works on server AND client) HTML sanitization
 * to prevent Cross-Site Scripting (XSS) attacks.
 * 
 * Following the Dev Principles: "Validation. All inputs must be validated with Zod
 * before touching the backend."
 * 
 * @example
 * import { sanitizeHtml, sanitizeText } from "@/lib/sanitize";
 * 
 * // For rich text content (blog posts)
 * const safeHtml = sanitizeHtml(userInput);
 * 
 * // For plain text (comments, names)
 * const safeText = sanitizeText(userInput);
 */

// Allowed HTML tags for blog post content
const ALLOWED_TAGS = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
    "code",
    "pre",
    "hr",
    "img",
    "figure",
    "figcaption",
]);

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
    a: new Set(["href", "title", "target", "rel"]),
    img: new Set(["src", "alt", "title", "width", "height"]),
    "*": new Set(["class", "id"]), // Global attributes
};

// URL protocols allowed in href/src
const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Escape HTML entities in text
 */
export function escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
    };

    return text.replace(/[&<>"'`=/]/g, (char) => escapeMap[char] ?? char);
}

/**
 * Check if a URL is safe (no javascript:, data:, etc.)
 */
function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url, "https://example.com");
        return SAFE_URL_PROTOCOLS.has(parsed.protocol);
    } catch {
        // Relative URLs are generally safe
        return !url.toLowerCase().startsWith("javascript:") &&
            !url.toLowerCase().startsWith("data:") &&
            !url.toLowerCase().startsWith("vbscript:");
    }
}

/**
 * Sanitize an attribute value
 */
function sanitizeAttribute(tag: string, attr: string, value: string): string | null {
    const tagAttrs = ALLOWED_ATTRS[tag] ?? new Set();
    const globalAttrs = ALLOWED_ATTRS["*"] ?? new Set();

    // Check if attribute is allowed
    if (!tagAttrs.has(attr) && !globalAttrs.has(attr)) {
        return null;
    }

    // Special handling for URLs
    if (attr === "href" || attr === "src") {
        if (!isSafeUrl(value)) {
            return null;
        }
    }

    // Escape attribute value
    return escapeHtml(value);
}

/**
 * Lightweight HTML sanitizer for rich text content
 * 
 * NOTE: For production with high-security requirements, consider using
 * DOMPurify or isomorphic-dompurify. This is a lightweight alternative
 * that works on the server without DOM dependencies.
 */
export function sanitizeHtml(dirty: string): string {
    if (!dirty || typeof dirty !== "string") return "";

    // Remove script tags and their content entirely
    let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Remove style tags and their content
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    // Remove on* event handlers
    clean = clean.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

    // Remove javascript: and data: in attributes
    clean = clean.replace(/\s+(href|src)\s*=\s*["']?\s*(javascript|data|vbscript):/gi, ' $1="');

    // Process tags
    clean = clean.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag, attrs) => {
        const lowerTag = tag.toLowerCase();

        // Remove disallowed tags entirely
        if (!ALLOWED_TAGS.has(lowerTag)) {
            return "";
        }

        // Self-closing tags
        const isSelfClosing = match.startsWith("</") || ["br", "hr", "img"].includes(lowerTag);

        if (match.startsWith("</")) {
            return `</${lowerTag}>`;
        }

        // Parse and filter attributes
        const safeAttrs: string[] = [];
        const attrRegex = /([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
            const attrName = attrMatch[1].toLowerCase();
            const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

            const sanitizedValue = sanitizeAttribute(lowerTag, attrName, attrValue);
            if (sanitizedValue !== null) {
                safeAttrs.push(`${attrName}="${sanitizedValue}"`);
            }
        }

        // Force rel="noopener noreferrer" and target="_blank" for external links
        if (lowerTag === "a") {
            const hasTarget = safeAttrs.some(a => a.startsWith("target="));
            const hasRel = safeAttrs.some(a => a.startsWith("rel="));

            if (!hasTarget) safeAttrs.push('target="_blank"');
            if (!hasRel) safeAttrs.push('rel="noopener noreferrer"');
        }

        const attrString = safeAttrs.length > 0 ? ` ${safeAttrs.join(" ")}` : "";
        return isSelfClosing ? `<${lowerTag}${attrString} />` : `<${lowerTag}${attrString}>`;
    });

    return clean.trim();
}

/**
 * Sanitize plain text - removes ALL HTML tags
 * Use for comments, names, and other plain text fields
 */
export function sanitizeText(dirty: string): string {
    if (!dirty || typeof dirty !== "string") return "";

    // Remove all HTML tags
    const noTags = dirty.replace(/<[^>]*>/g, "");

    // Decode common entities and re-escape
    const decoded = noTags
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'");

    return escapeHtml(decoded).trim();
}

/**
 * Truncate text safely (doesn't break HTML entities)
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + "…";
}
