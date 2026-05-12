export type Language = "ja" | "en" | "zh";
export type TimeSlotName = "morning" | "afternoon" | "evening";
export type ContextMode = "workday" | "holiday" | "early-bird" | "night-owl";

export interface TimeSlot {
	name: TimeSlotName;
	startHour: number;
	endHour: number;
	greeting: Record<Language, string>;
	icon: string;
}

export const timeSlots: TimeSlot[] = [
	{
		name: "morning",
		startHour: 5,
		endHour: 11,
		greeting: {
			ja: "おはようございます",
			en: "Good morning",
			zh: "早上好",
		},
		icon: "🌅",
	},
	{
		name: "afternoon",
		startHour: 11,
		endHour: 18,
		greeting: {
			ja: "こんにちは",
			en: "Good afternoon",
			zh: "下午好",
		},
		icon: "☀️",
	},
	{
		name: "evening",
		startHour: 18,
		endHour: 5,
		greeting: {
			ja: "こんばんは",
			en: "Good evening",
			zh: "晚上好",
		},
		icon: "🌙",
	},
];

const baseMessages: Record<Language, Record<TimeSlotName, string[]>> = {
	ja: {
		morning: [
			"今日も一日頑張りましょう！",
			"新しい朝、新しいコードが待っています。",
			"朝日を浴びて、コーディングをはじめましょう。",
			"おはよう！もうコーヒーは飲みましたか？",
			"今日のバグ修正は何個になるでしょうか？",
		],
		afternoon: [
			"進捗はどうですか？コーヒーを淹れて一息つきましょう。",
			"午後も集中力を保ってコーディング頑張ってください！",
			"スタンドアップミーティングは終わりました？",
			"この時間が一日で最も生産性が高いですね。",
			"あと今日中に一つ機能を完成させちゃいましょう。",
		],
		evening: [
			"今日もお疲れ様です。暗い画面の見すぎに注意してくださいね。",
			"もう少しだけ頑張るか、明日に任せるか...お任せします。",
			"夜のコーディングは最高のハッカータイムです。",
			"tonight's commit は何個になりましたか？",
			"夜中のコード変更は危険です。寝る前に確認しましょう。",
		],
	},
	en: {
		morning: [
			"Fresh morning, fresh commits.",
			"Let's warm up with a quick refactor.",
			"Coffee first, code right after.",
		],
		afternoon: [
			"How's your progress going today?",
			"Keep your focus and ship one feature.",
			"Afternoon is perfect for review time.",
		],
		evening: [
			"Great work today. Time to close cleanly.",
			"Night coding is fun—double-check before push.",
			"One more commit, or call it a day?",
		],
	},
	zh: {
		morning: [
			"新的一天，新的代码！",
			"先来一杯咖啡，再开始编码。",
			"早晨最适合清理技术债。",
		],
		afternoon: [
			"进度如何？继续保持专注。",
			"下午适合完成一个小功能。",
			"别忘了写测试和复盘。",
		],
		evening: [
			"辛苦了，注意休息和护眼。",
			"夜间编码前先确认目标范围。",
			"再提交一次，还是明天继续？",
		],
	},
};

const modeMessages: Record<Language, Record<ContextMode, string[]>> = {
	ja: {
		workday: ["平日モードで着実に積み上げましょう。"],
		holiday: ["休日モード。無理せずゆるく進めましょう。"],
		"early-bird": ["朝活モード、集中できる時間を活かしましょう。"],
		"night-owl": ["深夜モード。重要変更は明朝に再確認がおすすめです。"],
	},
	en: {
		workday: ["Weekday mode: steady progress wins."],
		holiday: ["Holiday mode: keep it light and healthy."],
		"early-bird": ["Early-bird mode: high-focus window is open."],
		"night-owl": ["Night-owl mode: re-check major changes tomorrow."],
	},
	zh: {
		workday: ["工作日模式：稳定推进最重要。"],
		holiday: ["假日模式：轻量开发，注意休息。"],
		"early-bird": ["早起模式：抓住高专注时间段。"],
		"night-owl": ["夜猫子模式：重要改动建议明早复查。"],
	},
};

export function getTimeSlot(hour: number): TimeSlot {
	const slot = timeSlots.find((s) =>
		s.name === "evening"
			? hour >= s.startHour || hour < s.endHour
			: hour >= s.startHour && hour < s.endHour,
	);
	return slot || timeSlots[1];
}

export function getGreeting(hour: number, language: Language): string {
	return getTimeSlot(hour).greeting[language];
}

export function getIcon(hour: number): string {
	return getTimeSlot(hour).icon;
}

export function getMessageCandidates(
	hour: number,
	language: Language,
	mode: ContextMode,
): string[] {
	const slot = getTimeSlot(hour);
	return [...baseMessages[language][slot.name], ...modeMessages[language][mode]];
}

export function selectMessageByVariant(messages: string[], variant: "A" | "B"): string {
	if (messages.length === 0) {
		return "";
	}
	const subset = messages.filter((_, index) =>
		variant === "A" ? index % 2 === 0 : index % 2 !== 0,
	);
	const target = subset.length > 0 ? subset : messages;
	return target[Math.floor(Math.random() * target.length)];
}

export function detectLanguage(
	langParam: string | null,
	acceptLanguage: string | null,
): Language {
	if (langParam && langParam !== "auto") {
		if (langParam === "ja" || langParam === "en" || langParam === "zh") {
			return langParam;
		}
	}

	const normalized = (acceptLanguage ?? "").toLowerCase();
	if (normalized.includes("ja")) {
		return "ja";
	}
	if (normalized.includes("zh")) {
		return "zh";
	}
	return "en";
}

export function resolveContextMode(date: Date, modeParam: string | null): ContextMode {
	if (
		modeParam === "workday" ||
		modeParam === "holiday" ||
		modeParam === "early-bird" ||
		modeParam === "night-owl"
	) {
		return modeParam;
	}

	const hour = date.getHours();
	const day = date.getDay();
	const isWeekend = day === 0 || day === 6;
	if (hour >= 4 && hour <= 7) {
		return "early-bird";
	}
	if (hour >= 0 && hour <= 3) {
		return "night-owl";
	}
	return isWeekend ? "holiday" : "workday";
}

export function getModeLabel(mode: ContextMode, language: Language): string {
	const labels: Record<Language, Record<ContextMode, string>> = {
		ja: {
			workday: "平日モード",
			holiday: "休日モード",
			"early-bird": "朝活モード",
			"night-owl": "深夜モード",
		},
		en: {
			workday: "Weekday mode",
			holiday: "Holiday mode",
			"early-bird": "Early-bird mode",
			"night-owl": "Night-owl mode",
		},
		zh: {
			workday: "工作日模式",
			holiday: "假日模式",
			"early-bird": "早起模式",
			"night-owl": "夜猫子模式",
		},
	};
	return labels[language][mode];
}

export function formatTime(date: Date): string {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

export function formatDate(date: Date, language: Language): string {
	const locale = language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US";
	return new Intl.DateTimeFormat(locale, {
		weekday: "short",
		month: "short",
		day: "numeric",
		timeZone: "Asia/Tokyo",
	}).format(date);
}
