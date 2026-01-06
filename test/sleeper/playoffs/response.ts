[
    { r: 1, m: 1, t1: 3, t2: 6, w: null, l: null },
    { r: 1, m: 2, t1: 4, t2: 5, w: null, l: null },

    { r: 2, m: 3, t1: 1, t2: null, t2_from: { w: 1 }, w: null, l: null },
    { r: 2, m: 4, t1: 2, t2: null, t2_from: { w: 2 }, w: null, l: null },
    { r: 2, m: 5, t1: null, t2: null, t1_from: { l: 1 }, t2_from: { l: 2 }, w: null, l: null, p: 5 },

    { r: 3, m: 6, t1: null, t2: null, t1_from: { w: 3 }, t2_from: { w: 4 }, w: null, l: null, p: 1 },
    { r: 3, m: 7, t1: null, t2: null, t1_from: { l: 3 }, t2_from: { l: 4 }, w: null, l: null, p: 3 }
];

const repsonse = {
    matchups: [
        {
            bracketType: 'winners_bracket',
            theBracket: [
                // round 1 matchup id 1
                {
                    m: 1,
                    r: 1,
                    l: 2,
                    w: 7,
                    t1: 2,
                    t2: 7
                },
                // round 1 matchup id 2
                {
                    m: 2,
                    r: 1,
                    l: 8,
                    w: 4,
                    t1: 8,
                    t2: 4
                },
                // round 2 matchup up, with matchup id 3
                // this player roster id 9 sits waiting for the outcome of matchup id 1
                // sleeper will update this response and update the t2_from property
                // with the id of the winner of matchup 1, in this case it was roster id 7
                {
                    m: 3,
                    r: 2,
                    l: 7,
                    w: 9,
                    t1: 9,
                    t2: 7,
                    t2_from: {
                        w: 1
                    }
                },
                // round 2 matchup up, with matchup id 4
                // this player roster id 3 sits waiting for the outcome of matchup id 2
                // sleeper will update this response and update the t2_from property
                // with the id of the winner of matchup 1, in this case it was roster id 4
                {
                    m: 4,
                    r: 2,
                    l: 4,
                    w: 3,
                    t1: 3,
                    t2: 4,
                    t2_from: {
                        w: 2
                    }
                },

                /**
                 * this is a round 2 matchup of the losers of matchup id 1 and 2. competing for 5th place.
                 * im assuming t1 and t2 are initially NULL|UNDEFINED?
                 * SLEEPER ALSO SAYS IT COULD BE AN OBJECT...
                 * SO WE NEED TO
                 * t1 - int - The roster_id of a team in this matchup OR {w: 1} which means the winner of match id 1
                 * t2 - int - The roster_id of the other team in this matchup OR {l: 1} which means the loser of match id 1
                 * but you can see in the top of the file that sleepers mock response shows null values for TBD matchups...
                */
                {
                    m: 5,
                    r: 2,
                    l: 2,
                    w: 8,
                    p: 5,
                    t1: 2,
                    t2: 8,
                    t1_from: {
                        l: 1
                    },
                    t2_from: {
                        l: 2
                    }
                },
                {
                    m: 6,
                    r: 3,
                    l: 3,
                    w: 9,
                    p: 1,
                    t1: 9,
                    t2: 3,
                    t1_from: {
                        w: 3
                    },
                    t2_from: {
                        w: 4
                    }
                },
                {
                    m: 7,
                    r: 3,
                    l: 7,
                    w: 4,
                    p: 3,
                    t1: 7,
                    t2: 4,
                    t1_from: {
                        l: 3
                    },
                    t2_from: {
                        l: 4
                    }
                }
            ]
        },
        {
            bracketType: 'losers_bracket',
            theBracket: [
                {
                    m: 1,
                    r: 1,
                    l: 1,
                    w: 6,
                    t1: 1,
                    t2: 6
                },
                {
                    m: 2,
                    r: 1,
                    l: 12,
                    w: 5,
                    t1: 12,
                    t2: 5
                },
                {
                    m: 3,
                    r: 2,
                    l: 6,
                    w: 10,
                    t1: 10,
                    t2: 6,
                    t2_from: {
                        w: 1
                    }
                },
                {
                    m: 4,
                    r: 2,
                    l: 11,
                    w: 5,
                    t1: 11,
                    t2: 5,
                    t2_from: {
                        w: 2
                    }
                },
                {
                    m: 5,
                    r: 2,
                    l: 12,
                    w: 1,
                    p: 5,
                    t1: 1,
                    t2: 12,
                    t1_from: {
                        l: 1
                    },
                    t2_from: {
                        l: 2
                    }
                },
                {
                    m: 6,
                    r: 3,
                    l: 10,
                    w: 5,
                    p: 1,
                    t1: 10,
                    t2: 5,
                    t1_from: {
                        w: 3
                    },
                    t2_from: {
                        w: 4
                    }
                },
                {
                    m: 7,
                    r: 3,
                    l: 11,
                    w: 6,
                    p: 3,
                    t1: 6,
                    t2: 11,
                    t1_from: {
                        l: 3
                    },
                    t2_from: {
                        l: 4
                    }
                }
            ]
        }
    ]
};