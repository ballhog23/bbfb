process.loadEnvFile();

export function envOrThrow(key: string) {
	const value = process.env[key];

	if (!value) throw new Error(`Env var ${key} is not set.`);

	return value;
}

export type Config = {
	api: APIConfig;
	league: LeagueConfig;
};

type APIConfig = {
	platform: string;
	port: number;
};

type LeagueConfig = {
	id: string;
};

export const config: Config = {
	api: {
		platform: envOrThrow('PLATFORM'),
		port: Number(envOrThrow('PORT')),
	},
	league: {
		id: envOrThrow('LEAGUEID'),
	},
};
