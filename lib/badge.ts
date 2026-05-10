import { createCanvas } from 'canvas';
import { getGreeting, getIcon, getRandomMessage, formatTime } from './messages';

interface BadgeOptions {
  hour: number;
}

export async function generateBadge(options: BadgeOptions) {
  const { hour } = options;
  const greeting = getGreeting(hour);
  const icon = getIcon(hour);
  const message = getRandomMessage(hour);
  const now = new Date();
  const time = formatTime(now);

  // キャンバスを作成
  const width = 600;
  const height = 160;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // グラデーション背景を描画
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#9333ea');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // アイコンを描画
  ctx.font = 'bold 48px Arial';
  ctx.fillText(icon, 32, 100);

  // 挨拶テキストを描画
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(greeting, 100, 70);

  // メッセージを描画
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  const messageLines = wrapText(message, ctx, width - 100, 18 * 1.5);
  let yPos = 95;
  messageLines.forEach((line) => {
    ctx.fillText(line, 32, yPos);
    yPos += 18 * 1.5;
  });

  // 時刻を描画
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(`${time} (JST)`, 32, 150);

  // PNG として出力
  const buffer = canvas.toBuffer('image/png');
  return buffer;
}

function wrapText(
  text: string,
  ctx: any,
  maxWidth: number,
  lineHeight: number
): string[] {
  const lines: string[] = [];
  let currentLine = '';

  const words = text.split('');
  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}
