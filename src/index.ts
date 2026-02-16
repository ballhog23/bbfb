import express from 'express';
import compression from "compression";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from "node:fs";
import { errorHandler } from './middleware/error-handler.js';
import { handlerServeErrorPage } from './web/error-page.js';

// json api
import { apiMatchupsPageRoute } from "./routes/api/matchups-page-route.js";
import { apiSyncRoute } from "./routes/api/sync-route.js";
import { apiBootstrapRoute } from "./routes/api/bootstrap-route.js";
import { apiBootstrapNewSeasonRoute } from "./routes/api/bootstrap-new-season-route.js";
import { apiRivalryPageRoute } from "./routes/api/rilvary-page-route.js";

// unused
import { apiLeaguesRoute } from "./routes/api/leagues-route.js";
import { apiMatchupsRoute } from "./routes/api/matchups-route.js";
import { apiMatchupOutcomesRoute } from "./routes/api/matchup-outcomes.js";
import { apiLeagueStateRoute } from "./routes/api/league-state-route.js";
import { apiPlayersRoute } from "./routes/api/players-route.js";
import { apiSleeperUsersRoute } from "./routes/api/sleeper-users-route.js";
import { apiLeagueUsersRoute } from "./routes/api/league-users-route.js";
import { apiRostersRoute } from "./routes/api/rosters-route.js";
import { apiPlayoffsRoute } from "./routes/api/playoffs.js";

// web routes
import { webIndexRoute } from "./routes/web/index.js";
import { webMatchupsPageRoute } from "./routes/web/matchups.js";
import { handlerServeNotFound } from "./web/not-found.js";
import { webSitemapRoute } from "./routes/web/sitemap.js";
import { webChampionsHallRoute } from "./routes/web/champions-hall.js";
import { webSackoHallRoute } from "./routes/web/sacko-hall.js";
import { webRivalryRoute } from "./routes/web/rivalry.js";
import { webLeagueStatsRoute } from "./routes/web/league-stats.js";

const app = express();
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// load image manifest
const manifestPath = join(__dirname, '../public/assets/image-manifest.json');
let imageManifest = {};

try {
    imageManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    console.log(`Loaded image manifest with ${Object.keys(imageManifest).length} entries.`);
} catch (err) {
    console.warn('No image manifest found or failed to parse.', err);
}
// persists images on locals global vars for all templates rendered using res.render()
app.locals.images = imageManifest;

app.use(compression());
app.use(express.json());
app.use(express.static(join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 * 30 : 0
}));
app.disable('x-powered-by');

app.set("view engine", "pug");
app.set("views", join(__dirname, "../views"));

// web views
app.use("/", webIndexRoute);
app.use("/matchups", webMatchupsPageRoute);
app.use("/sitemap.xml", webSitemapRoute);
app.use("/champions-hall", webChampionsHallRoute);
app.use("/sacko-hall", webSackoHallRoute);
app.use("/rivalry", webRivalryRoute);
app.use("/league-stats", webLeagueStatsRoute);

// json web api views
app.use("/api/web/matchups-page", apiMatchupsPageRoute);
app.use("/api/web/rivalry-page", apiRivalryPageRoute);

// json api
app.use("/api/bootstrap-history", apiBootstrapRoute);
app.use("/api/bootstrap-new-season", apiBootstrapNewSeasonRoute);
app.use("/api/sync", apiSyncRoute);

// we don't use these but we will keep them around since they are built out, maybe we use them one day
app.use("/api/leagues", apiLeaguesRoute);
app.use("/api/matchup-outcomes", apiMatchupOutcomesRoute);
app.use("/api/matchups", apiMatchupsRoute);
app.use("/api/league-state", apiLeagueStateRoute);
app.use("/api/players", apiPlayersRoute);
app.use("/api/sleeper-users", apiSleeperUsersRoute);
app.use("/api/league-users", apiLeagueUsersRoute);
app.use("/api/rosters", apiRostersRoute);
app.use("/api/playoffs", apiPlayoffsRoute);

// if api error
app.use(errorHandler);
// specifically catches 404
app.use(handlerServeNotFound);
// any other errors
app.use(handlerServeErrorPage);

export default app;