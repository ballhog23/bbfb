import * as z from "zod";

const stringOrUndefined = z.union([z.string(), z.undefined()]);
/**
 * stringOrUndefined?
 * A lot of the metadata tied to a user is undefined because it requires that the user
 * has actually interacted with that setting in the Sleeper app/settings.
 * This is okay, we will replace the undefined values with null.
 * Why is team_name stringOrUndefined in LeagueUserSchema?
 * One particular league member has not actually set a teamname... waylen
 * and is instead defaulted to their username as their team name.
 */
export const LeagueUserSchema = z.object({
    avatar: z.string(),
    display_name: z.string(),
    is_bot: z.boolean(),
    is_owner: z.boolean(),
    league_id: z.string(),
    metadata: z.object({
        allow_pn: z.string(),
        mascot_item_type_id_leg_13: stringOrUndefined,
        team_name_update: stringOrUndefined,
        join_voice_pn: stringOrUndefined,
        transaction_free_agent: stringOrUndefined,
        mascot_item_type_id_leg_17: stringOrUndefined,
        mascot_item_type_id_leg_12: stringOrUndefined,
        mascot_item_type_id_leg_1: stringOrUndefined,
        player_like_pn: stringOrUndefined,
        mascot_item_type_id_leg_9: stringOrUndefined,
        mascot_item_type_id_leg_4: stringOrUndefined,
        show_mascots: stringOrUndefined,
        transaction_commissioner: stringOrUndefined,
        mascot_item_type_id_leg_3: stringOrUndefined,
        mascot_item_type_id_leg_18: stringOrUndefined,
        mascot_item_type_id_leg_10: stringOrUndefined,
        mascot_item_type_id_leg_5: stringOrUndefined,
        mascot_message: stringOrUndefined,
        trade_block_pn: stringOrUndefined,
        mascot_item_type_id_leg_7: stringOrUndefined,
        mascot_item_type_id_leg_14: stringOrUndefined,
        mascot_item_type_id_leg_6: stringOrUndefined,
        user_message_pn: stringOrUndefined,
        mascot_item_type_id_leg_11: stringOrUndefined,
        mascot_item_type_id_leg_2: stringOrUndefined,
        mention_pn: stringOrUndefined,
        player_nickname_update: stringOrUndefined,
        transaction_waiver: stringOrUndefined,
        mascot_item_type_id_leg_15: stringOrUndefined,
        mascot_message_emotion_leg_1: stringOrUndefined,
        team_name: stringOrUndefined,
        mascot_item_type_id_leg_8: stringOrUndefined,
        avatar: stringOrUndefined,
        mascot_item_type_id_leg_16: stringOrUndefined,
        transaction_trade: stringOrUndefined
    }),
    settings: z.null(),
    user_id: z.string()
});

export type LeagueUser = z.infer<typeof LeagueUserSchema>;
export type LeagueUserData = {
    displayName: string,
    teamName: string | null,
    userId: string
};

const NFLPlayer = z.object({
    hashtag: z.string(),
    depth_chart_position: z.number(),
    status: z.string(),
    sport: z.string(),
    fantasy_positions: z.array(z.string()),
    number: z.number(),
    search_last_name: z.string(),
    injury_start_date: z.null(),
    weight: z.string(),
    position: z.string(),
    practice_participation: z.null(),
    sportradar_id: z.string(),
    team: z.string(),
    last_name: z.string(),
    college: z.string(),
    fantasy_data_id: z.number(),
    injury_status: z.null(),
    player_id: z.string(),
    height: z.string(),
    search_full_name: z.string(),
    age: z.number(),
    stats_id: z.string(),
    birth_country: z.string(),
    espn_id: z.string(),
    search_rank: z.number(),
    first_name: z.string(),
    depth_chart_order: z.number(),
    years_exp: z.number(),
    rotowire_id: z.null(),
    rotoworld_id: z.number(),
    search_first_name: z.string(),
    yahoo_id: z.null()
});

const NFLPlayerKeys = z.union([z.string(), z.number()]);
export const NFLPlayerSchema = z.record(NFLPlayerKeys, NFLPlayer);

