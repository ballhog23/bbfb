CREATE TABLE "leagues" (
	"league_id" text PRIMARY KEY NOT NULL,
	"status" boolean NOT NULL,
	"season" text NOT NULL,
	"league_name" text NOT NULL,
	"avatar_id" text NOT NULL,
	"previous_league_id" text,
	"roster_positions" text[] NOT NULL,
	"total_rosters" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
