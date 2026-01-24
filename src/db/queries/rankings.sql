-- Gets distinct matchups, per week
WITH distinct_matchups AS (
    SELECT DISTINCT ON (week, matchup_id) *
    FROM
        matchup_outcomes
    WHERE
        week < 15 AND
        season = '2025'
    ORDER BY
        week, matchup_id, league_user_id
),
-- Gets total matchup points per matchup, per week
matchup_totals AS (
    SELECT 
        SUM(COALESCE(points_for, 0)) + SUM(COALESCE(points_against, 0)) as total_match_points,
        matchup_id,
        week,
        season
    FROM
        distinct_matchups
    GROUP BY 
        matchup_id,
        week,
        season
    ORDER BY week, matchup_id, season
)
-- Sums all matchup points per week
SELECT
    SUM(COALESCE(total_match_points, 0)) as total_weekly_matchup_points,
    week,
    season
FROM matchup_totals
GROUP BY
    week,
    season
ORDER BY week;

-- League Median
WITH distinct_matchups AS (
    SELECT DISTINCT ON (week, matchup_id)
        week,
        season,
        points_for,
        points_against
    FROM matchup_outcomes
    WHERE
        week < 15
        AND season = '2025'
    ORDER BY
        week,
        matchup_id
),
weekly_scores AS (
    SELECT
        week,
        season,
        score
    FROM distinct_matchups
    CROSS JOIN LATERAL (
        VALUES
            (points_for),
            (points_against)
    ) AS scores(score)
)
SELECT
    week,
    season,
    ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY score)::numeric, 2) AS league_median_score
FROM weekly_scores
GROUP BY
    week,
    season
ORDER BY
    week;
