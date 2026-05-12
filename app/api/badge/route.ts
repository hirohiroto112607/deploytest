import { chooseVariant } from "@/lib/ab";
import { generateBadge, generateFallbackBadge, type ThemePreset } from "@/lib/badge";
import {
	fetchGitHubActivity,
	fetchGitHubProfile,
	isPublicHoliday,
	type SpecialEventType,
} from "@/lib/insights";
import {
	detectLanguage,
	formatDate,
	formatTime,
	getGreeting,
	getIcon,
	getMessageCandidates,
	getModeLabel,
	resolveContextMode,
	selectMessageByVariant,
} from "@/lib/messages";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const headers: Record<string, string> = {
		"Content-Type": "image/svg+xml; charset=utf-8",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		Pragma: "no-cache",
		Expires: "0",
	};

	try {
		const jstDate = getJstDate();
		const hour = jstDate.getHours();
		const searchParams = request.nextUrl.searchParams;

		const username = sanitizeUsername(searchParams.get("username"));
		const theme = parseTheme(searchParams.get("theme"));
		const fontFamily = sanitizeFont(searchParams.get("font"));
		const radius = parseNumber(searchParams.get("radius"), 0, 28);
		const padding = parseNumber(searchParams.get("padding"), 20, 48);
		const language = detectLanguage(
			searchParams.get("lang"),
			request.headers.get("accept-language"),
		);
		const mode = resolveContextMode(jstDate, searchParams.get("mode"));

		const country =
			sanitizeCountry(searchParams.get("country")) ??
			detectCountryFromAcceptLanguage(request.headers.get("accept-language"));
		const birthday = sanitizeBirthday(searchParams.get("birthday"));
		const isBirthday = isBirthdayToday(jstDate, birthday);

		const [profile, activity, holiday] = await Promise.all([
			fetchGitHubProfile(username),
			fetchGitHubActivity(username),
			isPublicHoliday(jstDate, country),
		]);

		const forcedEvent = parseEventType(searchParams.get("event"));
		const eventType = forcedEvent ?? activity?.latestEvent?.type;
		const eventLine = buildEventLine(
			eventType,
			activity?.latestEvent?.title,
			language,
		);
		const seasonalLine = buildSeasonalLine(language, holiday || isBirthday, isBirthday);
		const activityLine =
			username && activity
				? buildActivityLine(language, activity.recentCommitCount, activity.streakDays)
				: undefined;
		const profileLine =
			username && profile
				? buildProfileLine(profile.name, profile.login, profile.bio ?? "", language)
				: undefined;
		const greeting = getGreeting(hour, language);
		const icon = getIcon(hour);
		const modeLine = getModeLabel(mode, language);

		const experimentKey = [language, mode, eventType ?? "none", hour < 12 ? "am" : "pm"].join(
			":",
		);
		const userKey = username ?? request.headers.get("x-forwarded-for") ?? "anonymous";
		const variant = chooseVariant(experimentKey, userKey);
		const message = selectMessageByVariant(
			getMessageCandidates(hour, language, mode),
			variant,
		);

		const svg = generateBadge({
			greeting,
			icon,
			message,
			time: formatTime(jstDate),
			date: formatDate(jstDate, language),
			profileLine,
			activityLine,
			eventLine,
			modeLine,
			seasonalLine,
			theme,
			fontFamily,
			radius,
			padding,
		});

		headers["X-Badge-Status"] = "ok";
		headers["X-Badge-Variant"] = variant;
		return new Response(svg, { headers });
	} catch (error) {
		console.error("Error generating badge:", error);
		headers["X-Badge-Status"] = "fallback";
		return new Response(generateFallbackBadge("Temporarily in safe mode"), {
			status: 200,
			headers,
		});
	}
}

function getJstDate(): Date {
	return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function parseTheme(themeParam: string | null): ThemePreset {
	if (themeParam === "default" || themeParam === "neon" || themeParam === "minimal" || themeParam === "retro") {
		return themeParam;
	}
	return "default";
}

function parseNumber(
	value: string | null,
	min: number,
	max: number,
): number | undefined {
	if (!value) {
		return undefined;
	}
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return undefined;
	}
	return Math.max(min, Math.min(max, Math.round(parsed)));
}

function sanitizeUsername(value: string | null): string | undefined {
	if (!value) {
		return undefined;
	}
	return /^[a-zA-Z0-9-]{1,39}$/.test(value) ? value : undefined;
}

function sanitizeCountry(value: string | null): string | undefined {
	if (!value) {
		return undefined;
	}
	const normalized = value.toUpperCase();
	return /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
}

function sanitizeBirthday(value: string | null): string | undefined {
	if (!value) {
		return undefined;
	}
	return /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(value) ? value : undefined;
}

function isBirthdayToday(date: Date, birthday: string | undefined): boolean {
	if (!birthday) {
		return false;
	}
	const today = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	return birthday === today;
}

function sanitizeFont(value: string | null): string | undefined {
	if (!value || value.length > 120) {
		return undefined;
	}
	return /^[\w\s\-,'"()]+$/.test(value) ? value : undefined;
}

function parseEventType(value: string | null): SpecialEventType | undefined {
	if (value === "release" || value === "issue" || value === "pr") {
		return value;
	}
	return undefined;
}

function detectCountryFromAcceptLanguage(acceptLanguage: string | null): string {
	if (!acceptLanguage) {
		return "US";
	}
	const primary = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
	const region = primary.split("-")[1]?.toUpperCase();
	if (region && /^[A-Z]{2}$/.test(region)) {
		return region;
	}
	if (primary.startsWith("zh-tw")) {
		return "TW";
	}
	if (primary.startsWith("zh-hk")) {
		return "HK";
	}
	if (primary.startsWith("zh-cn")) {
		return "CN";
	}
	if (primary.startsWith("ja")) {
		return "JP";
	}
	if (primary.startsWith("zh")) {
		return "CN";
	}
	return "US";
}

function buildProfileLine(
	name: string | null,
	login: string,
	bio: string,
	language: "ja" | "en" | "zh",
): string {
	const displayName = name ? `${name} (@${login})` : `@${login}`;
	if (!bio) {
		return displayName;
	}
	const prefix = language === "ja" ? "プロフィール" : language === "zh" ? "简介" : "Profile";
	return `${prefix}: ${displayName} — ${truncate(bio, 42)}`;
}

function buildActivityLine(
	language: "ja" | "en" | "zh",
	commitCount: number,
	streakDays: number,
): string {
	if (language === "ja") {
		return `直近7日: ${commitCount} commits / 連続活動: ${streakDays}日`;
	}
	if (language === "zh") {
		return `近7天: ${commitCount} commits / 连续活跃: ${streakDays}天`;
	}
	return `Last 7 days: ${commitCount} commits / Streak: ${streakDays} days`;
}

function buildEventLine(
	eventType: SpecialEventType | undefined,
	title: string | undefined,
	language: "ja" | "en" | "zh",
): string | undefined {
	if (!eventType) {
		return undefined;
	}
	const safeTitle = title ? truncate(title, 40) : undefined;
	if (eventType === "release") {
		if (language === "ja") {
			return `🎉 リリース公開: ${safeTitle ?? "最新リリース"}`;
		}
		if (language === "zh") {
			return `🎉 已发布版本: ${safeTitle ?? "最新发布"}`;
		}
		return `🎉 Release published: ${safeTitle ?? "latest release"}`;
	}
	if (eventType === "issue") {
		if (language === "ja") {
			return `✅ Issue完了: ${safeTitle ?? "Issue closed"}`;
		}
		if (language === "zh") {
			return `✅ Issue 已关闭: ${safeTitle ?? "Issue closed"}`;
		}
		return `✅ Issue completed: ${safeTitle ?? "issue closed"}`;
	}
	if (language === "ja") {
		return `🚀 PRマージ: ${safeTitle ?? "Pull request merged"}`;
	}
	if (language === "zh") {
		return `🚀 PR 已合并: ${safeTitle ?? "PR merged"}`;
	}
	return `🚀 PR merged: ${safeTitle ?? "pull request merged"}`;
}

function buildSeasonalLine(
	language: "ja" | "en" | "zh",
	isSpecialDay: boolean,
	isBirthday: boolean,
): string | undefined {
	if (!isSpecialDay) {
		return undefined;
	}
	if (isBirthday) {
		if (language === "ja") {
			return "🎂 お誕生日おめでとうございます！";
		}
		if (language === "zh") {
			return "🎂 生日快乐！";
		}
		return "🎂 Happy Birthday!";
	}
	if (language === "ja") {
		return "🎌 祝日スペシャルメッセージ";
	}
	if (language === "zh") {
		return "🎌 节日特别消息";
	}
	return "🎌 Holiday special message";
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength - 3)}...`;
}
