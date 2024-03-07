# [START gae_flex_quickstart]
from flask import Flask, make_response
from pybaseball import batting_stats, pitching_stats, team_batting, team_pitching
import pandas as pd
import io

app = Flask(__name__)

battingCategories = [
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
pitchingCategories = [
    "Name",
    "Team",
    "ERA",
    "ERA-",
    "FIP",
    "xFIP",
    "FIP-",
    "xFIP-",
    "WHIP",
    "SIERA",
]
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
    "WSN": "Wsh",
}
nameCorrections = {
    "Luis Robert": "Luis Robert Jr.",
    "Cedric Mullins II": "Cedric Mullins",
    "T.J. Friedl": "TJ Friedl",
}


@app.route("/")
def hello():
    bdf = batting_stats(2022, qual=1)[battingCategories]
    pdf = pitching_stats(2023, qual=1)[pitchingCategories]
    oppdf = team_batting(2023)
    oppdf["Points"] = oppdf.apply(
        lambda row: row["H"] - row["SO"] + row["BB"] + row["R"] * 2 * 0.92,
        axis=1,
    )
    oppdf.rename(columns={"Team": "Name"}, inplace=True)
    oppdf["PRank"] = oppdf["Points"].rank(ascending=False)
    oppdf["Team"] = "-"

    boppdf = team_pitching(2023)
    print(boppdf.columns.tolist())
    boppdf["Points"] = boppdf.apply(
        lambda row: row["H"] - row["SO"] + row["BB"] + row["R"] * 2 * 0.92,
        axis=1,
    )
    boppdf.rename(columns={"Team": "Name"}, inplace=True)
    boppdf["BRank"] = boppdf["Points"].rank(ascending=True)
    boppdf["Team"] = "-"

    df = pd.concat(
        [bdf, pdf, oppdf[["Name", "PRank", "Team"]], boppdf[["Name", "BRank", "Team"]]],
        ignore_index=True,
    )

    df["Team"].replace(teamCorrections, inplace=True)
    df["Name"].replace(nameCorrections, inplace=True)

    for index, row in df.iterrows():
        team = df.at[index, "Name"]
        if team in teamCorrections:
            df.at[index, "Name"] = teamCorrections[team]

    agg = {col: "sum" if col not in ["Name", "Team"] else "first" for col in df.columns}
    df = df.groupby(["Name", "Team"]).aggregate(agg)

    df["lastcol"] = "-"

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    response = make_response(output.read())
    response.headers["Content-Disposition"] = "attachment; filename=data.csv"
    response.headers["Content-Type"] = "text/csv"

    return response


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)
