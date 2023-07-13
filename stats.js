const STATS = {
  batting: {
    AVG: {
      color: true,
      round: 3,
      tooltip:
        "<strong>AVG (Batting Average): </strong>Percent of at bats resulting in a hit.",
    },
    OBP: {
      color: true,
      round: 3,
      tooltip:
        "<strong>OBP (On Base Percentage): </strong>% of at bats where the batter gets on base, including HRs.",
    },
    SLG: {
      color: true,
      round: 3,
      tooltip:
        "<strong>SLG (Slugging): </strong>Average number of bases per at bat.",
    },
    OPS: {
      color: true,
      round: 3,
      tooltip:
        "<strong>OPS (On Base Plus Slugging): </strong>OBP + SLG. Better representation of hitting success than AVG.",
    },
    BABIP: {
      color: true,
      round: 3,
      tooltip:
        "<strong>BABIP (Batting Average on Balls in Play): </strong>AVG excluding HRs and Ks.",
    },
    "wRC+": {
      color: true,
      round: 0,
      tooltip:
        "<strong>wRC+ (Weighted Runs Created Plus):</strong> Very comprehensive statistic to measure hitting performance. Adjusted for park factors and normalized with league averages. 100 is league average, 120 is 20% better, 80 is 20% worse.",
    },
    xAVG: {
      color: true,
      round: 3,
      tooltip:
        "<strong>xAVG (Expected AVG): </strong>Uses league averages and other advanced stats to estimate what a batter's AVG should be.",
    },
    dAVG: {
      color: true,
      round: 3,
      tooltip:
        "<strong>dAVG (AVG Difference):</strong> Difference between actual AVG and xAVG. Can be used to estimate over or underperformance.",
    },
    wOBA: {
      color: true,
      round: 3,
      tooltip:
        "<strong>wOBA (Weighted On Base Average):</strong> Comprehensive statistic to measure hitter's offensive value.",
    },
    xwOBA: {
      color: true,
      round: 3,
      tooltip:
        "<strong>xwOBA (Expected wOBA):</strong> Uses league averages and other advanced stats to estimate what a batter's wOBA should be.",
    },
    dwOBA: {
      color: true,
      round: 3,
      tooltip:
        "<strong>dwOBA (wOBA Difference):</strong> Difference between actual wOBA and xwOBA. Can be used to estimate over or underperformance.",
    },
  },
  pitching: {
    ERA: {
      color: false,
      round: 2,
      tooltip:
        "<strong>ERA (Earned Run Average):</strong> Earned runs allowed per 9 innings.",
    },
    xERA: {
      color: false,
      round: 2,
      tooltip:
        "<strong>xERA (Expected ERA):</strong> Uses league averages and other advanced stats to determine what a player's ERA should be.",
    },
    dERA: {
      color: false,
      round: 2,
      tooltip:
        "<strong>dERA (ERA Difference):</strong> Difference between actual ERA and xERA. Can be used to estimate over or underperformance.",
    },
    "ERA-": {
      color: false,
      round: 0,
      tooltip:
        "<strong>ERA- (ERA Minus):</strong> ERA adjusted for park factors and normalized with league averages. 100 is league average, 80 is 20% better, 120 is 20% worse.",
    },
    FIP: {
      color: false,
      round: 2,
      tooltip:
        "<strong>FIP (Fielding Independent Pitching):</strong> Estimates a pitcher's run prevention independent of the performance of their team's defense/fielding.",
    },
    xFIP: {
      color: false,
      round: 2,
      tooltip:
        "<strong>xFIP (Expected FIP):</strong> Uses league averages and other advanced stats to determine what a player's FIP should be.",
    },
    dFIP: {
      color: false,
      round: 2,
      tooltip:
        "<strong>dFIP (FIP Difference):</strong> Difference between actual FIP and xFIP. Can be used to estimate over or underperformance.",
    },
    "FIP-": {
      color: false,
      round: 0,
      tooltip:
        "<strong>FIP- (FIP Minus):</strong> FIP adjusted for park factors and normalized with league averages. 100 is league average, 80 is 20% better, 120 is 20% worse.",
    },
    "xFIP-": {
      color: false,
      round: 2,
      tooltip:
        "<strong>xFIP- (Expected FIP-):</strong> Uses league averages and other advanced stats to determine what a player's FIP- should be.",
    },
    "dFIP-": {
      color: false,
      round: 2,
      tooltip:
        "<strong>dFIP- (FIP- Difference):</strong> Difference between actual FIP- and xFIP-. Can be used to estimate over or underperformance.",
    },
    WHIP: {
      color: false,
      round: 2,
      tooltip:
        "<strong>WHIP (Walk plus Hits per Innings Pitched):</strong> Number of baserunners allowed per inning.",
    },
    SIERA: {
      color: false,
      round: 2,
      tooltip:
        "<strong>SIERA (Skill-Interactive ERA):</strong> Most comprehensive ERA estimator. Also works well as a projection.",
    },
  },
};

export default STATS;
