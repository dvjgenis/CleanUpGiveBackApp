import { NextResponse } from "next/server";
import { reversePlaceName } from "@/lib/place-reverse";

/**
 * Reverse geocode for county-map tract hover names (Photon → Nominatim).
 * Keeps Nominatim User-Agent / CORS on the server.
 *
 * GET /api/place-reverse?lon=...&lat=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lon = Number(searchParams.get("lon"));
  const lat = Number(searchParams.get("lat"));
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return NextResponse.json({ name: null, source: "none" }, { status: 400 });
  }

  try {
    const result = await reversePlaceName(lon, lat);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    console.error("[api/place-reverse] unhandled:", err instanceof Error ? err.message : err);
    return NextResponse.json({ name: null, source: "none" }, { status: 502 });
  }
}
