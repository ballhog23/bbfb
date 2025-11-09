import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';

export async function handlerPlayoffs(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const losersBracket = await sleeper.getLeaguePlayoffBracket('losers_bracket');
    const winnersBracket = await sleeper.getLeaguePlayoffBracket('winners_bracket');
    const data = {
        losersBracket,
        winnersBracket
    };



    res.send(data);
}