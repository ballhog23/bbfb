import { buildDropDownTeams } from "../services/web/rivalry-service.js";
export async function handlerServeRivalry(_, res) {
    const teams = await buildDropDownTeams();
    return res.render("pages/rivalry", {
        page: "rivalry",
        title: "Rivalry",
        description: "Bleed Blue Fantasy Football Rivalry",
        teams,
    });
}
