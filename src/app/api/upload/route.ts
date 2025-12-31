import { NextResponse } from "next/server";

import { createPresignedPutUrl, publicUrlForR2Key } from "../../../lib/r2";

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    fileName?: string;
    contentType?: string;
  } | null;

  const fileName = body?.fileName;
  const contentType = body?.contentType;

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "fileName and contentType are required" },
      { status: 400 }
    );
  }

  const key = `uploads/${Date.now()}-${safeFileName(fileName)}`;
  const { uploadUrl } = await createPresignedPutUrl({ key, contentType });
  const publicUrl = publicUrlForR2Key(key);

  return NextResponse.json({ uploadUrl, key, publicUrl });
}
