export interface GitHubProfile {
	login: string;
	name: string | null;
	bio: string | null;
}

export interface GitHubActivity {
	recentCommitCount: number;
	streakDays: number;
	latestEvent?: SpecialEvent;
}

export type SpecialEventType = "release" | "issue" | "pr";

export interface SpecialEvent {
	type: SpecialEventType;
	title: string;
	createdAt: string;
}

interface GitHubEvent {
	type?: string;
	created_at?: string;
	payload?: {
		action?: string;
		commits?: unknown[];
		release?: {
			name?: string;
			tag_name?: string;
		};
		issue?: {
			title?: string;
		};
		pull_request?: {
			title?: string;
			merged?: boolean;
		};
	};
}

// Key format: `${countryCode}-${year}`. Value is a list of YYYY-MM-DD holiday dates.
// Cache is in-memory for the process lifetime and overwritten yearly/country-wise.
const holidayCache = new Map<string, string[]>();
const DEFAULT_TIMEOUT_MS = 3000;

export async function fetchGitHubProfile(
	username?: string,
): Promise<GitHubProfile | null> {
	if (!username) {
		return null;
	}

	const data = await fetchJsonWithTimeout<{ login?: string; name?: string; bio?: string }>(
		`https://api.github.com/users/${encodeURIComponent(username)}`,
	);

	if (!data?.login) {
		return null;
	}

	return {
		login: data.login,
		name: data.name ?? null,
		bio: data.bio ?? null,
	};
}

export async function fetchGitHubActivity(
	username?: string,
): Promise<GitHubActivity | null> {
	if (!username) {
		return null;
	}

	const events = await fetchJsonWithTimeout<GitHubEvent[]>(
		`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`,
	);

	if (!Array.isArray(events)) {
		return null;
	}

	const now = Date.now();
	const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
	let recentCommitCount = 0;
	const activeDays = new Set<string>();

	for (const event of events) {
		const createdAt = event.created_at ? new Date(event.created_at).getTime() : NaN;
		if (Number.isFinite(createdAt) && createdAt >= sevenDaysAgo && event.type === "PushEvent") {
			const commits = Array.isArray(event.payload?.commits) ? event.payload.commits.length : 0;
			recentCommitCount += commits;
		}

		if (event.created_at) {
			activeDays.add(event.created_at.slice(0, 10));
		}
	}

	const streakDays = calculateStreakDays(activeDays, new Date());
	const latestEvent = findLatestSpecialEvent(events);

	return { recentCommitCount, streakDays, latestEvent };
}

function findLatestSpecialEvent(events: GitHubEvent[]): SpecialEvent | undefined {
	for (const event of events) {
		const createdAt = event.created_at;
		if (!createdAt) {
			continue;
		}

		if (event.type === "ReleaseEvent" && event.payload?.action === "published") {
			const releaseName =
				event.payload.release?.name ?? event.payload.release?.tag_name ?? "New release";
			return { type: "release", title: releaseName, createdAt };
		}

		if (event.type === "IssuesEvent" && event.payload?.action === "closed") {
			const title = event.payload.issue?.title ?? "Issue closed";
			return { type: "issue", title, createdAt };
		}

		if (
			event.type === "PullRequestEvent" &&
			event.payload?.action === "closed" &&
			event.payload.pull_request?.merged
		) {
			const title = event.payload.pull_request.title ?? "Pull request merged";
			return { type: "pr", title, createdAt };
		}
	}

	return undefined;
}

function calculateStreakDays(activeDays: Set<string>, now: Date): number {
	let streak = 0;
	const cursor = new Date(now);
	cursor.setUTCHours(0, 0, 0, 0);

	for (;;) {
		const date = cursor.toISOString().slice(0, 10);
		if (!activeDays.has(date)) {
			break;
		}
		streak += 1;
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}

	return streak;
}

export async function isPublicHoliday(
	date: Date,
	countryCode: string,
): Promise<boolean> {
	const normalizedCountry = countryCode.toUpperCase();
	if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
		return false;
	}

	const year = date.getFullYear();
	const dateKey = date.toISOString().slice(0, 10);
	const cacheKey = `${normalizedCountry}-${year}`;

	let holidays = holidayCache.get(cacheKey);
	if (!holidays) {
		const data = await fetchJsonWithTimeout<Array<{ date?: string }>>(
			`https://date.nager.at/api/v3/PublicHolidays/${year}/${normalizedCountry}`,
			2000,
		);
		holidays = Array.isArray(data)
			? data.map((item) => item.date).filter((value): value is string => Boolean(value))
			: [];
		holidayCache.set(cacheKey, holidays);
	}

	return holidays.includes(dateKey);
}

async function fetchJsonWithTimeout<T>(
	url: string,
	timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "greeting-badge/1.0",
			},
			signal: controller.signal,
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as T;
	} catch {
		return null;
	} finally {
		clearTimeout(timeoutId);
	}
}
