import { assembleSackoHallPageData } from "../services/web/sacko-hall-service.js";
export async function handlerServeSackoHall(_, res) {
    const { sackos, stats } = await assembleSackoHallPageData();
    return res.render("pages/sacko-hall", {
        page: "sacko-hall",
        title: "Sacko Hall",
        description: "Bleed Blue Fantasy Football Sacko Hall",
        sackos,
        stats,
    });
}
