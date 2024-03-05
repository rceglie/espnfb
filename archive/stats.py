from pybaseball import batting_stats, pitching_stats
import pandas as pd

if __name__ == "__main__":
    bdf = batting_stats(2023, qual=1)
    bdf = bdf[
        [
            "Name",
            "Team",
            "AVG",
            "OBP",
            "SLG",
            "OPS",
            "BABIP",
            "wRC+",
            "xBA",
            "wOBA",
            "xwOBA",
        ]
    ]

    pdf = pitching_stats(2023, qual=1)
    pdf = pdf[
        ["Name", "Team", "ERA", "ERA-", "FIP", "xFIP", "FIP-", "xFIP-", "WHIP", "SIERA"]
    ]

    df = pd.concat([bdf, pdf], ignore_index=True)

    teamCorrections = {
        "ARI": "Ari",
        "ATL": "Atl",
        "BAL": "Bal",
        "BOS": "Bos",
        "CHC": "ChC",
        "CWH": "ChW",
        "CIN": "Cin",
        "CLE": "Cle",
        "COL": "Col",
        "DET": "Det",
        "HOU": "Hou",
        "KCR": "KC",
        "LAA": "LAA",
        "LAD": "LAD",
        "MIA": "Mia",
        "MIL": "Mil",
        "MIN": "Min",
        "NYY": "NYY",
        "NYM": "NYM",
        "OAK": "Oak",
        "PHI": "Phi",
        "PIT": "Pit",
        "SDP": "SD",
        "SFG": "SF",
        "SEA": "Sea",
        "STL": "StL",
        "TBR": "TB",
        "TEX": "Tex",
        "TOR": "Tor",
        "WSH": "Wsh",
    }

    nameCorrections = {
        "Luis Robert": "Luis Robert Jr.",
        "Cedric Mullins II": "Cedric Mullins",
        "T.J. Friedl": "TJ Friedl",
        
    }

    df["Team"] = df["Team"].replace(teamCorrections)
    df["Name"] = df["Name"].replace(nameCorrections)

    agg = {col: "sum" if col not in ["Name", "Team"] else "first" for col in df.columns}
    df = df.groupby(["Name", "Team"]).aggregate(agg)

    df.to_csv("stats.csv", index=False)
    print("saved to pydata.csv")
