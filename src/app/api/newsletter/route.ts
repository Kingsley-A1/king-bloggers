import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "../../../db";
import { newsletterSubscribers } from "../../../db/schema";

const payloadSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch (error) {
    void error;
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid email." },
      { status: 400 }
    );
  }

  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email.toLowerCase() })
    .onConflictDoNothing({ target: newsletterSubscribers.email });

  return NextResponse.json({ ok: true });
}
