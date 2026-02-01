import express from 'express';
import compression from "compression";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { errorHandler } from './middleware/error-handler.js';

// json api
import { apiLeaguesRoute } from "./routes/api/leagues-route.js";
import { apiMatchupsRoute } from "./routes/api/matchups-route.js";
import { apiMatchupsPageRoute } from "./routes/api/matchups-page-route.js";
import { apiMatchupOutcomesRoute } from "./routes/api/matchup-outcomes.js";
import { apiBootstrapRoute } from "./routes/api/bootstrap-route.js";
import { apiSyncRoute } from "./routes/api/sync-route.js";
import { apiLeagueStateRoute } from "./routes/api/league-state-route.js";
import { apiPlayersRoute } from "./routes/api/players-route.js";
import { apiSleeperUsersRoute } from "./routes/api/sleeper-users-route.js";
import { apiLeagueUsersRoute } from "./routes/api/league-users-route.js";
import { apiRostersRoute } from "./routes/api/rosters-route.js";
import { apiPlayoffsRoute } from "./routes/api/playoffs.js";

// web routes
import { webIndexRoute } from "./routes/web/index.js";
import { webMatchupsPageRoute } from "./routes/web/matchups.js";

const app = express();
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
app.use(compression());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

app.set("view engine", "pug");
app.set("views", join(__dirname, "../views"));

// web
app.use("/", webIndexRoute);
app.use("/matchups", webMatchupsPageRoute);


//api
app.use("/api/leagues", apiLeaguesRoute);
app.use("/api/matchup-outcomes", apiMatchupOutcomesRoute);
app.use("/api/matchups", apiMatchupsRoute);
app.use("/api/matchups-page", apiMatchupsPageRoute);
app.use("/api/bootstrap-history", apiBootstrapRoute);
app.use("/api/sync", apiSyncRoute);
app.use("/api/league-state", apiLeagueStateRoute);
app.use("/api/players", apiPlayersRoute);
app.use("/api/sleeper-users", apiSleeperUsersRoute);
app.use("/api/league-users", apiLeagueUsersRoute);
app.use("/api/rosters", apiRostersRoute);
app.use("/api/playoffs", apiPlayoffsRoute);

app.use(errorHandler);

export default app;