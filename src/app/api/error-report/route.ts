import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";

const errorReportSchema = z.object({
  kind: z.enum(["error", "slow", "manual"]).default("manual"),
  message: z.string().trim().min(4).max(4000),
  url: z.string().trim().min(1).max(2000),
  screenshotUrl: z.string().trim().url().optional(),
  userAgent: z.string().trim().max(1000).optional(),
  errorName: z.string().trim().max(200).optional(),
  errorMessage: z.string().trim().max(2000).optional(),
  errorStack: z.string().trim().max(8000).optional(),
  clientTimeIso: z.string().trim().max(40).optional(),
});

export async function POST(req: Request) {
  const session = await auth();

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = errorReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const reportId = crypto.randomUUID();
  const data = parsed.data;

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: (session.user as { role?: string }).role ?? null,
      }
    : null;

  // Backend receipt: store wherever you want later (DB, S3, email). For now:
  console.error("[KB_ERROR_REPORT]", {
    reportId,
    receivedAt: new Date().toISOString(),
    user,
    ...data,
  });

  return NextResponse.json({ ok: true, reportId });
}
