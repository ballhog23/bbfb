import type { Request, Response } from "express";
import { selectAllLeaguesIdsAndSeasons } from "../db/queries/leagues.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { config } from "../config.js";

const BASE_URL = "https://bleedblue.football";
const TOTAL_WEEKS = 17;

export async function handlerServeSitemap(_: Request, res: Response) {
    const leagueState = await selectLeagueState();
    const allLeagues = await selectAllLeaguesIdsAndSeasons();

    const leagues = leagueState?.isLeagueActive
        ? allLeagues
        : allLeagues.filter(l => l.leagueId !== config.league.id);

    // add any new pages here
    const staticUrls = [
        { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${BASE_URL}/matchups`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${BASE_URL}/trophy-room`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${BASE_URL}/rilvary`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${BASE_URL}/league-stats`, changefreq: 'weekly', priority: '0.8' },
    ];

    const matchupUrls = leagues.flatMap(({ leagueId }) =>
        Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
            loc: `${BASE_URL}/matchups/leagues/${leagueId}/weeks/${i + 1}`,
            changefreq: 'weekly',
            priority: '0.5',
        }))
    );

    const urls = [...staticUrls, ...matchupUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
}
