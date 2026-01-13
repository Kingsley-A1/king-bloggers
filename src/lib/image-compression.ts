// ============================================
// 👑 KING BLOGGERS - Image Compression Utility
// ============================================
// Client-side image compression for faster uploads
// and optimized social sharing
// ============================================

export interface CompressionOptions {
  /** Target max width in pixels */
  maxWidth?: number;
  /** Target max height in pixels */
  maxHeight?: number;
  /** Quality 0-1 (default 0.8) */
  quality?: number;
  /** Output format: 'image/jpeg' | 'image/webp' | 'image/png' */
  format?: "image/jpeg" | "image/webp" | "image/png";
  /** Max file size in bytes (will reduce quality to meet this) */
  maxFileSizeBytes?: number;
}

export interface CompressionResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file/blob with smart quality reduction
 * to meet file size targets while maintaining visual quality
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = "image/webp",
    maxFileSizeBytes,
  } = options;

  const originalSize = file.size;

  // Create image element
  const img = await loadImage(file);

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = img;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob with target quality
  let blob = await canvasToBlob(canvas, format, quality);

  // If max file size specified, iteratively reduce quality
  if (maxFileSizeBytes && blob.size > maxFileSizeBytes) {
    let currentQuality = quality;

    while (blob.size > maxFileSizeBytes && currentQuality > 0.1) {
      currentQuality -= 0.1;
      blob = await canvasToBlob(canvas, format, currentQuality);
    }
  }

  return {
    blob,
    width,
    height,
    originalSize,
    compressedSize: blob.size,
    compressionRatio: originalSize / blob.size,
  };
}

/**
 * Generate optimized social sharing image (1200x630 for OG)
 */
export async function generateSocialImage(file: File | Blob): Promise<Blob> {
  const result = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 630,
    quality: 0.9,
    format: "image/jpeg", // Better compatibility for social platforms
    maxFileSizeBytes: 500 * 1024, // 500KB max for social sharing
  });

  return result.blob;
}

/**
 * Compress image for inline content (blog body)
 */
export async function compressContentImage(file: File | Blob): Promise<Blob> {
  const result = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 0.8,
    format: "image/webp",
    maxFileSizeBytes: 300 * 1024, // 300KB for content images
  });

  return result.blob;
}

/**
 * Compress thumbnail image
 */
export async function compressThumbnail(file: File | Blob): Promise<Blob> {
  const result = await compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.75,
    format: "image/webp",
    maxFileSizeBytes: 50 * 1024, // 50KB for thumbnails
  });

  return result.blob;
}

/**
 * Load image from File/Blob
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert canvas to Blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}
