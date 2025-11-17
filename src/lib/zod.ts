import * as z from "zod";

/**
 * allowing null values?
 * A lot of the metadata tied to a user is undefined because it requires that the user
 * has actually interacted with that setting in the Sleeper app/settings.
 * This is okay, we will replace the undefined values with null.
 * 
 * We use looseObject for the same reason above, when it comes to metadata, 
 * i've noticed that sleeper adds additional keys based on interaction with settings or 
 * features like player nicknames, we don't want to not parse any 'extra' data that is added on to the response
 * because we may use that additional data for a future feature.
 * 
 * right now we are focusing on the required data shape, and further narrowing that data
 * before we store it in the database.
 */

const nullishStringArray = z.nullish(z.array(z.string()));
const nullishUnknownArray = z.nullish(z.array(z.unknown()));
const nullishUnknown = z.nullish(z.unknown())
const nullishString = z.nullish(z.string());
const nullishNumber = z.nullish(z.number());

export const leagueSchema = z.looseObject({
    name: z.string(),
    status: z.string(),
    metadata: z.object({
        auto_continue: nullishString,
        division_1: z.string(),
        division_2: z.string(),
        keeper_deadline: nullishString,
        squad_id: z.string()
    }),
    settings: z.object({
        best_ball: z.number(),
        last_report: z.number(),
        waiver_budget: z.number(),
        disable_adds: z.number(),
        divisions: z.number(),
        capacity_override: z.number(),
        taxi_deadline: z.number(),
        draft_rounds: z.number(),
        reserve_allow_na: z.number(),
        start_week: z.number(),
        playoff_seed_type: z.number(),
        playoff_teams: z.number(),
        veto_votes_needed: nullishNumber,
        squads: z.number(),
        num_teams: z.number(),
        daily_waivers_hour: z.number(),
        playoff_type: z.number(),
        taxi_slots: z.number(),
        sub_start_time_eligibility: nullishNumber,
        last_scored_leg: z.number(),
        daily_waivers_days: z.number(),
        sub_lock_if_starter_active: nullishNumber,
        playoff_week_start: z.number(),
        waiver_clear_days: z.number(),
        reserve_allow_doubtful: z.number(),
        commissioner_direct_invite: nullishNumber,
        veto_auto_poll: nullishNumber,
        reserve_allow_dnr: z.number(),
        taxi_allow_vets: z.number(),
        waiver_day_of_week: z.number(),
        playoff_round_type: z.number(),
        reserve_allow_out: z.number(),
        reserve_allow_sus: z.number(),
        veto_show_votes: nullishNumber,
        trade_deadline: z.number(),
        taxi_years: z.number(),
        daily_waivers: z.number(),
        faab_suggestions: nullishNumber,
        disable_trades: z.number(),
        pick_trading: z.number(),
        type: z.number(),
        max_keepers: z.number(),
        waiver_type: z.number(),
        max_subs: nullishNumber,
        league_average_match: z.number(),
        trade_review_days: z.number(),
        bench_lock: z.number(),
        offseason_adds: z.number(),
        leg: z.number(),
        reserve_slots: z.number(),
        reserve_allow_cov: z.number(),
        daily_waivers_last_ran: z.number()
    }),
    avatar: z.string(),
    company_id: z.null(),
    shard: z.number(),
    season: z.string(),
    season_type: z.string(),
    sport: z.string(),
    scoring_settings: z.object({
        sack: z.number(),
        fgm_40_49: z.number(),
        pass_int: z.number(),
        pts_allow_0: z.number(),
        pass_2pt: z.number(),
        st_td: z.number(),
        rec_td: z.number(),
        fgm_30_39: z.number(),
        xpmiss: z.number(),
        rush_td: z.number(),
        rec_2pt: z.number(),
        st_fum_rec: z.number(),
        fgmiss: z.number(),
        ff: z.number(),
        rec: z.number(),
        pts_allow_14_20: z.number(),
        fgm_0_19: z.number(),
        int: z.number(),
        def_st_fum_rec: z.number(),
        fum_lost: z.number(),
        pts_allow_1_6: z.number(),
        fgm_20_29: z.number(),
        pts_allow_21_27: z.number(),
        xpm: z.number(),
        rush_2pt: z.number(),
        fum_rec: z.number(),
        def_st_td: z.number(),
        fgm_50p: z.number(),
        def_td: z.number(),
        safe: z.number(),
        pass_yd: z.number(),
        blk_kick: z.number(),
        pass_td: z.number(),
        rush_yd: z.number(),
        fum: z.number(),
        pts_allow_28_34: z.number(),
        pts_allow_35p: z.number(),
        fum_rec_td: z.number(),
        rec_yd: z.number(),
        def_st_ff: z.number(),
        pts_allow_7_13: z.number(),
        st_ff: z.number()
    }),
    last_message_id: z.string(),
    last_author_avatar: z.null(),
    last_author_display_name: z.string(),
    last_author_id: z.string(),
    last_author_is_bot: z.boolean(),
    last_message_attachment: z.null(),
    last_message_text_map: z.null(),
    last_message_time: z.number(),
    last_pinned_message_id: z.null(),
    last_read_id: z.null(),
    draft_id: z.string(),
    league_id: z.string(),
    previous_league_id: nullishString,
    bracket_id: nullishNumber,
    bracket_overrides_id: z.null(),
    group_id: z.null(),
    loser_bracket_id: nullishNumber,
    loser_bracket_overrides_id: z.null(),
    roster_positions: z.array(z.string()),
    total_rosters: z.number()
});
export type LeagueSchema = z.infer<typeof leagueSchema>;

export const rosterSchema = z.looseObject({
    starters: z.array(z.string()),
    settings: z.object({
        wins: z.number(),
        waiver_position: z.number(),
        waiver_budget_used: z.number(),
        total_moves: z.number(),
        ties: z.number(),
        losses: z.number(),
        fpts_decimal: z.number(),
        fpts_against_decimal: z.number(),
        fpts_against: z.number(),
        fpts: z.number()
    }),
    roster_id: z.number(),
    reserve: nullishStringArray,
    players: z.array(z.string()),
    owner_id: z.string(),
    league_id: z.string()
});
export type RosterSchema = z.infer<typeof rosterSchema>;

export const leagueUserSchema = z.looseObject({
    avatar: z.string(),
    display_name: z.string(),
    is_bot: z.boolean(),
    is_owner: z.boolean(),
    league_id: z.string(),
    metadata: z.object({
        allow_pn: z.string(),
        mascot_item_type_id_leg_13: nullishString,
        team_name_update: nullishString,
        join_voice_pn: nullishString,
        transaction_free_agent: nullishString,
        mascot_item_type_id_leg_17: nullishString,
        mascot_item_type_id_leg_12: nullishString,
        mascot_item_type_id_leg_1: nullishString,
        player_like_pn: nullishString,
        mascot_item_type_id_leg_9: nullishString,
        mascot_item_type_id_leg_4: nullishString,
        show_mascots: nullishString,
        transaction_commissioner: nullishString,
        mascot_item_type_id_leg_3: nullishString,
        mascot_item_type_id_leg_18: nullishString,
        mascot_item_type_id_leg_10: nullishString,
        mascot_item_type_id_leg_5: nullishString,
        mascot_message: nullishString,
        trade_block_pn: nullishString,
        mascot_item_type_id_leg_7: nullishString,
        mascot_item_type_id_leg_14: nullishString,
        mascot_item_type_id_leg_6: nullishString,
        user_message_pn: nullishString,
        mascot_item_type_id_leg_11: nullishString,
        mascot_item_type_id_leg_2: nullishString,
        mention_pn: nullishString,
        player_nickname_update: nullishString,
        transaction_waiver: nullishString,
        mascot_item_type_id_leg_15: nullishString,
        mascot_message_emotion_leg_1: nullishString,
        team_name: nullishString,
        mascot_item_type_id_leg_8: nullishString,
        avatar: nullishString,
        mascot_item_type_id_leg_16: nullishString,
        transaction_trade: nullishString
    }),
    settings: z.null(),
    user_id: z.string()
});
export type LeagueUserSchema = z.infer<typeof leagueUserSchema>;
export type LeagueUser = {
    displayName: string,
    teamName: string | null,
    userId: string
};
const NFLPlayerKeys = z.union([z.string(), z.number(), z.symbol()]);
export const NFLPlayerSchema = z.looseObject({
    position: nullishString,
    first_name: z.string(),
    last_name: z.string(),
    active: z.boolean(),
    player_id: z.string(),
    team: nullishString,
    metadata: z.nullish(z.record(NFLPlayerKeys, z.unknown())),
    team_abbr: nullishString,
    injury_status: nullishString,
    college: nullishString,
    search_full_name: nullishString,
    age: nullishNumber,
    oddsjam_id: nullishString,
    search_last_name: nullishString,
    injury_body_part: nullishString,
    rotoworld_id: nullishNumber,
    opta_id: nullishUnknown,
    birth_state: nullishString,
    news_updated: nullishNumber,
    high_school: nullishString,
    stats_id: nullishNumber,
    rotowire_id: nullishNumber,
    depth_chart_position: nullishString,
    search_first_name: nullishString,
    hashtag: nullishString,
    team_changed_at: nullishUnknown,
    player_shard: nullishString,
    status: nullishString,
    sportradar_id: nullishString,
    swish_id: nullishNumber,
    birth_country: nullishString,
    practice_description: nullishString,
    yahoo_id: nullishNumber,
    depth_chart_order: nullishNumber,
    kalshi_id: nullishString,
    fantasy_positions: nullishStringArray,
    injury_start_date: nullishUnknown,
    height: nullishString,
    practice_participation: nullishString,
    years_exp: nullishNumber,
    pandascore_id: nullishUnknown,
    fantasy_data_id: nullishNumber,
    sport: z.string(),
    full_name: nullishString,
    search_rank: nullishNumber,
    birth_city: nullishString,
    weight: nullishString,
    birth_date: nullishString,
    espn_id: nullishNumber,
    gsis_id: nullishString,
    competitions: nullishUnknownArray,
    injury_notes: nullishString,
    number: nullishNumber
});

export type NFLPlayer = z.infer<typeof NFLPlayerSchema>
export type RefinedNFLPlayer = {
    playerId: string
    firstName: string
    lastName: string
    active: boolean
    fantasyPositions: string[] | null
    position: string | null
    team: string | null
}