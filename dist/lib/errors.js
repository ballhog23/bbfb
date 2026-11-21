export class BadRequestError extends Error {
    statusCode = 400;
    constructor(message) {
        super(message);
    }
}
export class UserNotAuthenticatedError extends Error {
    statusCode = 401;
    constructor(message) {
        super(message);
    }
}
export class UserForbiddenError extends Error {
    statusCode = 403;
    constructor(message) {
        super(message);
    }
}
export class NotFoundError extends Error {
    statusCode = 404;
    constructor(message) {
        super(message);
    }
}
