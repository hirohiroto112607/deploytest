import { formatTime, getGreeting, getIcon, getRandomMessage } from "./messages";

interface BadgeOptions {
	hour: number;
	now?: Date;
}

const fontFamily =
	"Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Noto Color Emoji', 'Apple Color Emoji', sans-serif";

export function generateBadge(options: BadgeOptions): string {
	const { hour, now = new Date() } = options;
	const greeting = getGreeting(hour);
	const icon = getIcon(hour);
	const message = getRandomMessage(hour);
	const time = formatTime(now);

	const width = 600;
	const height = 160;
	const messageMaxChars = 24;
	const messageLines = clampLines(
		wrapTextByChar(message, messageMaxChars),
		2,
		messageMaxChars,
	);
	const messageX = 32;
	const messageStartY = 98;
	const messageLineHeight = 24;
	const messageText = messageLines
		.map((line, index) => {
			const y = messageStartY + index * messageLineHeight;
			return `<text x="${messageX}" y="${y}" font-size="18" fill="rgba(255, 255, 255, 0.9)" font-family="${fontFamily}">${escapeXml(line)}</text>`;
		})
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Greeting badge">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#9333ea" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <text x="32" y="82" font-size="48" font-weight="700" font-family="${fontFamily}">${escapeXml(icon)}</text>
  <text x="100" y="62" font-size="40" font-weight="700" fill="white" font-family="${fontFamily}">${escapeXml(
		greeting,
	)}</text>
  ${messageText}
  <text x="32" y="146" font-size="16" fill="rgba(255, 255, 255, 0.7)" font-family="${fontFamily}">${escapeXml(
		`${time} (JST)`,
	)}</text>
</svg>`;
}

// SVG text does not auto-wrap; approximate by character count.
function wrapTextByChar(text: string, maxCharsPerLine: number): string[] {
	if (maxCharsPerLine <= 0) {
		return [text];
	}

	const lines: string[] = [];
	let currentLine = "";

	for (const char of Array.from(text)) {
		if (currentLine.length >= maxCharsPerLine) {
			lines.push(currentLine);
			currentLine = "";
		}
		currentLine += char;
	}

	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	return lines.length > 0 ? lines : [""];
}

function clampLines(
	lines: string[],
	maxLines: number,
	maxCharsPerLine: number,
): string[] {
	if (maxLines <= 0) {
		return [""];
	}
	if (lines.length <= maxLines) {
		return lines;
	}

	const trimmed = lines.slice(0, maxLines);
	const ellipsis = "...";
	const lastIndex = maxLines - 1;
	const lastLine = trimmed[lastIndex] ?? "";
	const allowedLength = Math.max(0, maxCharsPerLine - ellipsis.length);
	trimmed[lastIndex] =
		lastLine.length > allowedLength
			? `${lastLine.slice(0, allowedLength)}${ellipsis}`
			: `${lastLine}${ellipsis}`;
	return trimmed;
}

function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
