import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createPresignedPutUrl, publicUrlForR2Key, uploadToR2Direct } from "@/lib/r2";

// ===============    =============================
// 👑 KING BLOGGERS - Secure Upload API
// ============================================
// SEC-002: ✅ Authentication required
// SEC-010: ✅ File type validation
// SEC-011: ✅ File size limits enforced
// ============================================

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// POST: Get presigned URL for client-side upload
export async function POST(req: Request) {
  // SEC-002: Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to upload files." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    fileName?: string;
    contentType?: string;
    fileSize?: number;
  } | null;

  const fileName = body?.fileName;
  const contentType = body?.contentType;
  const fileSize = body?.fileSize;

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "fileName and contentType are required" },
      { status: 400 }
    );
  }

  // SEC-010: Validate file type
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid file type. Only images and videos are allowed." },
      { status: 400 }
    );
  }

  // SEC-011: Validate file size if provided
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 50MB." },
      { status: 400 }
    );
  }

  const key = `uploads/${session.user.id}/${Date.now()}-${safeFileName(
    fileName
  )}`;
  const { uploadUrl } = await createPresignedPutUrl({ key, contentType });
  const publicUrl = publicUrlForR2Key(key);

  return NextResponse.json({ uploadUrl, key, publicUrl });
}

// PUT: Server-side upload proxy (fallback for CORS issues)
export async function PUT(req: NextRequest) {
  // SEC-002: Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to upload files." },
      { status: 401 }
    );
  }

  try {
    // Handle FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileName = (formData.get("fileName") as string) || `file-${Date.now()}`;
    const contentType = (formData.get("contentType") as string) || "application/octet-stream";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    // SEC-010: Validate file type
    const mimeType = contentType.split(";")[0].trim();
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${mimeType}. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Get file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // SEC-011: Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const key = `uploads/${session.user.id}/${Date.now()}-${safeFileName(fileName)}`;

    await uploadToR2Direct({ key, contentType: mimeType, body: buffer });
    const publicUrl = publicUrlForR2Key(key);
    return NextResponse.json({ key, publicUrl });
  } catch (error) {
    console.error("R2 upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
