import { Context, ScheduledEvent } from "aws-lambda";

export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const res = await fetch(`${process.env.APP_URL}/api/sync/players`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error('Player sync failed:', res.status, body);
            throw new Error(`Player sync failed with status ${res.status}`);
        }

        return {
            statusCode: res.status,
            body: await res.text(),
        };

    } catch (error) {
        console.error('Failed to sync players:', error);
        throw error;
    }
};
