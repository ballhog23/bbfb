import express from 'express';
import compression from "compression";
import { errorHandler } from './middleware/errorHandler.js';
import { playersRoute } from "./routes/playersRoute.js";
import { bootstrapRoute } from "./routes/bootstrap.js";
import { leaguesRoute } from "./routes/leaguesRoute.js";
import { sleeperUsersRoute } from "./routes/sleeperUsersRoute.js";
import { leagueUsersRoute } from "./routes/leagueUsersRoute.js";
import { rostersRoute } from "./routes/rostersRoute.js";

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