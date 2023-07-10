const STATS = {
  batting: {
    AVG: { color: true, round: 3 },
    OPS: { color: true, round: 3 },
    BABIP: { color: true, round: 3 },
    "wRC+": { color: true, round: 0 },
    dAVG: { color: true, round: 3 },
    xAVG: { color: true, round: 3 },
    wOBA: { color: true, round: 3 },
    xwOBA: { color: true, round: 3 },
    dwOBA: { color: true, round: 3 },
  },
  pitching: {
    ERA: { color: false, round: 2 },
    xERA: { color: false, round: 2 },
    dERA: { color: false, round: 2 },
    "ERA-": { color: false, round: 0 },
    FIP: { color: false, round: 2 },
    xFIP: { color: false, round: 2 },
    dFIP: { color: false, round: 2 },
    "FIP-": { color: false, round: 0 },
    "xFIP-": { color: false, round: 0 },
    "dFIP-": { color: true, round: 0 },
    WHIP: { color: false, round: 2 },
  },
};

export default STATS;
