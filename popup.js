// When the button is clicked, execute the content script function
document.getElementById("addCheckboxesButton").addEventListener("click", () => {
    // Send a message to the content script to run the function
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: addCheckboxesToUserMessages
        });
    });
});

// The function to be executed in the content script
function addCheckboxesToUserMessages() {
    // Find all elements with the attribute 'data-message-author-role' set to 'user'
    const userMessages = document.querySelectorAll('[data-message-author-role="user"]');

    // Check if any elements were found and log them
    if (userMessages.length > 0) {
        userMessages.forEach((element, index) => {
            console.log(`Message ${index + 1}:`, element);

            // Create the checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${index}`;
            checkbox.className = 'message-checkbox';

            // Insert the checkbox before the element
            element.parentNode.insertBefore(checkbox, element);
        });
        console.log(`Total user messages found: ${userMessages.length}`);
    } else {
        console.log("No elements found with 'data-message-author-role' set to 'user'.");
    }
}
