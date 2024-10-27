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

        // Find the assistant message inside the conversation turn
        const assistantDiv = turn.querySelector('div[data-message-author-role="assistant"]');
        if (assistantDiv) {
            console.log(`Assistant Div inside Conversation Turn ${index + 1}:`, assistantDiv);
        } else {
            console.log(`No Assistant Div found inside Conversation Turn ${index + 1}`);
            return; // Skip this turn if no assistant message is found
        }

        // Find the "Copy" button inside the conversation turn
        const copyButton = turn.querySelector('button[aria-label="Copy"]');
        if (copyButton) {
            console.log(`Copy Button inside Conversation Turn ${index + 1}:`, copyButton);
        } else {
            console.log(`No Copy Button found inside Conversation Turn ${index + 1}`);
            return; // Skip this turn if no copy button is found
        }

        // Create a checkbox for each user message, using the turn index
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${index}`;
        checkbox.className = 'message-checkbox';

        // Insert the checkbox at the beginning of the conversation turn
        turn.insertBefore(checkbox, turn.firstChild);

        // Create the message object
        const messageObject = {
            turnIndex: index,
            assistantMessageElement: assistantDiv,
            copyButton: copyButton,
            checkbox: checkbox
        };

        // Store the message object in the array
        messageObjects.push(messageObject);
    });

    // Log the entire list of message objects to the console
    console.log("Message objects initialized:", messageObjects);
}

// Function to collect selected messages and copy them to the clipboard
async function collectAndCopyMessages() {
    console.log("Collecting and copying selected messages...");

    const selectedMessages = [];
    const checkboxes = document.querySelectorAll('.message-checkbox:checked');

    if (checkboxes.length === 0) {
        console.warn("No user messages selected.");
        return;
    }

    for (const checkbox of checkboxes) {
        const turnIndex = parseInt(checkbox.id.split('-')[1], 10);
        const messageObject = messageObjects.find(obj => obj.turnIndex === turnIndex);

        if (messageObject) {
            console.log(`Processing message from Conversation Turn ${turnIndex + 1}:`);

            // Add assistant message text to the collection
            selectedMessages.push({ assistant: messageObject.assistantMessageElement.innerText });

            console.log("Assistant message:", messageObject.assistantMessageElement.innerText);

            // Click the copy button and get the clipboard content
            messageObject.copyButton.click();
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait for the copy action

            const assistantMessageText = await navigator.clipboard.readText();
            selectedMessages[selectedMessages.length - 1].assistant = assistantMessageText;

            console.log("Copied assistant message:", assistantMessageText);
        } else {
            console.warn(`Message object for Conversation Turn ${turnIndex + 1} not found.`);
        }
    }

    // Combine all assistant messages into a single string
    const combinedMessages = selectedMessages.map(pair =>
        `Assistant: ${pair.assistant}`
    ).join('\n\n');

    // Copy the combined text to the clipboard
    await navigator.clipboard.writeText(combinedMessages);
    alert("Messages copied to clipboard!");
    console.log("Messages copied to clipboard:", combinedMessages);
}
