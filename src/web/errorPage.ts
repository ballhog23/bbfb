import type { Request, Response, NextFunction } from "express";

const ERROR_MESSAGES: Record<number, { heading: string; message: string }> = {
    400: { heading: "Bad Request", message: "The request could not be understood." },
    401: { heading: "Unauthorized", message: "You need to be authenticated to access this resource." },
    403: { heading: "Forbidden", message: "You don't have permission to access this resource." },
    500: { heading: "Internal Server Error", message: "Something went wrong on our end." },
};

const DEFAULT_ERROR = { heading: "Something Went Wrong", message: "An unexpected error occurred." };

export async function handlerServeErrorPage(err: Error & { status?: number; statusCode?: number }, _: Request, res: Response, __: NextFunction) {
    const statusCode = err.status ?? err.statusCode ?? 500;
    const { heading, message } = ERROR_MESSAGES[statusCode] ?? DEFAULT_ERROR;

    if (statusCode >= 500) {
        console.error(err.message);
    }

    res.status(statusCode).render("pages/error-page", {
        title: heading,
        page: "error",
        description: `${statusCode} - ${heading}`,
        statusCode,
        heading,
        message,
    });
}
