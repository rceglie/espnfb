// background.js

// Function to send a message to the content script and receive the URL
function getCurrentUrl(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        function: () => window.location.href,
      },
      (result) => {
        const currentUrl = result[0].result;
        resolve(currentUrl);
      }
    );
  });
}

// Message listener to handle requests from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getURL") {
    getCurrentUrl(sender.tab.id).then((url) => {
      sendResponse({ url });
    });
    return true; // Indicates that the response will be sent asynchronously
  }
});
