import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../sleeper-mocks/node.js";
import { Sleeper } from "../../../src/lib/sleeper.js";
import * as rawNFLPlayersFixture from "./raw/nfl-players.json";
import type { RawNFLPlayer } from "../../../src/lib/zod.js";

const rawPlayers: RawNFLPlayer[] = Reflect.get(rawNFLPlayersFixture, "default");
const sleeper = new Sleeper();
const baseURL = `https://api.sleeper.app/v1/`;

// Sleeper returns players as an object map: { player_id: player, ... }
beforeEach(() => {
    server.use(
        http.get(`${baseURL}/players/nfl`, () => {
            const playersMap = Object.fromEntries(
                rawPlayers.map(player => [player.player_id, player])
            );
            return HttpResponse.json(playersMap);
        })
    );
});

describe("Sleeper.getAllNFLPlayers (MSW intercepted)", () => {
    it("returns all NFL players as an array", async () => {
        const result = await sleeper.getAllNFLPlayers();
        expect(result).toEqual(rawPlayers);
    });

    it("returns the correct number of players", async () => {
        const result = await sleeper.getAllNFLPlayers();
        expect(result).toHaveLength(rawPlayers.length);
    });

    it("each player passes schema validation", async () => {
        const result = await sleeper.getAllNFLPlayers();
        for (const player of result) {
            expect(player).toHaveProperty("player_id");
            expect(player).toHaveProperty("first_name");
            expect(player).toHaveProperty("last_name");
            expect(typeof player.active).toBe("boolean");
        }
    });
});
