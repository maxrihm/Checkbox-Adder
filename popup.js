// popup.js
document.getElementById("add-checkboxes").addEventListener("click", () => {
    console.log("Add Checkboxes button clicked in popup");
  
    // Send a message to the content script to initialize checkboxes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "addCheckboxes" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to content script: ", chrome.runtime.lastError.message);
        } else {
          console.log("Message sent to content script:", response);
        }
      });
    });
  });
  