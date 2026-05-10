import { generateBadge } from '@/lib/badge';

export async function GET(request: Request) {
  try {
    const jstDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
    );
    const hour = jstDate.getHours();

    const imageBuffer = await generateBadge({ hour });

    return new Response(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/png',
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
