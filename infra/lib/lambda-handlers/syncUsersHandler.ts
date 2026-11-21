import { Context, ScheduledEvent } from "aws-lambda";

export const handler = async (event: ScheduledEvent, context: Context) => {
    try {
        const res = await fetch(`${process.env.APP_URL}/api/sync/users`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error('User sync failed:', res.status, body);
            throw new Error(`User sync failed with status ${res.status}`);
        }

        // return only the status. the app response can be larger than the 256 KB step functions limit
        await res.body?.cancel();
        return { statusCode: res.status };

    } catch (error) {
        console.error('Failed to sync users:', error);
        throw error;
    }
};
