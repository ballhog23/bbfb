import { Context, ScheduledEvent } from "aws-lambda";

// it's important to throw errors whenever we get a non 2XX status code
// otherwise our step function state will just assume everything went well
export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const res = await fetch(`${process.env.APP_URL}/api/sync/leagues`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error('League sync failed:', res.status, body);
            throw new Error(`League sync failed with status ${res.status}`);
        }

        return {
            statusCode: res.status,
            body: await res.text(),
        };

    } catch (error) {
        console.error('Failed to sync leagues:', error);
        throw error;
    }
};