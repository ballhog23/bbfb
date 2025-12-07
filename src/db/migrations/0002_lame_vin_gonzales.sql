CREATE TABLE "rosters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"league_id" text NOT NULL,
	"season" text NOT NULL,
	"roster_id" integer NOT NULL,
	"starters" text[],
	"wins" integer NOT NULL,
	"ties" integer NOT NULL,
	"losses" integer NOT NULL,
	"fpts_against" integer NOT NULL,
	"fpts" integer NOT NULL,
	"reserve" text[],
	"players" text[] NOT NULL,
	"streak" text,
	"record" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_owner_id_users_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_league_id_leagues_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_season_unique" UNIQUE("season");