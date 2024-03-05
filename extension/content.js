// ------------------ Import stats.js and mapping.js ----------------- //

var STATS_CONFIG = [];
(async () => {
  const src = chrome.runtime.getURL("stats.js");
  STATS_CONFIG = (await import(src)).default;
})();

// ------------- Communication with background and popup ------------- //

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  //console.log(request);
  if (request.message === "page loaded") {
    url = window.location.href;
    initiate();
  }
  if (request.message === "requesting config") {
    if (localStorage.getItem("addon-config") === null) {
      sendResponse({
        response: { batting: [], pitching: [], misc: [], color: false },
      });
    } else {
      sendResponse({
        response: JSON.parse(localStorage.getItem("addon-config")),
      });
    }
  }
  if (request.message === "sending config") {
    //console.log("recieved message");
    localStorage.setItem("addon-config", JSON.stringify(request.data));
  }
  if (request.message === "sending STATS") {
    console.log("recieved message");
    if (STATS_CONFIG.length === 0) {
      STATS_CONFIG = request.data;
    }
  }
  if (request.message === "get ids") {
    console.log("tab update works idk what this is tho");
    getids();
  }
});

// ------------------------- Actual program -------------------------- //

var STATSHEET;

async function initiate() {
  console.log("initiating");
  console.log("getting stat sheet");
  STATSHEET = await getStatSheet();
  console.log(`got stat sheet ${STATSHEET.length}`);
  getBaseDiv().then((basediv) => {
    setHandlers();
    mainProgram(basediv);
  });
}

function getBaseDiv() {
  return new Promise((resolve) => {
    let counter = 0;
    var temp = "";
    var basediv = "";
    var teamonly = ["", ""];

    const checkCondition = () => {
      if (counter >= 10 || basediv !== "") {
        if (basediv !== "") {
          resolve({ result: true, element: basediv, type: temp });
        } else {
          resolve({ result: false, element: "", type: "" });
        }
        return;
      }

      Array.from(document.getElementsByTagName("th")).forEach((element) => {
        const title = element.getAttribute("title");
        if (url.includes("fantasy.espn.com/baseball/team")) {
          if (title === "Batters") {
            teamonly[0] =
              element.parentElement.parentElement.parentElement.parentElement;
            teamonly[0]
              .querySelectorAll("tr")
              .forEach((tr) => tr.setAttribute("table", "batting"));
          } else if (title === "Pitchers") {
            teamonly[1] =
              element.parentElement.parentElement.parentElement.parentElement;
            teamonly[1]
              .querySelectorAll("tr")
              .forEach((tr) => tr.setAttribute("table", "pitching"));
          }
          if (teamonly[0] !== "" && teamonly[1] !== "") {
            basediv = teamonly;
          }
        } else if (title === "Batters") {
          temp = "batting";
          basediv =
            element.parentElement.parentElement.parentElement.parentElement;
        } else if (title === "Pitchers") {
          temp = "pitching";
          basediv =
            element.parentElement.parentElement.parentElement.parentElement;
        }
      });

      var navbar = document.querySelectorAll(`[role="tablist"]`)[0];
      if (navbar !== undefined) {
        navbar.childNodes.forEach((item) => {
          if (item.className.includes("active") && item.title !== "Stats") {
            basediv = "";
          }
        });
      }

      counter++;
      setTimeout(checkCondition, 500);
    };
    checkCondition();
  });
}

function setHandlers() {
  var reloaded = false;
  const observer = new MutationObserver(function (mutations) {
    if (!reloaded) {
      reloaded = true;
      setTimeout(function () {
        getBaseDiv().then((basediv) => mainProgram(basediv));
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
  if (!basediv["result"]) {
    // Wrong page (no stat tables)
    return;
  } else {
    if (url.includes("fantasy.espn.com/baseball/team")) {
      var stats = JSON.parse(localStorage.getItem("addon-config"))["batting"];
      if (stats.length > 0) {
        createTable(basediv["element"][0], "batting", stats);
        insertData(basediv["element"][0], "batting", stats);
      }
      stats = JSON.parse(localStorage.getItem("addon-config"))["pitching"];
      if (stats.length > 0) {
        createTable(basediv["element"][1], "pitching", stats);
        insertData(basediv["element"][1], "pitching", stats);
      }
    } else {
      var stats = JSON.parse(localStorage.getItem("addon-config"))[
        basediv["type"]
      ];
      if (stats.length > 0) {
        createTable(basediv["element"], basediv["type"], stats);
        insertData(basediv["element"], basediv["type"], stats);
      }
    }
  }
}

function createTable(basediv, stype, stats) {
  if (url.includes("fantasy.espn.com/baseball/team")) {
    var masterList = basediv.firstChild.childNodes[3];
    var oldTable = document.getElementById(`advanced-table-${stype}`);
    oldTable?.remove();
  } else {
    var masterList = basediv.firstChild.childNodes[4];
    var oldTable = document.getElementById(`advanced-table-batting`);
    oldTable?.remove();
    oldTable = document.getElementById(`advanced-table-pitching`);
    oldTable?.remove();
  }

  // Create the new table and its structure
  var table = document.createElement("table");
  table.className = "Table Table--align-right Table--fixed Table--fixed-right";
  table.setAttribute(
    "style",
    "border-collapse: collapse; border-spacing: 0px;"
  );
  table.id = `advanced-table-${stype}`;

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
  basediv.appendChild(table);
}

async function getStatSheet() {
  const URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxN3BwvlA5XdWCyukmR0o1myMbaShQieuLI5B7bHb3WwuhXCBbXX5b_zNngBj3kcczcni4lnhX7zEq/pub?gid=0&single=true&output=csv";

  const response = await fetch(URL);
  const data = await response.text();

  const lines = data.split("\n");
  const headers = lines[0].split(",");
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentLine = lines[i].split(",");

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j];
    }

    result.push(obj);
  }

  return result;
}

function insertData(basediv, stattype, stats) {
  var premadetable = document.getElementById(`advanced-table-${stattype}`)
    .childNodes[1].childNodes;
  var counter = 0;
  premadetable.forEach(async (player, index) => {
    counter += 1;
    if (player === undefined) {
      return;
    }
    if (url.includes("fantasy.espn.com/baseball/team")) {
      try {
        var playerName = document.querySelectorAll(
          `[data-idx="${index}"][table=${stattype}]`
        )[0].childNodes[1].firstChild.firstChild.childNodes[1].firstChild
          .firstChild.firstChild.firstChild.innerHTML;
        var playerTeam = document.querySelectorAll(
          `[data-idx="${index}"][table=${stattype}]`
        )[0].childNodes[1].firstChild.firstChild.childNodes[1].firstChild
          .childNodes[1].firstChild.innerHTML;
        var playerPos = "";
      } catch (error) {
        if (playerName !== undefined) {
          console.log(error);
        }
      }
    } else {
      var playerName = document.querySelectorAll(`[data-idx="${index}"]`)[0]
        .childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
        .childNodes[0].childNodes[0].childNodes[0].innerHTML;
      var playerTeam = document.querySelectorAll(`[data-idx="${index}"]`)[0]
        .childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
        .childNodes[1].childNodes[0].innerHTML;
    }

    if (playerName === undefined) {
      return;
    }

    const data = await getPlayerData(playerName, playerTeam);

    if (data !== null) {
      stats.forEach((stat) => {
        if (stat === "SIERA") {
          document.getElementById(`${"SIERA"}-idx-${index}`).innerHTML =
            "&nbsp" +
            parseFloat(data["SIERA\r"]).toFixed(
              STATS_CONFIG[stattype]["SIERA"]["round"]
            ) +
            "&nbsp";
        } else {
          document.getElementById(`${stat}-idx-${index}`).innerHTML =
            "&nbsp" +
            parseFloat(data[stat]).toFixed(
              STATS_CONFIG[stattype][stat]["round"]
            ) +
            "&nbsp";
        }
      });
    }

    if (
      JSON.parse(localStorage.getItem("addon-config")).color &&
      counter === premadetable.length
    ) {
      colorCode(stattype, stats);
    }
  });
}

async function getPlayerData(name, team) {
  let matches = STATSHEET.filter(
    (p) => p.Name.toLowerCase() === name.toLowerCase()
  );
  if (matches.length > 1) {
    matches = matches.filter((p) => p.Team === team);
  }
  if (matches.length === 0) {
    console.log(`Could not find data for ${name}. Contact author`);
    return null;
  } else if (matches.length === 1) {
    return matches[0];
  } else {
    console.log(`Multiple entries for ${name}.`);
    return null;
  }
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
