import { generateBadge } from '@/lib/badge';

export function GET() {
  try {
    const jstDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
    );
    const hour = jstDate.getHours();

    const svg = generateBadge({ hour, now: jstDate });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating badge:', error);
    return new Response('Error generating badge', { status: 500 });
  }
}
