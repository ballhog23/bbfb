import { Context, ScheduledEvent } from "aws-lambda";

export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const res = await fetch(`${process.env.APP_URL}/api/sync/rosters`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            // give up 1 second before the lambda timeout, so the handler can log the error
            signal: AbortSignal.timeout(context.getRemainingTimeInMillis() - 1000),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error('Roster sync failed:', res.status, body);
            throw new Error(`Roster sync failed with status ${res.status}`);
        }

        // return only the status. the app response can be larger than the 256 KB step functions limit
        await res.body?.cancel();
        return { statusCode: res.status };

    } catch (error) {
        console.error('Failed to sync rosters:', error);
        throw error;
    }
};
