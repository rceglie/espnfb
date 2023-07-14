// Event listener for tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status == "complete") {
    chrome.tabs.sendMessage(tabId, {
      message: "page loaded",
    });
  }
});

// Event listener for tab update
chrome.tabs.onCreated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.sendMessage(tabId, {
    message: "get ids",
  });
});
