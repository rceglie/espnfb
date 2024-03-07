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

var config = {
  batting: [],
  pitching: [],
  other: [],
};

Object.keys(STATS["pitching"]).forEach((stat, index) => {
  const div = `
    <div class="checkbox-wrapper-21">
      <label class="control control--checkbox">
        ${stat}
        <input type="checkbox" name="checkbox" value="${stat}" class="pitching" />
        <div class="control__indicator"></div>
        <div class="has-tooltip">
          ?
          <span class="tooltip-wrapper">
            <span class="tooltip">
              ${STATS["pitching"][stat].tooltip}
            </span>
          </span>
        </div>
      </label>
    </div>`;
  document.getElementById("pitching-options").innerHTML += div;
});

Object.keys(STATS["batting"]).forEach((stat, index) => {
  const div = `
    <div class="checkbox-wrapper-21">
      <label class="control control--checkbox">
        ${stat}
        <input type="checkbox" name="checkbox" value="${stat}" class="batting" />
        <div class="control__indicator"></div>
        <div class="has-tooltip">
          ?
          <span class="tooltip-wrapper">
            <span class="tooltip">
              ${STATS["batting"][stat].tooltip}
            </span>
          </span>
        </div>
      </label>
    </div>`;
  document.getElementById("batting-options").innerHTML += div;
});

Array.from(document.getElementsByClassName("checkbox-wrapper-21")).forEach(
  (checkbox) => {
    checkbox.addEventListener("mouseup", function () {
      let box = this.childNodes[1].childNodes[1];
      if (box.checked) {
        config[box.className] = config[box.className].filter(
          (item) => item !== box.value
        );
        updateBrowser();
      } else {
        config[box.className].push(box.value);
        updateBrowser();
      }
    });
  }
);

// [activeTabs]
// Get config from brower localStorage
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { message: "requesting config" },
    function (res) {
      console.log("got config");
      console.log(res);
      res = res.response;
      if (
        (config, res) =>
          config.length === res.length &&
          config.every((element, index) => element === res[index])
      ) {
        config = res;
      }
      console.log(config);
      document.getElementById("color-code").checked = config.color;
      Array.prototype.slice
        .call(document.getElementsByClassName("batting"))
        .forEach((item) => {
          item.checked = config.batting.includes(item.value);
        });
      Array.prototype.slice
        .call(document.getElementsByClassName("pitching"))
        .forEach((item) => {
          item.checked = config.pitching.includes(item.value);
        });
      Array.prototype.slice
        .call(document.getElementsByClassName("other"))
        .forEach((item) => {
          item.checked = config.other.includes(item.value);
        });
    }
  );
});

// [activeTabs]
function updateBrowser() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      message: "sending config",
      data: config,
    });
  });
}

// document.getElementById("color-code").addEventListener("click", function () {
//   config.color = this.checked;
//   updateBrowser();
// });

// document.getElementById("color-code").addEventListener("click", function () {
//   config.color = this.checked;
//   updateBrowser();
// });
