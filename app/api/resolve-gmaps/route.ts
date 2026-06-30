import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });

  try {
    // Follow redirects server-side (no CORS issue)
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });

    const finalUrl = response.url;
    return NextResponse.json({ finalUrl });
  } catch (err) {
    return NextResponse.json({ error: "Failed to resolve URL" }, { status: 500 });
  }
}
