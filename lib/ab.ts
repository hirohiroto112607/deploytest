type Variant = "A" | "B";

interface VariantStats {
	views: number;
	retained: number;
}

interface LastSeen {
	variant: Variant;
	timestamp: number;
}

const variantStats = new Map<string, Record<Variant, VariantStats>>();
const userLastSeen = new Map<string, LastSeen>();
const RETAIN_WINDOW_MS = 10 * 60 * 1000;

export function chooseVariant(experimentKey: string, userKey: string): Variant {
	const now = Date.now();
	const existing = userLastSeen.get(userKey);
	if (existing && now - existing.timestamp <= RETAIN_WINDOW_MS) {
		const stat = getStats(experimentKey, existing.variant);
		stat.retained += 1;
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
		A: { views: 0, retained: 0 },
		B: { views: 0, retained: 0 },
	};
	variantStats.set(key, initial);
	return initial;
}

function getStats(key: string, variant: Variant): VariantStats {
	return getOrCreateExperiment(key)[variant];
}

