import fs from "fs";
import { parse } from "json2csv";
import fetch from "node-fetch";
import { spawn } from "child_process";
import csv from "csv-parser";

const TOKEN = "Bearer search-cty1wzhqd1pqueai45ccxh7y";
const REFRESH_PLAYERS = false;

async function fetchDataForLetter(letter, page) {
  const url =
    "https://85798c555f18463c9d3ec7d18778c367.ent-search.us-east1.gcp.elastic-cloud.com/api/as/v1/engines/fangraphs/search.json";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: letter,
      search_fields: {
        name: {},
      },
      page: {
        current: page,
        size: 1000,
      },
      result_fields: {
        id: {
          raw: {},
        },
        name: {
          raw: {},
        },
        firstname: {
          raw: {},
        },
        lastname: {
          raw: {},
        },
        team: {
          raw: {},
        },
        last_season: {
          raw: {},
        },
        birthdate: {
          raw: {},
        },
      },
    }),
  });
  let data = await response.json();
  data.results = data.results.map((obj) => {
    Object.keys(obj).forEach((key) => {
      if (key !== "_meta") {
        obj[key] = obj[key].raw;
      }
    });
    return obj;
  });
  return data;
}

async function getPlayers() {
  let players = [];

  for (let i = 0; i < 10; i++) {
    let startCount = players.length;
    const letter = String.fromCharCode(97 + i);
    console.log(`getting ${letter}`);
    let firstResponse = await fetchDataForLetter(letter, 1);
    players = players.concat(firstResponse.results);
    for (let page = 2; page <= firstResponse.meta.page.total_pages; page++) {
      let nextResponse = await fetchDataForLetter(letter, page);
      players = players.concat(nextResponse.results);
    }
    console.log(`unfiltered: ${players.length}`);
    let uniqueIds = new Set();
    let uniqueArray = [];
    for (let obj of players) {
      if (!uniqueIds.has(obj.id)) {
        uniqueIds.add(obj.id);
        uniqueArray.push(obj);
      }
    }
    players = uniqueArray;
    console.log(`filtered  : ${players.length}`);
    console.log(`${letter} DONE (+${players.length - startCount})`);
  }

  return players;
}

function filterPlayers(players) {
  // remove last played before 2020 or born after 1980 (40 years old)
  players = players.filter((obj) => {
    if (obj.last_season === null) {
      return (
        obj.birthdate !== null && parseInt(obj.birthdate.slice(0, 4)) > 1995
      );
    } else {
      return obj.last_season >= 2020;
    }
  });
  // get only needed columns and rename
  players = players.map((obj) => {
    const {
      firstname,
      last_season,
      name,
      team,
      lastname,
      _meta,
      id,
      birthdate,
    } = obj;
    return {
      name: name,
      team: team,
      fid: id,
      last_season: last_season,
      birthdate: birthdate,
    };
  });
  // map full team name to abbreviation
  const abbreviations = {
    Diamondbacks: "Ari",
    Braves: "Atl",
    Orioles: "Bal",
    "Red Sox": "Bos",
    Cubs: "ChC",
    "White Sox": "ChW",
    Reds: "Cin",
    Cleveland: "Cle",
    Rockies: "Col",
    Tigers: "Det",
    Astros: "Hou",
    Royals: "KC",
    Angels: "LAA",
    Dodgers: "LAD",
    Marlins: "Mia",
    Brewers: "Mil",
    Twins: "Min",
    Yankees: "NYY",
    Mets: "NYM",
    Athletics: "Oak",
    Phillies: "Phi",
    Pirates: "Pit",
    Padres: "SD",
    Giants: "SF",
    Mariners: "Sea",
    Cardinals: "StL",
    Rays: "TB",
    Rangers: "Tex",
    "Blue Jays": "Tor",
    Nationals: "Wsh",
  };
  players = players.map((obj) => {
    obj.team = abbreviations[obj.team];
    return { ...obj };
  });
  // get rid of accents
  const accentMap = {
    á: "a",
    é: "e",
    í: "i",
    ó: "o",
    ú: "u",
    ü: "u",
    ñ: "n",
    Á: "A",
    É: "E",
    Í: "I",
    Ó: "O",
    Ú: "U",
    Ü: "U",
    Ñ: "N",
  };
  players = JSON.parse(
    JSON.stringify(players).replace(
      /[áéíóúüñÁÉÍÓÚÜÑ]/g,
      (match) => accentMap[match]
    )
  );
  return players;
}

async function getStats(players) {
  const stats = JSON.parse(fs.readFileSync("stats.json", "utf8"));
  for (const [index, player] of players.entries()) {
    let foundPlayers = stats.filter((obj) => obj.name === player.name);
    if (foundPlayers === 1) {
      player = { ...player, ...foundPlayers[0] };
    } else if (foundPlayers > 1) {
      foundPlayers = foundPlayers.filter((obj) => obj.team === player.team);
      
    }
    player = { ...player, ...stats };
    //players[index] = { ...player, ...response[0] };
  }
  return players;
}

async function initiate() {
  let data = [];

  if (REFRESH_PLAYERS) {
    data = await getPlayers();
    data = filterPlayers(data);
  } else {
    const stream = fs.createReadStream("data.csv");
    for await (const row of stream.pipe(csv())) {
      data.push(row);
    }
  }

  const startTime = performance.now();
  data = await getStats(data);
  console.log("TIME:");
  console.log(performance.now() - startTime);

  fs.writeFile("data.csv", parse(data), "utf8", (err) => {
    if (err) {
      console.error("Error writing CSV to file:", err);
      return;
    }
    console.log("CSV data saved to data.csv");
  });
}

initiate();
