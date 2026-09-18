import { NextRequest, NextResponse } from "next/server";

const STUDIO =
  process.env.GENLAYER_STUDIO_URL ||
  process.env.NEXT_PUBLIC_STUDIO_RPC ||
  "https://studio-dev.genlayer.com/api";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const res = await fetch(STUDIO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
}
