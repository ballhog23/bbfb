import express from 'express';
import compression from "compression";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { errorHandler } from './middleware/error-handler.js';
import { bootstrapRoute } from "./routes/api/bootstrap.js";
import { syncRoute } from "./routes/api/sync-route.js";
import { indexRoute } from "./routes/web/index-route.js";

import { playersRoute } from "./routes/api/players-route.js";
import { leaguesRoute } from "./routes/api/leagues-route.js";
import { sleeperUsersRoute } from "./routes/api/sleeper-users-route.js";
import { leagueUsersRoute } from "./routes/api/league-users-route.js";
import { rostersRoute } from "./routes/api/rosters-route.js";
import { matchupsRoute } from "./routes/api/matchups-route.js";
import { matchupOutcomesRoute } from "./routes/api/matchup-outcomes.js";
import { playoffsRoute } from "./routes/api/playoffs.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set('view engine', 'pug');
// this will need to change in prod, we will need to copy templates to /dist, tsc does not compile pug files
// look into a tool like cpx
app.set('views', join(__dirname, '../src/views/pages'));
app.use(compression());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));
app.use("/index", indexRoute);
app.use("/players", playersRoute);
app.use("/bootstrap-history", bootstrapRoute);
app.use("/leagues", leaguesRoute);
app.use("/sleeper-users", sleeperUsersRoute);
app.use("/league-users", leagueUsersRoute);
app.use("/rosters", rostersRoute);
app.use("/matchups", matchupsRoute);
app.use("/matchup-outcomes", matchupOutcomesRoute);
app.use("/playoffs", playoffsRoute);
app.use("/sync", syncRoute);

app.use(errorHandler);

export default app;