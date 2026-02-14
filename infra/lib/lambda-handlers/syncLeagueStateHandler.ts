import { Context, ScheduledEvent } from "aws-lambda";

export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const res = await fetch(`${process.env.APP_URL}/api/sync/league-state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error('League state sync failed:', res.status, body);
            throw new Error(`League state sync failed with status ${res.status}`);
        }

        return {
            statusCode: res.status,
            body: await res.text(),
        };

    } catch (error) {
        console.error('Failed to sync league state:', error);
        throw error;
    }
};
