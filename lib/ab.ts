type Variant = "A" | "B";

interface VariantStats {
	views: number;
	retained: number;
	updatedAt: number;
}

interface LastSeen {
	variant: Variant;
	timestamp: number;
}

// In-memory experiment data (non-persistent). Size is capped to avoid unbounded growth.
const variantStats = new Map<string, Record<Variant, VariantStats>>();
const userLastSeen = new Map<string, LastSeen>();
// A revisit within this window is treated as implicit retention for the shown variant.
const RETAIN_WINDOW_MS = 10 * 60 * 1000;
const MAX_EXPERIMENTS = 500;
const MAX_USERS = 5000;

export function chooseVariant(experimentKey: string, userKey: string): Variant {
	const now = Date.now();
	pruneByTime(variantStats, MAX_EXPERIMENTS, (value) =>
		Math.min(value.A.updatedAt, value.B.updatedAt),
	);
	pruneByTime(userLastSeen, MAX_USERS, (value) => value.timestamp);

	const existing = userLastSeen.get(userKey);
	if (existing && now - existing.timestamp <= RETAIN_WINDOW_MS) {
		const stat = getStats(experimentKey, existing.variant);
		stat.retained += 1;
		stat.updatedAt = now;
	}

	const stats = getOrCreateExperiment(experimentKey);
	const scoreA = score(stats.A);
	const scoreB = score(stats.B);
	let selected: Variant;

	if (Math.random() < 0.2) {
		selected = Math.random() < 0.5 ? "A" : "B";
	} else {
		selected = scoreA >= scoreB ? "A" : "B";
	}

	stats[selected].views += 1;
	stats[selected].updatedAt = now;
	userLastSeen.set(userKey, { variant: selected, timestamp: now });
	return selected;
}

function score(stat: VariantStats): number {
	if (stat.views === 0) {
		return 0.5;
	}
	return stat.retained / stat.views;
}

function getOrCreateExperiment(key: string): Record<Variant, VariantStats> {
	const existing = variantStats.get(key);
	if (existing) {
		return existing;
	}

	const initial: Record<Variant, VariantStats> = {
		A: { views: 0, retained: 0, updatedAt: Date.now() },
		B: { views: 0, retained: 0, updatedAt: Date.now() },
	};
	variantStats.set(key, initial);
	return initial;
}

function getStats(key: string, variant: Variant): VariantStats {
	return getOrCreateExperiment(key)[variant];
}

function pruneByTime<T>(
	map: Map<string, T>,
	maxSize: number,
	getTimestamp: (value: T) => number,
): void {
	while (map.size > maxSize) {
		let oldestKey: string | undefined;
		let oldestTime = Number.POSITIVE_INFINITY;

		for (const [key, value] of map.entries()) {
			const timestamp = getTimestamp(value);
			if (timestamp < oldestTime) {
				oldestTime = timestamp;
				oldestKey = key;
			}
		}

		if (!oldestKey) {
			break;
		}
		map.delete(oldestKey);
	}
}
