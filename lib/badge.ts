export type ThemePreset = "default" | "neon" | "minimal" | "retro";

export interface BadgeOptions {
	greeting: string;
	icon: string;
	message: string;
	time: string;
	date: string;
	profileLine?: string;
	activityLine?: string;
	eventLine?: string;
	modeLine?: string;
	seasonalLine?: string;
	theme?: ThemePreset;
	fontFamily?: string;
	radius?: number;
	padding?: number;
}

interface ThemeStyle {
	startColor: string;
	endColor: string;
	textColor: string;
	subtleTextColor: string;
	lineColor: string;
}

const baseFontFamily =
	"Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Noto Color Emoji', 'Apple Color Emoji', sans-serif";

const themeStyles: Record<ThemePreset, ThemeStyle> = {
	default: {
		startColor: "#3b82f6",
		endColor: "#9333ea",
		textColor: "#ffffff",
		subtleTextColor: "rgba(255, 255, 255, 0.76)",
		lineColor: "rgba(255, 255, 255, 0.2)",
	},
	neon: {
		startColor: "#0f172a",
		endColor: "#7e22ce",
		textColor: "#a7f3d0",
		subtleTextColor: "rgba(167, 243, 208, 0.8)",
		lineColor: "rgba(167, 243, 208, 0.26)",
	},
	minimal: {
		startColor: "#f8fafc",
		endColor: "#e2e8f0",
		textColor: "#0f172a",
		subtleTextColor: "rgba(15, 23, 42, 0.72)",
		lineColor: "rgba(15, 23, 42, 0.18)",
	},
	retro: {
		startColor: "#7c3aed",
		endColor: "#f97316",
		textColor: "#fff7ed",
		subtleTextColor: "rgba(255, 247, 237, 0.8)",
		lineColor: "rgba(255, 247, 237, 0.22)",
	},
};

export function generateBadge(options: BadgeOptions): string {
	const {
		greeting,
		icon,
		message,
		time,
		date,
		profileLine,
		activityLine,
		eventLine,
		modeLine,
		seasonalLine,
		theme = "default",
		fontFamily = baseFontFamily,
		radius = 16,
		padding = 28,
	} = options;

	const palette = themeStyles[theme];
	const width = 900;
	const height = 220;
	const safeRadius = clamp(radius, 0, 28);
	const safePadding = clamp(padding, 20, 48);
	const messageMaxChars = 42;
	const messageLines = clampLines(wrapTextByChar(message, messageMaxChars), 2, messageMaxChars);
	const infoLines = [profileLine, activityLine, eventLine, modeLine, seasonalLine].filter(Boolean);

	const messageText = messageLines
		.map((line, index) => {
			const y = 108 + index * 24;
			return `<text x="${safePadding}" y="${y}" font-size="18" fill="${palette.textColor}" font-family="${escapeXml(fontFamily)}">${escapeXml(line)}</text>`;
		})
		.join("");

	const extraInfo = infoLines
		.map((line, index) => {
			const y = 162 + index * 18;
			return `<text x="${safePadding}" y="${y}" font-size="14" fill="${palette.subtleTextColor}" font-family="${escapeXml(fontFamily)}">${escapeXml(line ?? "")}</text>`;
		})
		.join("");

	const footerY = height - 18;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Greeting badge">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.startColor}">
        <animate attributeName="stop-color" values="${palette.startColor};${palette.endColor};${palette.startColor}" dur="10s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" stop-color="${palette.endColor}">
        <animate attributeName="stop-color" values="${palette.endColor};${palette.startColor};${palette.endColor}" dur="10s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="${safeRadius}" ry="${safeRadius}" fill="url(#bg)" />
  <line x1="${safePadding}" y1="72" x2="${width - safePadding}" y2="72" stroke="${palette.lineColor}" />
  <text x="${safePadding}" y="58" font-size="44" font-weight="700" font-family="${escapeXml(fontFamily)}">
    ${escapeXml(icon)}
    <animate attributeName="opacity" values="1;0.82;1" dur="2.5s" repeatCount="indefinite"/>
  </text>
  <text x="${safePadding + 74}" y="55" font-size="36" font-weight="700" fill="${palette.textColor}" font-family="${escapeXml(fontFamily)}">${escapeXml(greeting)}</text>
  ${messageText}
  ${extraInfo}
  <text x="${safePadding}" y="${footerY}" font-size="15" fill="${palette.subtleTextColor}" font-family="${escapeXml(fontFamily)}">${escapeXml(`${time} (JST)`)}</text>
  <text x="${width - safePadding}" y="${footerY}" font-size="15" fill="${palette.subtleTextColor}" text-anchor="end" font-family="${escapeXml(fontFamily)}">${escapeXml(date)}</text>
</svg>`;
}

export function generateFallbackBadge(message = "Badge unavailable"): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="620" height="120" viewBox="0 0 620 120" role="img" aria-label="Fallback badge">
  <rect width="620" height="120" fill="#111827" rx="14" ry="14" />
  <text x="28" y="54" font-size="28" fill="#f9fafb" font-family="Arial, sans-serif">⚠️ Greeting Badge</text>
  <text x="28" y="88" font-size="18" fill="#9ca3af" font-family="Arial, sans-serif">${escapeXml(message)}</text>
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

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
