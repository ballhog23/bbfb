export type User = {
    user_id: string
    username: string
    [key: string]: any
}

export type NFLPlayer = {
    pandascore_id: any
    metadata: {
        channel_id: string
        rookie_year: string
    }
    birth_city: any
    hashtag: string
    birth_state: any
    injury_status: any
    high_school: string
    birth_country: any
    active: boolean
    sportradar_id: string
    search_last_name: string
    gsis_id: any
    oddsjam_id: string
    news_updated: number
    opta_id: any
    depth_chart_order: number
    competitions: Array<any>
    college: string
    depth_chart_position: string
    search_rank: number
    status: string
    years_exp: number
    yahoo_id: number
    injury_notes: any
    practice_description: any
    rotoworld_id: any
    team_changed_at: any
    stats_id: any
    last_name: string
    player_id: string
    espn_id: number
    weight: string
    birth_date: string
    team_abbr: any
    swish_id: number
    injury_body_part: any
    practice_participation: any
    player_shard: string
    kalshi_id: string
    full_name: string
    injury_start_date: any
    team: string
    search_full_name: string
    fantasy_positions: Array<string>
    first_name: string
    position: string
    rotowire_id: number
    height: string
    age: number
    fantasy_data_id: number
    search_first_name: string
    number: number
    sport: string
}