CREATE TABLE "nfl_players" (
	"player_id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"active" boolean NOT NULL,
	"fantasy_positions" text[],
	"position" text,
	"team" text,
	"number" integer,
	"age" integer,
	"injury_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_users" (
	"user_id" text NOT NULL,
	"league_id" text NOT NULL,
	"avatar_id" text,
	"team_name" text,
	"is_owner" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_user_identity" PRIMARY KEY("user_id","league_id")
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"league_id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"season" text NOT NULL,
	"league_name" text NOT NULL,
	"avatar_id" text NOT NULL,
	"previous_league_id" text,
	"draft_id" text NOT NULL,
	"roster_positions" text[] NOT NULL,
	"total_rosters" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_season_unique" UNIQUE("season")
);
--> statement-breakpoint
CREATE TABLE "rosters" (
	"owner_id" text NOT NULL,
	"league_id" text NOT NULL,
	"season" text NOT NULL,
	"roster_id" integer NOT NULL,
	"starters" text[] NOT NULL,
	"wins" integer NOT NULL,
	"ties" integer NOT NULL,
	"losses" integer NOT NULL,
	"fpts_against" integer NOT NULL,
	"fpts" integer NOT NULL,
	"players" text[] NOT NULL,
	"reserve" text[],
	"streak" text,
	"record" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roster_identity" PRIMARY KEY("league_id","roster_id")
);
--> statement-breakpoint
CREATE TABLE "sleeper_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_name" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "league_users" ADD CONSTRAINT "league_users_user_id_sleeper_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sleeper_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_users" ADD CONSTRAINT "league_users_league_id_leagues_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_owner_id_sleeper_users_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."sleeper_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_league_id_leagues_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("league_id") ON DELETE no action ON UPDATE no action;

ALTER TABLE league_users
ADD CONSTRAINT league_users_league_fkey
FOREIGN KEY (league_id, season)
REFERENCES leagues (league_id, season);