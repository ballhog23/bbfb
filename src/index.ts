import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handlerLeague } from './api/league.js';

const app = express();
app.use(express.json());

app.get('/league', (req, res, next) => {
	Promise.resolve(handlerLeague(req, res)).catch(next);
});

app.use(errorHandler);

app.listen(config.api.port, () =>
	console.log(`Server is listening on http://localhost:${config.api.port}`)
);
