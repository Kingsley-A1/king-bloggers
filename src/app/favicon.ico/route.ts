import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Reuse the existing PNG icon as the favicon payload.
    // This avoids Workbox '/favicon.ico' no-response errors even when no ICO file exists.
    const iconPath = path.join(process.cwd(), "public", "icons", "icon.png");
    const bytes = await readFile(iconPath);

    return new Response(bytes, {
      status: 200,
      headers: {
        // Browsers accept PNG favicons; the path is still /favicon.ico.
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
}
