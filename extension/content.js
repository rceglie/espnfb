// ------------------ Import stats.js and mapping.js ----------------- //

var STATS_CONFIG = [];
(async () => {
  const src = chrome.runtime.getURL("stats.js");
  STATS_CONFIG = (await import(src)).default;
})();

// ------------- Communication with background and popup ------------- //

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // if (request.message === "page loaded") {
  //   url = window.location.href;
  //   initiate();
  // }
  if (request.message === "requesting config") {
    if (localStorage.getItem("addon-config") === null) {
      sendResponse({
        response: { batting: [], pitching: [], other: [] },
      });
    } else {
      sendResponse({
        response: JSON.parse(localStorage.getItem("addon-config")),
      });
    }
  }
  if (request.message === "sending config") {
    localStorage.setItem("addon-config", JSON.stringify(request.data));
  }
  if (request.message === "sending STATS") {
    if (STATS_CONFIG.length === 0) {
      STATS_CONFIG = request.data;
    }
  }
  if (request.message === "get ids") {
    getids();
  }
});

// ------------------------- Observer to start on page load -------------------------- //

const targetNode = document.getElementById("__next-wrapper");

var firstLoad = true;
let debounceTimeout;

const callback = (mutationList, observer) => {
  var triggerInititate = false;
  for (const mutation of mutationList) {
    if (
      mutation.type == "attributes" &&
      mutation.target.tagName === "IMG" &&
      mutation.target.className.includes("jsx")
    ) {
      triggerInititate = true;
    }
  }
  if (triggerInititate) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log("initiating");
      initiate();
    }, 1000); // Adjust debounce delay as needed
  }
};

const observer = new MutationObserver(callback);

observer.observe(targetNode, {
  attributes: true,
  childList: true,
  subtree: true,
});

// ------------------------- Observer to re-initialize on date change -------------------------- //

let hasChanged = false;
let timeoutId;

const dateObserver = new MutationObserver(function (mutationsList, observer) {
  clearTimeout(timeoutId);

  timeoutId = setTimeout(() => {
    if (hasChanged) {
      console.log("Date changed - initializing");
      initiate();
      hasChanged = false;
    }
  }, 1000);

  for (const mutation of mutationsList) {
    if (mutation.type === "childList" || mutation.type === "characterData") {
      hasChanged = true;
    }
  }
});

// ------------------------- Actual program -------------------------- //

var STATSHEET;
var settings;

async function initiate() {
  STATSHEET = await getStatSheet();
  settings = JSON.parse(localStorage.getItem("addon-config"));
  console.log(`loaded statsheet ${STATSHEET.length}`);
  let response = getBaseDiv();
  setHandlers();
  mainProgram(response);
  console.log("done");
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

function getBaseDiv() {
  var response = { found: false, element: {}, type: "" };

  // Players page
  if (!window.location.href.includes("fantasy.espn.com/baseball/team")) {
    var battersTitle = document.querySelectorAll('[title="Batters"]')[0];
    var pitchersTitle = document.querySelectorAll('[title="Pitchers"]')[0];

    if (battersTitle !== undefined || pitchersTitle !== undefined) {
      response.found = true;
      response.element = document.querySelectorAll('[class="flex"]')[0];
      response.type = battersTitle !== undefined ? "batting" : "pitching";
    }
    return response;
  } else {
    response.element = Array.from(document.querySelectorAll('[class="flex"]'));
    response.found = response.element.length == 2;
    return response;
  }

  var navbar = document.querySelectorAll(`[role="tablist"]`)[0];
  if (navbar !== undefined) {
    navbar.childNodes.forEach((item) => {
      if (item.className.includes("active") && item.title !== "Stats") {
        basediv = "";
      }
    });
  }
}

function setHandlers() {
  var reloaded = false;
  const observer = new MutationObserver(function (mutations) {
    if (!reloaded) {
      reloaded = true;
      setTimeout(function () {
        var response = getBaseDiv();
        mainProgram(response);
      }, 3000);
    } else {
      setTimeout(function () {
        reloaded = false;
      }, 3000);
    }
  });
  const divElement =
    document.querySelector("div.layout.is-full").firstChild.firstChild;
  observer.observe(divElement, {
    attributes: true,
    childList: true, //, subtree: true
  });

  // observer for dates
  const elements = document.querySelectorAll(
    ".jsx-2810852873.table--cell.game-status.tl"
  );
  elements.forEach((element) => {
    dateObserver.observe(element, {
      subtree: true,
      characterData: true,
      childList: true,
    });
  });
}

function mainProgram(basediv) {
  if (!basediv["found"]) {
    return;
  } else {
    if (window.location.href.includes("fantasy.espn.com/baseball/team")) {
      matchupRank(basediv["element"][0], "batting");
      matchupRank(basediv["element"][1], "pitching");

      if (
        !JSON.parse(
          document
            .querySelector('li[title="Stats"]')
            .getAttribute("aria-selected")
        )
      ) {
        return;
      }

      if (settings["batting"].length > 0) {
        createTable(basediv["element"][0], "batting", settings["batting"]);
        insertData("batting", settings["batting"]);
        colorCode("batting", settings["batting"]);
      }
      if (settings["pitching"].length > 0) {
        createTable(basediv["element"][1], "pitching", settings["pitching"]);
        insertData("pitching", settings["pitching"]);
        colorCode("pitching", settings["pitching"]);
      }
    } else {
      matchupRank(basediv["element"], basediv["type"]);
      var stats = settings[basediv["type"]];
      if (stats.length > 0) {
        createTable(basediv["element"], basediv["type"], stats);
        insertData(basediv["type"], stats);
        colorCode(basediv["type"], stats);
      }
    }
  }
}

function matchupRank(basediv, type) {
  if (!settings["other"].includes("or")) {
    return;
  }

  var subheaders = basediv.querySelectorAll(
    '[class="jsx-2810852873 table--cell opp ml4 header"]'
  );
  subheaders.forEach((subheader) => {
    subheader.style =
      "text-align: center!important; padding: 0px 10px!important; margin: 0px!important;";
  });

  var allOppDivs = basediv.querySelectorAll(
    '[class="jsx-2810852873 table--cell opp ml4"]'
  );

  const style = document.createElement("style");
  style.textContent = 'span::after { content: ""!important; }';
  document.head.appendChild(style);

  allOppDivs.forEach((opp, index) => {
    if (!opp.innerHTML.includes("--")) {
      var rankSpan;
      var existingRankSpan = opp.querySelectorAll(`.rank-span`);

      if (existingRankSpan.length == 0) {
        rankSpan = document.createElement("span");
        rankSpan.className = "rank-span";
      } else {
        rankSpan = existingRankSpan[0];
        opp.removeChild(rankSpan);
      }

      var opponentSpan = opp.querySelectorAll(
        `span:not(.rank-span):not(:empty)`
      )[0];
      var opponent = opponentSpan.textContent
        .replace(/@/, "")
        .toLowerCase()
        .trim();

      var rank = STATSHEET.filter((p) => {
        return p.Name.toLowerCase() === opponent;
      })[0][type == "pitching" ? "PRank" : "BRank"];
      let suffix =
        rank == 1 || rank == 21
          ? "st"
          : rank == 2 || rank == 22
          ? "nd"
          : rank == 3 || rank == 23
          ? "rd"
          : "th";
      let color =
        rank >= 20
          ? "rgb(0, 148, 68)"
          : rank >= 11
          ? "rgb(25, 25, 25)"
          : "rgb(204, 0, 0)";

      rankSpan.innerHTML = `&nbsp;(${rank}${suffix})`;
      opp.style = `color: ${color}; display: flex; flex-direction: row; width: 100%; padding: 0px 5px!important; margin: 0px!important; justify-content:center;`;
      opponentSpan.style = `color: ${color};`;
      opp.appendChild(rankSpan);
    } else {
      var rankSpan = opp.querySelectorAll(`.rank-span`)[0];
      if (rankSpan) {
        var parent = rankSpan.parentElement;
        parent.childNodes.forEach((child) => {
          parent.removeChild(child);
        });
      }
    }
  });
}

function createTable(basediv, stype, stats) {
  var headshots = Array.from(
    basediv.querySelectorAll('[class="jsx-3743397412 player-headshot"]')
  );

  if (window.location.href.includes("fantasy.espn.com/baseball/team")) {
    var oldTable = document.getElementById(`advanced-table-${stype}`);
    oldTable?.remove();
  } else {
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

  headshots.forEach((headshot, index) => {
    var playerName =
      headshot.parentElement.childNodes.length > 1
        ? headshot.parentElement.childNodes[1].firstChild.firstChild.firstChild
            .firstChild.textContent
        : "empty";

    var playerTeam =
      headshot.parentElement.childNodes.length > 1
        ? headshot.parentElement.childNodes[1].firstChild.childNodes[1]
            .firstChild.textContent
        : "empty";

    const row = document.createElement("tr");
    row.className = "Table__TR Table__TR--lg Table__odd";
    row.setAttribute("style", "height: auto;");
    row.setAttribute("data-idx", index);
    row.setAttribute("player-name", playerName);
    row.setAttribute("player-team", playerTeam);
    stats.forEach((stat) => {
      const cell = document.createElement("td");
      cell.className = "Table__TD";
      const tempdiv = document.createElement("div");
      tempdiv.className = `jsx-2810852873 table--cell tar ${stat}-div`;
      tempdiv.id = `${stat}-idx-${index}-div`;
      cell.appendChild(tempdiv);
      const tempspan = document.createElement("span");
      tempspan.innerHTML = `---`;
      tempspan.id = `${stat}-idx-${index}`;
      tempspan.setAttribute("idx", index);
      tempspan.className = `${stat}-span`;
      tempdiv.appendChild(tempspan);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  basediv.appendChild(table);
}

function insertData(stattype, stats) {
  var premadeTableRows = document.getElementById(`advanced-table-${stattype}`)
    .childNodes[1].childNodes;

  premadeTableRows.forEach((row, index) => {
    if (row === undefined) {
      return;
    }

    var playerName = row.getAttribute("player-name");
    var playerTeam = row.getAttribute("player-team");

    if (playerName === undefined || playerName == "empty") {
      return;
    }

    let data = STATSHEET.filter(
      (p) => p.Name.toLowerCase() === playerName.toLowerCase()
    );
    if (data.length > 1) {
      data = data.filter((p) => p.Team === playerTeam);
    }

    if (data.length === 0) {
      console.log(`Could not find data for ${playerName}. Contact author`);
    } else if (data.length > 1) {
      console.log(`Multiple entries for ${playerName}.`);
    } else {
      stats.forEach((stat) => {
        document.getElementById(`${stat}-idx-${index}`).innerHTML =
          "&nbsp" +
          parseFloat(data[0][stat]).toFixed(
            STATS_CONFIG[stattype][stat]["round"]
          ) +
          "&nbsp";
      });
    }
  });
}

function colorCode(stattype, stats) {
  if (!JSON.parse(localStorage.getItem("addon-config")).other.includes("cc")) {
    return;
  }

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
