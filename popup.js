import STATS from "/stats.js";

var config = {
  batting: [],
  pitching: [],
  misc: [],
  color: false,
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
  (checkbox) =>
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
    })
);

// [activeTabs]
// Get config from brower localStorage
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { message: "requesting config" },
    function (res) {
      config = res.response;
      // update color checkbox
      document.getElementById("color-code").checked = config.color;
      // update batting + pitching checkboxes
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

document.getElementById("color-code").addEventListener("click", function () {
  config.color = this.checked;
  updateBrowser();
});
