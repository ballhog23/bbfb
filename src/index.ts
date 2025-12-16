import express from 'express';
import compression from "compression";
import { errorHandler } from './middleware/errorHandler.js';
import { usersRoute } from "./routes/usersRoute.js";
import { playersRoute } from "./routes/playersRoute.js";
import { leaguesRoute } from "./routes/leaguesRoute.js";
import { rostersRoute } from "./routes/rostersRoute.js";

const app = express();
app.use(compression());
app.use(express.json());

app.use("/leagues", leaguesRoute);
app.use("/users", usersRoute);
app.use("/players", playersRoute);
app.use("/rosters", rostersRoute);

app.use(errorHandler);

export default app;