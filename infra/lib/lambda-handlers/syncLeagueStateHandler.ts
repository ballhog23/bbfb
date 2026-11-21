import { Context, ScheduledEvent } from "aws-lambda";

export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const res = await fetch(`${process.env.APP_URL}/api/sync/league-state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            // give up 1 second before the lambda timeout, so the handler can log the error
            signal: AbortSignal.timeout(context.getRemainingTimeInMillis() - 1000),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error('League state sync failed:', res.status, body);
            throw new Error(`League state sync failed with status ${res.status}`);
        }

        // return only the status. the app response can be larger than the 256 KB step functions limit
        await res.body?.cancel();
        return { statusCode: res.status };

    } catch (error) {
        console.error('Failed to sync league state:', error);
        throw error;
    }
};
