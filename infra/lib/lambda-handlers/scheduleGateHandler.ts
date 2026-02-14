// schedule gate: short-circuits step function execution outside the NFL season
// and outside the appropriate day/hour windows.
// EventBridge fires every 15 minutes. this gate ensures we only execute
// during the correct windows — a single hour means "once daily" since
// only one of the four 15-min triggers will fall within that hour.
export const handler = async () => {
    const now = new Date();
    const month = now.getUTCMonth(); // 0-indexed: 0=Jan, 8=Sep
    const day = now.getUTCDay();     // 0=Sun, 1=Mon, ..., 6=Sat
    const hour = now.getUTCHours();

    // outside season (Feb-Aug) → skip
    if (month >= 1 && month <= 7) {
        return { shouldRun: false, reason: 'off-season' };
    }

    // hour windows per day of week
    // multi-hour windows = runs every 15 min within that range (game days)
    // single-hour windows = effectively once daily (only 1 trigger lands in that hour)
    const schedules: Record<number, { start: number; end: number }> = {
        0: { start: 12, end: 22 }, // Sunday - game day
        1: { start: 19, end: 22 }, // Monday - MNF
        2: { start: 14, end: 14 }, // Tuesday - once daily
        3: { start: 14, end: 14 }, // Wednesday - once daily
        4: { start: 19, end: 22 }, // Thursday - TNF
        5: { start: 14, end: 14 }, // Friday - once daily
        6: { start: 10, end: 18 }, // Saturday - a few times throughout the day
    };

    const window = schedules[day];

    if (hour < window.start || hour > window.end) {
        return { shouldRun: false, reason: `outside window for day ${day}: ${hour}UTC not in ${window.start}-${window.end}` };
    }

    return { shouldRun: true };
};
