import { getActiveTabURL } from "./utils.js";

var container1 = document.getElementById("container");
document.getElementById("btn").addEventListener("click", btnClick)
function btnClick() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: 'Hello from popup.js!' });
      });
}



var checkboxes = document.getElementsByName("option")
for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('click', limitCheckBoxes);
}

function limitCheckBoxes() {
    var checkedCount = 0;

    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            checkedCount++;
        }
    }

    if (checkedCount > 3) {
        this.checked = false;
    }
}



// receive
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === 'Hello from content.js!') {
      console.log('Message received in popup.js');
      sendResponse({ response: 'Message received in popup.js' });
    }
  });