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
        response: { batting: [], pitching: [], misc: [], color: false },
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

const targetNode = document.getElementById("__next-wrapper");

var RUNNING = false;
const callback = (mutationList, observer) => {
  if (!RUNNING) {
    for (const mutation of mutationList) {
      if (
        mutation.type == "attributes" &&
        mutation.target.tagName === "IMG" &&
        mutation.target.className.includes("jsx")
      ) {
        console.log("start addon");
        RUNNING = true;
        initiate();
      }
    }
  }
};

const observer = new MutationObserver(callback);

observer.observe(targetNode, {
  attributes: true,
  childList: true,
  subtree: true,
});

// ------------------------- Actual program -------------------------- //

var STATSHEET;
// getStatSheet().then((res) => {
//   STATSHEET = res;
//   console.log(`loaded statsheet ${STATSHEET.length}`);
// });

async function initiate() {
  STATSHEET = await getStatSheet();
  console.log(`loaded statsheet ${STATSHEET.length}`);
  let response = getBaseDiv();
  setHandlers();
  mainProgram(response);
}

function getBaseDiv() {
  var temp = "";
  var basediv = "";
  var teamonly = ["", ""];
  var response = { found: false, element: {}, type: "" };

  if (!window.location.href.includes("fantasy.espn.com/baseball/team")) {
    var battersTitle = document.querySelectorAll('[title="Batters"]')[0];
    var pitchersTitle = document.querySelectorAll('[title="Pitchers"]')[0];

    response.found = battersTitle !== undefined || pitchersTitle !== undefined;
    if (!response.found) {
      return response;
    }

    response.element = document.querySelectorAll('[class="flex"]')[0];
    response.type = battersTitle !== undefined ? "batting" : "pitching";

    return response;
  }

  Array.from(document.getElementsByTagName("th")).forEach((element) => {
    const title = element.getAttribute("title");
    if (window.location.href.includes("fantasy.espn.com/baseball/team")) {
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
}

function mainProgram(basediv) {
  if (!basediv["found"]) {
    // Wrong page (no stat tables)
    return;
  } else {
    const settings = JSON.parse(localStorage.getItem("addon-config"));

    if (window.location.href.includes("fantasy.espn.com/baseball/team")) {
      if (settings["other"].contains("or")) {
        matchupRank(basediv["element"][0]);
      }
      var stats = settings["batting"];
      if (stats.length > 0) {
        createTable(basediv["element"][0], "batting", stats);
        insertData(basediv["element"][0], "batting", stats);
      }
      stats = settings["pitching"];
      if (stats.length > 0) {
        createTable(basediv["element"][1], "pitching", stats);
        insertData(basediv["element"][1], "pitching", stats);
      }
    } else {
      if (settings["other"].includes("or")) {
        matchupRank(basediv["element"]);
      }
      var stats = settings[basediv["type"]];
      if (stats.length > 0) {
        createTable(basediv["element"], basediv["type"], stats);
        insertData(basediv["element"], basediv["type"], stats);
      }
    }
  }
}

function createTable(basediv, stype, stats) {
  var scroller = basediv.firstChild.className.includes("Scroller");

  if (window.location.href.includes("fantasy.espn.com/baseball/team")) {
    var masterList = basediv.firstChild.childNodes[3];
    var oldTable = document.getElementById(`advanced-table-${stype}`);
    oldTable?.remove();
  } else {
    var masterList;
    if (scroller) {
      masterList = basediv.firstChild.childNodes[1].firstChild.childNodes[5];
    } else {
      masterList = basediv.firstChild.childNodes[4];
    }
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

function matchupRank(basediv) {
  var allPlayers = document.querySelectorAll(
    '[class="AnchorLink link clr-link pointer"]'
  );
  var allOppDivs = document.querySelectorAll(
    '[class="jsx-2810852873 table--cell opp ml4"]'
  );

  var numRows = allPlayers.length;
  var numColumns = allOppDivs.length / allPlayers.length;

  allOppDivs.forEach((opp, index) => {
    var rowIndex;

    if (opp.parentElement.parentElement.childNodes.length > 5) {
      rowIndex = Math.floor(index / numColumns);
    } else {
      if (index < numRows) {
        rowIndex = index;
      } else {
        rowIndex = Math.floor((index - numRows) / (numColumns - 1));
      }
    }

    var player = allPlayers[rowIndex];
    var position =
      player.parentElement.parentElement.parentElement.childNodes[1]
        .childNodes[1].innerHTML;

    if (!opp.innerHTML.includes("--")) {
      var rankSpan;
      if (opp.firstChild.childNodes.length == 1) {
        rankSpan = document.createElement("span");
        opp.firstChild.appendChild(rankSpan);
      } else {
        rankSpan = opp.firstChild.childNodes[1];
      }
      var opponent;
      if (index < numRows) {
        opponent = opp.firstChild.firstChild.firstChild.innerHTML
          .replace(/@/, "")
          .toLowerCase()
          .trim();
      } else {
        opponent = opp.firstChild.textContent
          .replace(/@/, "")
          .toLowerCase()
          .trim();
      }
      console.log(opponent);
      var rank = STATSHEET.filter((p) => {
        return p.Name.toLowerCase() === opponent;
      })[0][position.slice(0, 2).includes("P") ? "PRank" : "BRank"];
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

      rankSpan.innerHTML = `(${index}${rank}${suffix}${position})`;
      opp.style = `color: ${color};`;
    }
  });

  // allPlayers.forEach((opp) => {
  //   opp.innerHTML = "player";
  // });

  // console.log(allOppDivs);
  // console.log(allPlayers);

  // var rows;
  // let headerSpan;
  // var scroller;
  // if (
  //   basediv.firstChild.className.includes("Scroller") ||
  //   basediv.childNodes[1].className.includes("Scroller")
  // ) {
  //   scroller = true;
  //   console.log("in scroller");
  //   var rows =
  //     basediv.firstChild.childNodes[1].firstChild.childNodes[5].childNodes;
  //   headerSpan =
  //     basediv.firstChild.childNodes[1].firstChild.childNodes[4].childNodes[1]
  //       .childNodes[3].firstChild.firstChild;
  // } else {
  //   scroller = false;
  //   rows = basediv.firstChild.childNodes[4].childNodes;
  //   headerSpan =
  //     basediv.firstChild.childNodes[3].childNodes[1].childNodes[3].firstChild
  //       .firstChild;
  // }

  // headerSpan.style = "text-align: center; padding-left: 5px;";
  // headerSpan.parentElement.style = "margin: 0px!important;";

  // rows.forEach((row, index) => {
  //   var rankSpan;
  //   row.childNodes[3].firstChild.style =
  //     "margin: 0px!important; text-align: center; width: 100%; padding-right: 0px;";
  //   if (row.childNodes[3].firstChild.innerHTML.substring(0, 2) !== "--") {
  //     if (
  //       row.childNodes[3].firstChild.firstChild.firstChild.childNodes.length ==
  //       1
  //     ) {
  //       rankSpan = document.createElement("span");
  //       rankSpan.innerHTML = "99";
  //       row.childNodes[3].firstChild.firstChild.firstChild.appendChild(
  //         rankSpan
  //       );
  //     } else {
  //       rankSpan =
  //         row.childNodes[3].firstChild.firstChild.firstChild.childNodes[1];
  //     }

  //     var oppBox = row.childNodes[3];
  //     if (oppBox.firstChild.childNodes[0].data != "--") {
  //       var oppSpan = oppBox.firstChild.firstChild.firstChild.firstChild;
  //       var ogOpp = oppSpan.innerHTML.trim();
  //       var opponent = ogOpp.replace(/@/, "");
  //       if (opponent.indexOf("--") == -1) {
  //         var position =
  //           row.childNodes[0].firstChild.firstChild.childNodes[1].firstChild
  //             .childNodes[1].childNodes[1].innerHTML;
  //         var rank = STATSHEET.filter((p) => {
  //           return p.Name.toLowerCase() === opponent.toLowerCase().trim();
  //         })[0][position.slice(0, 2).includes("P") ? "PRank" : "BRank"];

  //         let suffix =
  //           rank == 1 || rank == 21
  //             ? "st"
  //             : rank == 2 || rank == 22
  //             ? "nd"
  //             : rank == 3 || rank == 23
  //             ? "rd"
  //             : "th";

  //         let color =
  //           rank >= 20
  //             ? "rgb(0, 148, 68)"
  //             : rank >= 11
  //             ? "rgb(25, 25, 25)"
  //             : "rgb(204, 0, 0)";

  //         rankSpan.innerHTML = `(${rank}${suffix})`;
  //         rankSpan.style = `color: ${color}; text-align: center; padding-left: 5px`;
  //         oppSpan.style = `color: ${color};`;
  //       }
  //     }
  //   }

  //   // Schedule
  //   if (
  //     document.querySelectorAll('[title="Upcoming Schedule"]').length !== null
  //   ) {
  //     var subheaders = document.querySelectorAll(
  //       '[title="Upcoming Schedule"]'
  //     )[0].parentElement.parentElement.childNodes[1].childNodes;
  //     subheaders.forEach((subheader) => {
  //       subheader.firstChild.firstChild.style = "text-align: center;";
  //     });

  //     var row2;
  //     // var row2 = Array.from(document.querySelectorAll(`[data-idx="${index}"]`))
  //     //   .sli.parentElement;

  //     if (scroller) {
  //       row2 = document.querySelectorAll(`[data-idx="${index}"]`)[0]
  //         .parentElement;
  //     } else {
  //       console.log(basediv);
  //       //row2 = Array.from(document.querySelectorAll(`[data-idx="${index}"]`))
  //     }

  //     Array.from(row2.childNodes).forEach((cell, index2) => {
  //       console.log(cell);
  //       cell.firstChild.style = "text-align: center";
  //       var firstDiv = cell.firstChild.innerHTML;
  //       if (firstDiv.indexOf("--") == -1) {
  //         var opponent = cell.firstChild.firstChild.innerHTML
  //           .replace(/@/, "")
  //           .trim();
  //         console.log(opponent);
  //         var position =
  //           row.childNodes[0].firstChild.firstChild.childNodes[1].firstChild
  //             .childNodes[1].childNodes[1].innerHTML;
  //         var rank = STATSHEET.filter((p) => {
  //           return p.Name.toLowerCase() === opponent.toLowerCase().trim();
  //         })[0][position.slice(0, 2).includes("P") ? "PRank" : "BRank"];

  //         let suffix =
  //           rank == 1 || rank == 21
  //             ? "st"
  //             : rank == 2 || rank == 22
  //             ? "nd"
  //             : rank == 3 || rank == 23
  //             ? "rd"
  //             : "th";

  //         let color =
  //           rank >= 20
  //             ? "rgb(0, 148, 68)"
  //             : rank >= 11
  //             ? "rgb(25, 25, 25)"
  //             : "rgb(204, 0, 0)";

  //         var rankSpan = document.getElementById(
  //           `rank-span-${index}-${index2}`
  //         );
  //         if (rankSpan) {
  //         } else {
  //           rankSpan = document.createElement("span");
  //           rankSpan.id = `rank-span-${index}-${index2}`;
  //           cell.firstChild.firstChild.appendChild(rankSpan);
  //         }
  //         rankSpan.innerHTML = `(${rank}${suffix})`;
  //         rankSpan.style = `padding-left: 5px`;
  //         cell.firstChild.style = `color: ${color}!important; text-align: center;`;
  //       }
  //     });
  //   }
  // });
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
    if (window.location.href.includes("fantasy.espn.com/baseball/team")) {
      try {
        var playerName = document.querySelectorAll(
          `[data-idx="${index}"][table=${stattype}]`
        )[0].childNodes[1].firstChild.firstChild.childNodes[1].firstChild
          .firstChild.firstChild.firstChild.innerHTML;
        var playerTeam = document.querySelectorAll(
          `[data-idx="${index}"][table=${stattype}]`
        )[0].childNodes[1].firstChild.firstChild.childNodes[1].firstChild
          .childNodes[1].firstChild.innerHTML;
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

    const data = getPlayerData(playerName, playerTeam);

    if (data !== null) {
      stats.forEach((stat) => {
        document.getElementById(`${stat}-idx-${index}`).innerHTML =
          "&nbsp" +
          parseFloat(data[stat]).toFixed(
            STATS_CONFIG[stattype][stat]["round"]
          ) +
          "&nbsp";
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

function getPlayerData(name, team) {
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
