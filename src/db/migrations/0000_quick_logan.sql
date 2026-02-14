CREATE TYPE "public"."result" AS ENUM('W', 'L', 'T', 'BYE');--> statement-breakpoint
CREATE TYPE "public"."season_type" AS ENUM('regular', 'post', 'off');--> statement-breakpoint
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
CREATE TABLE "league_state" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"week" integer NOT NULL,
	"leg" integer NOT NULL,
	"season" text NOT NULL,
	"season_type" "season_type" NOT NULL,
	"previous_season" text NOT NULL,
	"display_week" integer NOT NULL,
	"is_league_active" boolean NOT NULL,
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
CREATE TABLE "matchup_outcomes" (
	"league_id" text NOT NULL,
	"matchup_id" integer,
	"week" integer NOT NULL,
	"roster_id" integer NOT NULL,
	"roster_owner_id" text NOT NULL,
	"outcome" "result" NOT NULL,
	"season" text NOT NULL,
	"points_for" numeric NOT NULL,
	"points_against" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matchup_outcome_identity" PRIMARY KEY("league_id","roster_owner_id","week","roster_id")
);
--> statement-breakpoint
CREATE TABLE "matchups" (
	"league_id" text NOT NULL,
	"season" text NOT NULL,
	"week" integer NOT NULL,
	"points" numeric NOT NULL,
	"players" text[] NOT NULL,
	"roster_id" integer NOT NULL,
	"matchup_id" integer,
	"starters" text[] NOT NULL,
	"starters_points" numeric[] NOT NULL,
	"players_points" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matchups_identity" PRIMARY KEY("league_id","roster_id","week")
);
--> statement-breakpoint
CREATE TABLE "playoff_bracket_matchups" (
	"league_id" text NOT NULL,
	"bracket_type" text NOT NULL,
	"bracket_matchup_id" integer NOT NULL,
	"matchup_id" integer,
	"week" integer NOT NULL,
	"round" integer NOT NULL,
	"loser_id" integer,
	"winner_id" integer,
	"place" integer,
	"t1" integer,
	"t2" integer,
	"t1_from_winner" integer,
	"t1_from_loser" integer,
	"t2_from_winner" integer,
	"t2_from_loser" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "playoff_bracket_matchups_identity" PRIMARY KEY("league_id","bracket_type","bracket_matchup_id")
);
--> statement-breakpoint
CREATE TABLE "rosters" (
	"roster_owner_id" text NOT NULL,
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
	"division" integer NOT NULL,
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
ALTER TABLE "matchup_outcomes" ADD CONSTRAINT "matchup_outcomes_roster_owner_id_sleeper_users_user_id_fk" FOREIGN KEY ("roster_owner_id") REFERENCES "public"."sleeper_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_outcomes" ADD CONSTRAINT "matchups_league_rosters_identity" FOREIGN KEY ("league_id","roster_id") REFERENCES "public"."rosters"("league_id","roster_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "league_rosters_identity" FOREIGN KEY ("league_id","roster_id") REFERENCES "public"."rosters"("league_id","roster_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_bracket_matchups" ADD CONSTRAINT "playoff_bracket_matchups_league_id_leagues_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_roster_owner_id_sleeper_users_user_id_fk" FOREIGN KEY ("roster_owner_id") REFERENCES "public"."sleeper_users"("user_id") ON DELETE no action ON UPDATE no action;