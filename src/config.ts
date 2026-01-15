process.loadEnvFile();

export function envOrThrow(key: string) {
	const value = process.env[key];

	if (!value) throw new Error(`Env var ${key} is not set.`);

	return value;
}

type APIConfig = {
	platform: string;
	port: number;
};

type LeagueConfig = {
	id: string;
	season: string;
};

type DBConfig = {
	url: string;
	host?: string;
	dbname?: string;
	user?: string;
	password?: string;
};

export type Config = {
	api: APIConfig;
	league: LeagueConfig;
	db: DBConfig;
};

export const config: Config = {
	api: {
		platform: envOrThrow('PLATFORM'),
		port: Number(envOrThrow('PORT')),
	},
	league: {
		id: envOrThrow('LEAGUE_ID'),
		season: envOrThrow('LEAGUE_SEASON'),
	},
	db: {
		url: envOrThrow('DB_URL'),
	}
};