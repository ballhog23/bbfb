# Findings

## Rivalry page: scroll after CHECK THE STATS

Revisit this on the dev server, in a real browser. The design canvas in the Claude desktop app does not show the same result as the headless tests.

- Expected: after a click on CHECK THE STATS, the selection area shrinks and moves up under the nav bar. The roast shows fully, 3rem below the banner.
- Seen in the canvas: on narrow screens, the roast was partly or fully under the banner.
- Headless test result: the roast shows fully at widths from 320px to 1920px.
- Current method: `scrollIntoView()` on `.sel-anchor`, with `scroll-margin-top:5rem` (the nav bar height). The scroll starts two frames after the stats render. After the shrink, the code checks the position again and scrolls again if needed.
- Also check: resize the window while the banner is compact. The page must keep the same place in the stats.

## Champions Hall page: unique champions list

Write a new query that returns the Sleeper username of each unique champion. Do not use the roster team name.

- Why: a Sleeper user has one account and one username. The roster team name can change each season, so one user can have many team names.
- The section must show one name for each unique user.
- Start from `selectDistinctChamps()` in `src/db/queries/champions-hall.ts`. It already counts distinct `sleeperUsersTable.userId` for the week 17 winners bracket, place 1. Return the usernames, not only the count.
- `sleeperUsersTable.displayName` is the username column that `selectChampionInfo()` already reads.
- The design board uses names typed into the page for now: Twisted TiT Teas, bleed median, JerrysGloryHole. These are team names.

## Champions Hall page: season stories

Each season section tells a short story about that season's champion. The story has three parts:

1. Fixed sentence, from the season data: "{team} went {record} in the regular season and put up {total points} points."
2. Roast: a custom sentence or two for each season. Caleb writes it by hand once a year, after a new champion wins.
   - If a season has no custom roast, show the default: "That's a lot of points for someone who claims to have a job." This prevents a gap before Caleb writes the new roast.
3. Fixed sentences, from the season data: "In the title game they dropped {finals score} on {defeated team}. {MVP} was the MVP for this roster throughout the regular season."

- Build a data structure with a custom roast field for each season. Show the default roast when the field is empty.
- Example roast for Team One (2025): "We will never understand why you want to send us all of your shitty players for our best players, but you do you broski. We enjoy opening up your trade requests because we know we will get to say, 'In your f*cking dreams. Pussy.'"

## Champions Hall page: dynasty section title

Make the dynasty section title change with the number of users who have won more than one championship.

- When the data is fetched, count the users with more than one championship. This can be at build time or for each request. Server-side rendering or a static build is not decided yet.
- If the count is more than 1, use: "These are the f\*ckers who have won more than one championship"
- If the count is 1, use: "This is the f\*cker who has won more than one championship"
- The quote under the list uses the same count.
  - More than 1: "Congrats, now go touch grass you f\*cking nerds. 🖕🤣"
  - 1: "Congrats, now go touch grass you f\*cking nerd. 🖕🤣"
- Now, only one user has won more than one championship.
- The list under the title needs the same data: the Sleeper username and the championship count of each of these users.
- `selectWinningestChamp()` in `src/db/queries/champions-hall.ts` returns only one user now. Change it, or write a new query, to return all of these users.
