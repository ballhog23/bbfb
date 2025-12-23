import express from 'express';
import compression from "compression";
import { errorHandler } from './middleware/error-handler.js';
import { playersRoute } from "./routes/players-route.js";
import { bootstrapRoute } from "./routes/bootstrap.js";
import { leaguesRoute } from "./routes/leagues-route.js";
import { sleeperUsersRoute } from "./routes/sleeper-users-route.js";
import { leagueUsersRoute } from "./routes/league-users-route.js";
import { rostersRoute } from "./routes/rosters-route.js";

const app = express();
app.use(compression());
app.use(express.json());

app.use("/players", playersRoute);
app.use('/bootstrap', bootstrapRoute);
app.use("/leagues", leaguesRoute);
app.use("/sleeper-users", sleeperUsersRoute);
app.use("/league-users", leagueUsersRoute);
// app.use("/rosters", rostersRoute);  

app.use(errorHandler);

export default app;