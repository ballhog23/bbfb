export async function handlerServeNotFound(_, res) {
    return res.status(404).render("pages/404", {
        title: "Page not found",
        page: "not-found",
        description: `404 not resource not found`,
    });
}
