import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';

export async function handlerLeague(_: Request, res: Response) {
	const sleeper = new Sleeper();
	const league = await sleeper.getLeague();
	const data = {
		league
	};

	res.send(data);
}