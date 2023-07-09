var config = {
    batting: [],
    pitching: [],
    misc: []
}

// Get config from brower localStorage
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { data: "need config" }, function (res) {
        config = res.response;
        console.log("config:")
        console.log(config)
        // update batting + pitching checkboxes
        Array.prototype.slice.call(document.getElementsByClassName("batting")).forEach((item) => {
            console.log(item.value)
            console.log(config.batting.includes(item.value))
            item.checked = config.batting.includes(item.value)
        })
        Array.prototype.slice.call(document.getElementsByClassName("pitching")).forEach((item) => {
            console.log(item.value)
            console.log(config.pitching.includes(item.value))
            item.checked = config.pitching.includes(item.value)
        })
    });
  })

function updateBrowser() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { data: config });
      });
}

document.getElementsByName("option").forEach((checkbox) => {
    checkbox.addEventListener('click', limitCheckBoxes)
})

function limitCheckBoxes() {

    console.log(this.className)
    console.log(config)
    console.log(config[this.className])

    if (!this.checked) {
        config[this.className] = config[this.className].filter(item => item !== this.value)
        updateBrowser()
    // } else if (config[this.className].length >= 3) {
    //         this.checked = false;
    } else {
        config[this.className].push(this.value)
        updateBrowser()
    }

    console.log(config)
}