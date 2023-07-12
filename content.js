let elapsedTime = 0;
const intervalId = setInterval(() => {
  var basediv = getBaseDiv();
  if (basediv["result"]) {
    clearInterval(intervalId);
    console.log("Page Loaded");
    setHandlers();
    mainProgram(basediv);
    return;
  }
  elapsedTime += 1;
  if (elapsedTime >= 10) {
    clearInterval(intervalId);
  }
}, 1000);

var STATS_CONFIG;
(async () => {
  const src = chrome.runtime.getURL("stats.js");
  STATS_CONFIG = (await import(src)).default;
})();

var mapping;
(async () => {
  const src = chrome.runtime.getURL("mapping.js");
  mapping = (await import(src)).default;
})();

// Communicate with popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.data === "need config") {
    sendResponse({
      response: JSON.parse(localStorage.getItem("addon-config")),
    });
  } else {
    localStorage.setItem("addon-config", JSON.stringify(request.data));
  }
});

function setHandlers() {
  var reloaded = false;
  const observer = new MutationObserver(function (mutations) {
    if (!reloaded) {
      reloaded = true;
      console.log("Page change detected. Beginning addon.");
      setTimeout(function () {
        mainProgram(getBaseDiv());
      }, 3000);
    } else {
      setTimeout(function () {
        reloaded = false;
      }, 2000);
    }
  });
  const divElement =
    document.querySelector("div.layout.is-full").firstChild.firstChild;
  observer.observe(divElement, {
    attributes: true,
    childList: true, //, subtree: true
  });
}

function mainProgram(basediv) {
  var stype = basediv["type"];
  if (!basediv["result"]) {
    // Wrong page (no stat tables)
    return;
  } else {
    console.log("Remaking tables");
    localStorage.setItem("type", stype);
    console.log(localStorage.getItem("addon-config"));
    var stats = JSON.parse(localStorage.getItem("addon-config"))[stype];
    if (stats.length > 0) {
      createTable(stats);
      insertData(basediv["element"], stype, stats);
    }
  }
}

function createTable(stats) {
  var basediv = getBaseDiv();
  var masterList =
    basediv["element"].parentElement.parentElement.parentElement.firstChild
      .childNodes[4];
  var base = basediv["element"].parentElement.parentElement.parentElement;

  // Remove old table
  const oldTable = document.getElementById("advanced-table");
  oldTable?.remove();

  // Create the new table and its structure
  var table = document.createElement("table");
  table.className = "Table Table--align-right Table--fixed Table--fixed-right";
  table.setAttribute(
    "style",
    "border-collapse: collapse; border-spacing: 0px;"
  );
  table.id = "advanced-table";

  var thead = document.createElement("thead");
  thead.className = "Table__header-group Table__THEAD";

  var tr1 = document.createElement("tr");
  tr1.className = "Table__TR Table__even";
  thead.appendChild(tr1);
  var th1 = document.createElement("th");
  th1.setAttribute("title", "Advanced Stats");
  th1.setAttribute("colspan", `${stats.length}`);
  th1.className = "tc bg-clr-white Table__TH";
  th1.innerHTML = "Advanced Stats";
  tr1.appendChild(th1);

  var tr2 = document.createElement("tr");
  tr2.className = "Table__sub-header Table__TR Table__even";
  tr2.setAttribute("style", "height: auto;");
  thead.appendChild(tr2);

  stats.forEach((stat) => {
    var th = document.createElement("th");
    th.className = `Table__TH ${stat}`;
    tr2.appendChild(th);
    var div = document.createElement("div");
    div.className = "jsx-2810852873 table--cell tar header";
    th.appendChild(div);
    var span = document.createElement("span");
    span.innerHTML = stat;
    div.appendChild(span);
  });

  var tbody = document.createElement("tbody");
  tbody.className = "Table__TBODY";

  // Populate the table with rows and cells
  for (let i = 0; i < masterList.childNodes.length; i++) {
    const row = document.createElement("tr");
    row.className = "Table__TR Table__TR--lg Table__odd";
    row.setAttribute("style", "height: auto;");
    row.setAttribute("data-idx", i);
    stats.forEach((stat) => {
      const cell = document.createElement("td");
      cell.className = "Table__TD";
      const tempdiv = document.createElement("div");
      tempdiv.className = `jsx-2810852873 table--cell tar ${stat}-div`;
      tempdiv.id = `${stat}-idx-${i}-div`;
      cell.appendChild(tempdiv);
      const tempspan = document.createElement("span");
      tempspan.innerHTML = `---`;
      tempspan.id = `${stat}-idx-${i}`;
      tempspan.setAttribute("idx", i);
      tempspan.className = `${stat}-span`;
      tempdiv.appendChild(tempspan);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  }

  // Append the table to the div element
  table.appendChild(thead);
  table.appendChild(tbody);
  base.appendChild(table);
}

function getBaseDiv() {
  var temp = "";
  const thElement = Array.from(document.getElementsByTagName("th")).find(
    (element) => {
      const title = element.getAttribute("title");
      if (title === "2023 SEASON Batting") {
        temp = "batting";
      } else if (title === "2023 SEASON Pitching") {
        temp = "pitching";
      }
      return (
        title &&
        (title.includes("2023 SEASON Batting") ||
          title.includes("2023 SEASON Pitching"))
      );
    }
  );
  if (thElement === undefined) {
    return { result: false, element: "", type: "" };
  } else {
    return {
      result: true,
      element: thElement.parentElement.parentElement.parentElement,
      type: temp,
    };
  }
}

function insertData(basediv, stattype, stats) {
  var targetdiv = basediv.childNodes[3].childNodes;
  var counter = 0;
  targetdiv.forEach((player, index) => {
    var playerName = document.querySelectorAll(`[data-idx="${index}"]`)[0]
      .childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
      .childNodes[0].childNodes[0].childNodes[0].innerHTML;
    var playerTeam = document.querySelectorAll(`[data-idx="${index}"]`)[0]
      .childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
      .childNodes[1].childNodes[0].innerHTML;
    var playerPos = document.querySelectorAll(`[data-idx="${index}"]`)[0]
      .childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
      .childNodes[1].childNodes[1].innerHTML;

    getPlayerData(playerName, playerTeam, playerPos, stattype, stats).then(
      (data) => {
        if (data === null) {
          console.log(
            "Error getting data for " + playerName + ". Check Fangraphs ID."
          );
        } else if (data !== "error") {
          stats.forEach((stat) => {
            try {
              document.getElementById(`${stat}-idx-${index}`).innerHTML =
                "&nbsp" +
                data[stat].toFixed(STATS_CONFIG[stattype][stat]["round"]) +
                "&nbsp";
            } catch (err) {
              console.log(err);
            }
          });
        }
        counter += 1;
        if (
          JSON.parse(localStorage.getItem("addon-config")).color &&
          counter === targetdiv.length
        ) {
          colorCode(stattype, stats);
        }
      }
    );
  });
}

function getPlayerData(name, team, pos, stattype, stats) {
  var fid = getFangraphsID(name, team);
  if (fid === -1) {
    return new Promise((resolve, reject) => {
      resolve("error");
    });
  }

  return fetch(
    `https://www.fangraphs.com/api/players/stats?playerid=${fid}&position${
      stattype === "batting" ? "" : "=P"
    }`
  )
    .then((response) => response.json())
    .then((data) => {
      const foundObject = data.data.find(
        (obj) =>
          obj["Season"].includes("season=2023") && obj["AbbLevel"] == "MLB" //&& obj["Team"] === "Average"
      );
      if (foundObject) {
        console.log(foundObject);
        var result = {};
        stats.forEach((key) => {
          if (key === "dERA") {
            result[key] = foundObject["ERA"] - foundObject["xERA"];
          } else if (key === "dFIP") {
            result[key] = foundObject["FIP"] - foundObject["xFIP"];
          } else if (key === "dFIP-") {
            result[key] = foundObject["xFIP-"] - foundObject["FIP-"];
          } else if (key === "dAVG") {
            result[key] = foundObject["xAVG"] - foundObject["AVG"];
          } else if (key === "dwOBA") {
            result[key] = foundObject["xwOBA"] - foundObject["wOBA"];
          } else {
            result[key] = foundObject[key];
          }
        });
        return result;
      } else {
        return null;
      }
    });
}

function getFangraphsID(name, team) {
  var foundPlayers = [];
  mapping.forEach((player) => {
    if (player.PLAYERNAME === name) {
      foundPlayers.push(player);
    }
  });
  if (foundPlayers.length === 1) {
    return foundPlayers[0].IDFANGRAPHS;
  } else if (foundPlayers.length === 0) {
    console.log("No Fangraphs ID found for " + name + ".");
    return -1;
  } else {
    console.log("Multiple IDs found for the name " + name);
    return -1;
  }
  // const player = mapping.find((player) => player.PLAYERNAME === name) // && player.TEAM === team.toUpperCase())
  // if (player) {
  //   return player.IDFANGRAPHS;
  // } else {
  //   return -10;
  // }
}

function colorCode(stattype, stats) {
  stats.forEach((stat) => {
    var elems = document.getElementsByClassName(`${stat}-span`);
    var values = [];
    Array.from(elems).forEach((value) => {
      if (value.innerHTML !== "---") {
        values.push({
          idx: value.getAttribute("idx"),
          value: parseFloat(value.innerHTML.trim().replace(/&nbsp;/g, "")),
        });
      }
    });

    var min = Math.min(...values.map((obj) => obj.value));
    var max = Math.max(...values.map((obj) => obj.value));
    values.forEach((value) => {
      var num = value["value"];
      const normalizedValue = (num - min) / (max - min);
      let color = "";
      if (!STATS_CONFIG[stattype][stat]["color"]) {
        // green = lower
        color = `hsl(${((1 - normalizedValue) * 120).toString(10)}, 100%, 80%)`;
      } else {
        // green = higher
        color = `hsl(${(normalizedValue * 120).toString(10)}, 100%, 80%)`;
      }

      document
        .getElementById(`${stat}-idx-${value["idx"]}`)
        .setAttribute("style", `background-color: ${color}; color: black;`);
    });
  });
}
