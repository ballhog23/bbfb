import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handlerLeague } from './api/league.js';
import { handlerPlayers } from './api/players.js';
import { handlerMatchups } from './api/matchups.js';
import { handlerPlayoffs } from './api/playoffs.js';
import { handlerRosters } from './api/rosters.js';
import { handlerUsers } from './api/users.js';


const app = express();
app.use(express.json());

app.get('/league', (req, res, next) => {
	Promise.resolve(handlerLeague(req, res)).catch(next);
});

app.get('/players', (req, res, next) => {
	Promise.resolve(handlerPlayers(req, res)).catch(next);
});

app.get('/matchups', (req, res, next) => {
	Promise.resolve(handlerMatchups(req, res)).catch(next);
});

app.get('/playoffs', (req, res, next) => {
	Promise.resolve(handlerPlayoffs(req, res)).catch(next);
});

app.get('/rosters', (req, res, next) => {
	Promise.resolve(handlerRosters(req, res)).catch(next);
});

app.get('/users', (req, res, next) => {
	Promise.resolve(handlerUsers(req, res)).catch(next);
});

app.use(errorHandler);

app.listen(config.api.port, () =>
	console.log(`Server is listening on http://localhost:${config.api.port}`)
);
