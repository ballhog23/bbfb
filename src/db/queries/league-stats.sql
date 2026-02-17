-- this selects points scored all time
SELECT
    SUM(mo.points_for + mo2.points_for) as total_pts
from
    matchup_outcomes mo
inner join
    matchup_outcomes mo2 ON
    mo.league_id = mo2.league_id AND
    mo.week = mo2.week AND
    mo.matchup_id = mo2.matchup_id
where 
    mo.roster_id < mo2.roster_id;

-- this selects points scored per season
SELECT
    mo.league_id,
    mo.season,
    SUM(mo.points_for + mo2.points_for) as total_pts
from
    matchup_outcomes mo
inner join
    matchup_outcomes mo2 ON mo.league_id = mo2.league_id AND
    mo.week = mo2.week AND
    mo.matchup_id = mo2.matchup_id
where
    mo.roster_id < mo2.roster_id
group by
    mo.league_id,
    mo.season;

-- this selects points scored per week per season
SELECT
    mo.league_id,
    mo.season,
    mo.week,
    SUM(mo.points_for + mo2.points_for) as total_pts
from
    matchup_outcomes mo
inner join
    matchup_outcomes mo2 ON mo.league_id = mo2.league_id AND
    mo.week = mo2.week AND
    mo.matchup_id = mo2.matchup_id
where
    mo.roster_id < mo2.roster_id
group by
    mo.league_id,
    mo.season,
    mo.week
order by
    mo.season desc, mo.week asc;

-- this selects points scored per matchup per week per season
SELECT
    mo.league_id,
    mo.season,
    mo.week,
    mo.matchup_id,
    SUM(mo.points_for + mo2.points_for) as total_pts
from
    matchup_outcomes mo
inner join
    matchup_outcomes mo2 ON mo.league_id = mo2.league_id AND
    mo.week = mo2.week AND
    mo.matchup_id = mo2.matchup_id
where 
    mo.roster_id < mo2.roster_id
group by
    mo.league_id,
    mo.season,
    mo.week,
    mo.matchup_id
order by
    mo.season desc,
    mo.week asc,
    mo.matchup_id asc;

-- my approach was going to be to use these as separate CTEs
