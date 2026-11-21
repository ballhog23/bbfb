import { Context, ScheduledEvent } from "aws-lambda";

export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const stateRes = await fetch(`${process.env.APP_URL}/api/league-state`, {
            // give up 1 second before the lambda timeout, so the handler can log the error
            signal: AbortSignal.timeout(context.getRemainingTimeInMillis() - 1000),
        });

        if (!stateRes.ok) {
            const body = await stateRes.text();
            console.error('Failed to fetch league state:', stateRes.status, body);
            throw new Error(`Failed to fetch league state with status ${stateRes.status}`);
        }

        const stateData = await stateRes.json() as { leagueState: { seasonType: string } };
        const { seasonType } = stateData.leagueState;

        let syncEndpoint: string | null = null;

        if (seasonType === 'regular') {
            syncEndpoint = 'matchups-regular';
        } else if (seasonType === 'post') {
            syncEndpoint = 'matchups-post';
        }

        if (!syncEndpoint) {
            console.log(`Season type is "${seasonType}", skipping matchup sync.`);
            return { statusCode: 200, body: 'No sync needed' };
        }

        const res = await fetch(`${process.env.APP_URL}/api/sync/${syncEndpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            // give up 1 second before the lambda timeout, so the handler can log the error
            signal: AbortSignal.timeout(context.getRemainingTimeInMillis() - 1000),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`Matchup sync (${syncEndpoint}) failed:`, res.status, body);
            throw new Error(`Matchup sync (${syncEndpoint}) failed with status ${res.status}`);
        }

        // return only the status. the app response can be larger than the 256 KB step functions limit
        await res.body?.cancel();
        return { statusCode: res.status };

    } catch (error) {
        console.error('Failed to sync matchups:', error);
        throw error;
    }
};
