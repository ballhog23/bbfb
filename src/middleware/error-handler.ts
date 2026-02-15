import type { Request, Response, NextFunction } from 'express';
import { respondWithError } from '../lib/json.js';


export async function errorHandler(err: Error & { statusCode?: number }, req: Request, res: Response, next: NextFunction) {
	if (!req.path.startsWith('/api/')) return next(err);

	const statusCode = err.statusCode ?? 500;
	const message = statusCode >= 500 ? 'There was an issue on our end.' : err.message;

	if (statusCode >= 500) {
		console.error(err.message);
	}

	respondWithError(res, statusCode, message);
}
