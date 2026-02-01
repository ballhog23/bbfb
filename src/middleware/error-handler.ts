import type { Request, Response, NextFunction } from 'express';
import { respondWithError } from '../lib/json.js';
import {
	BadRequestError,
	UserNotAuthenticatedError,
	UserForbiddenError,
	NotFoundError,
} from '../lib/errors.js';
import { DrizzleError, DrizzleQueryError } from "drizzle-orm";

export async function errorHandler(err: Error, _: Request, res: Response, __: NextFunction) {
	let message = 'There was an issue on our end.';
	let statusCode = 500;

	if (err instanceof BadRequestError) {
		message = err.message;
		statusCode = 400;

	} else if (err instanceof UserNotAuthenticatedError) {
		message = err.message;
		statusCode = 401;

	} else if (err instanceof UserForbiddenError) {
		message = err.message;
		statusCode = 403;

	} else if (err instanceof NotFoundError) {
		message = err.message;
		statusCode = 404;

	} else if (err instanceof DrizzleError || err instanceof DrizzleQueryError) {
		message = `CAUSE: ${err.cause}`;

	} else if (err instanceof AggregateError) {
		message = err.message;
		console.error(err.errors);
	}

	if (statusCode >= 500) {
		console.error(err.message);
	}

	respondWithError(res, statusCode, message);
}
