import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handlerGetLeagues, handlerInsertLeagues, handlerGetLeague, handlerDeleteLeagues } from './api/leagues.js';
import { handlerGetPlayers, handlerGetPlayer, handlerInsertPlayers, handlerDeleteNFLPlayers } from './api/players.js';
import { handlerGetUsers, handlerGetUser, handlerInsertUsers, handlerDeleteUsers } from './api/users.js';
import { handlerMatchups } from './api/matchups.js';
import { handlerPlayoffs } from './api/playoffs.js';
import { handlerGetRosters, handlerGetRoster, handlerInsertRosters } from './api/rosters.js';


const app = express();
app.use(express.json());

app.get('/leagues', (req, res, next) => {
	Promise.resolve(handlerGetLeagues(req, res)).catch(next);
});

app.get('/leagues/:leagueId', (req, res, next) => {
	Promise.resolve(handlerGetLeague(req, res)).catch(next);
});

app.post('/leagues', (req, res, next) => {
	Promise.resolve(handlerInsertLeagues(req, res)).catch(next);
});

app.delete('/leagues', (req, res, next) => {
	Promise.resolve(handlerDeleteLeagues(req, res)).catch(next);
});

app.get('/users', (req, res, next) => {
	Promise.resolve(handlerGetUsers(req, res)).catch(next);
});

app.get('/users/:userId', (req, res, next) => {
	Promise.resolve(handlerGetUser(req, res)).catch(next);
});

app.post('/users', (req, res, next) => {
	Promise.resolve(handlerInsertUsers(req, res)).catch(next);
});

app.delete('/users', (req, res, next) => {
	Promise.resolve(handlerDeleteUsers(req, res)).catch(next);
});

app.get('/players', (req, res, next) => {
	Promise.resolve(handlerGetPlayers(req, res)).catch(next);
});

app.get('/players/:playerId', (req, res, next) => {
	Promise.resolve(handlerGetPlayer(req, res)).catch(next);
});

app.post('/players', (req, res, next) => {
	Promise.resolve(handlerInsertPlayers(req, res)).catch(next);
});

app.delete('/players', (req, res, next) => {
	Promise.resolve(handlerDeleteNFLPlayers(req, res)).catch(next);
});

// app.get('/rosters', (req, res, next) => {
// 	Promise.resolve(handlerGetRosters(req, res)).catch(next);
// });

// app.get('/rosters/:rosterId', (req, res, next) => {
// 	Promise.resolve(handlerGetRoster(req, res)).catch(next);
// });

// app.post('/rosters', (req, res, next) => {
// 	Promise.resolve(handlerInsertRosters(req, res)).catch(next);
// });

// app.get('/matchups', (req, res, next) => {
// 	Promise.resolve(handlerMatchups(req, res)).catch(next);
// });

// app.get('/playoffs', (req, res, next) => {
// 	Promise.resolve(handlerPlayoffs(req, res)).catch(next);
// });


app.use(errorHandler);

app.listen(config.api.port, () =>
	console.log(`Server is listening on http://localhost:${config.api.port}`)
);
