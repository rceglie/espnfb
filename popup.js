import STATS from "/stats.js";

var config = {
  batting: [],
  pitching: [],
  misc: [],
  color: false,
};

Object.keys(STATS["pitching"]).forEach((stat, index) => {
  const label = document.createElement("label");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = "option";
  input.value = stat;
  input.className = "pitching";
  input.addEventListener("click", checkboxClick);

  label.appendChild(input);
  label.appendChild(document.createTextNode(stat));
  document.getElementById("pitching-options").appendChild(label);
});

Object.keys(STATS["batting"]).forEach((stat, index) => {
  const label = document.createElement("label");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = "option";
  input.value = stat;
  input.className = "batting";
  input.addEventListener("click", checkboxClick);

  label.appendChild(input);
  label.appendChild(document.createTextNode(stat));
  document.getElementById("batting-options").appendChild(label);
});

// Get config from brower localStorage
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { data: "requesting config" },
    function (res) {
      config = res.response;
      console.log("config:");
      console.log(config);
      // update color checkbox
      document.getElementById("color-code").checked = config.color;
      // update batting + pitching checkboxes
      Array.prototype.slice
        .call(document.getElementsByClassName("batting"))
        .forEach((item) => {
          console.log(item.value);
          console.log(config.batting.includes(item.value));
          item.checked = config.batting.includes(item.value);
        });
      Array.prototype.slice
        .call(document.getElementsByClassName("pitching"))
        .forEach((item) => {
          console.log(item.value);
          console.log(config.pitching.includes(item.value));
          item.checked = config.pitching.includes(item.value);
        });
    }
  );
});

function updateBrowser() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      message: "sending config",
      data: config,
    });
  });
}

function checkboxClick() {
  console.log(this.className);
  console.log(config);
  console.log(config[this.className]);

  if (!this.checked) {
    config[this.className] = config[this.className].filter(
      (item) => item !== this.value
    );
    updateBrowser();
  } else {
    config[this.className].push(this.value);
    updateBrowser();
  }

  console.log(config);
}

document.getElementById("color-code").addEventListener("click", function () {
  config.color = this.checked;
  updateBrowser();
});
