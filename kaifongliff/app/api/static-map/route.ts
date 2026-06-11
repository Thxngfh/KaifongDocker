import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const center = url.searchParams.get('center') ?? '13.8735,100.5756';
  const zoom = url.searchParams.get('zoom') ?? '14';
  const size = url.searchParams.get('size') ?? '600x400';

  const key = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Missing Google Maps API key' }, { status: 500 });
  }

  const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
    center,
  )}&zoom=${encodeURIComponent(zoom)}&size=${encodeURIComponent(size)}&key=${encodeURIComponent(key)}`;

  const res = await fetch(googleUrl);
  if (!res.ok) {
    return NextResponse.json({ error: 'Google Maps fetch failed' }, { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? 'image/png';

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
    },
  });
}
