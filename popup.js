// Array to store message objects
let messageObjects = [];

// When the "Add Checkboxes" button is clicked
document.getElementById("addCheckboxesButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: initializeMessageObjects
        });
    });
});

// Function to initialize message objects for each conversation turn
function initializeMessageObjects() {
    console.clear();
    console.log("Initializing message objects...");

    messageObjects = [];

    // Find all div elements with the class 'group/conversation-turn'
    const conversationTurns = document.querySelectorAll('div.group\\/conversation-turn');

    // Iterate over each conversation turn
    conversationTurns.forEach((turn, index) => {
        console.log(`Conversation Turn ${index + 1}:`, turn);

        // Handle user messages
        const userMessageElement = turn.querySelector('div[data-message-author-role="user"]');
        if (userMessageElement) {
            const userMessageText = userMessageElement.innerText;

            // Create a checkbox for each user message, using the turn index
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${index}`;
            checkbox.className = 'message-checkbox';

            // Insert the checkbox at the beginning of the conversation turn
            turn.insertBefore(checkbox, turn.firstChild);

            // Create the message object for the user message
            const userMessageObject = {
                id: `turn-${index}`,
                userMessage: userMessageText,
                checkbox: checkbox,
                assistantMessageElement: null,
                copyButton: null,
                type: 'user'
            };

            // Store the user message object in the array
            messageObjects.push(userMessageObject);
        }

        // Handle assistant messages
        const assistantDiv = turn.querySelector('div[data-message-author-role="assistant"]');
        if (assistantDiv) {
            // Find the "Copy" button inside the assistant message
            const copyButton = assistantDiv.querySelector('button[aria-label="Copy"]');

            // Create the message object for the assistant message
            const assistantMessageObject = {
                id: `turn-${index}`,
                userMessage: null, // Not applicable for assistant message
                checkbox: null,     // Not applicable for assistant message
                assistantMessageElement: assistantDiv,
                copyButton: copyButton,
                type: 'assistant'
            };

            // Store the assistant message object in the array
            messageObjects.push(assistantMessageObject);
        }
    });

    // Output the entire list of message objects to the console
    console.log("Message objects initialized:", messageObjects);
}
