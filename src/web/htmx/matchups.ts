import type { Request, Response } from "express";
import { selectLeagueMatchupsByWeek } from "../../db/queries/matchups.js";

type HTMXParams = {
    league: string;
    week: string;
};

export async function handlerGetMatchupsHTMX(req: Request<any, any, HTMXParams>, res: Response) {
    const leagueId = req.query.league?.toString();
    const week = Number(req.query.week);

    if (!leagueId || Number.isNaN(week)) {
        res.status(400).send("Missing leagueId or week");
        return;
    }

    const matchups = await selectLeagueMatchupsByWeek(leagueId, week);
    const filtered = matchups.filter(m => m.matchupId !== null);
    const groupedMatches = Object.groupBy(filtered, m => m.matchupId!);

    res
        .set(
            "HX-Push-Url",
            `/leagues/${leagueId}/weeks/${week}`
        )
        .render("partials/matchup-section", {
            groupedMatches,
            week
        });
    return;
}
