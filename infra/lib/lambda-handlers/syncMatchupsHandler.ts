import { Context, ScheduledEvent } from "aws-lambda";

export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const stateRes = await fetch(`${process.env.APP_URL}/api/league-state`);

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
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`Matchup sync (${syncEndpoint}) failed:`, res.status, body);
            throw new Error(`Matchup sync (${syncEndpoint}) failed with status ${res.status}`);
        }

        return {
            statusCode: res.status,
            body: await res.text(),
        };

    } catch (error) {
        console.error('Failed to sync matchups:', error);
        throw error;
    }
};
