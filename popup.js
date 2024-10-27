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

        // Check for a user message
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
                turnIndex: index,
                type: 'user',
                userMessageText: userMessageText,
                checkbox: checkbox
            };

            // Store the user message object in the array
            messageObjects.push(userMessageObject);
            console.log(`User message found in Conversation Turn ${index + 1}:`, userMessageText);
        }

        // Check for an assistant message
        const assistantDiv = turn.querySelector('div[data-message-author-role="assistant"]');
        if (assistantDiv) {
            const assistantMessageText = assistantDiv.innerText;

            // Find the "Copy" button inside the assistant message
            const copyButton = turn.querySelector('button[aria-label="Copy"]');
            if (!copyButton) {
                console.log(`No Copy Button found in Conversation Turn ${index + 1}, skipping assistant message.`);
            } else {
                // Create the message object for the assistant message
                const assistantMessageObject = {
                    turnIndex: index,
                    type: 'assistant',
                    assistantMessageText: assistantMessageText,
                    assistantMessageElement: assistantDiv,
                    copyButton: copyButton
                };

                // Store the assistant message object in the array
                messageObjects.push(assistantMessageObject);
                console.log(`Assistant message found in Conversation Turn ${index + 1}:`, assistantMessageText);
            }
        }
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
        const userMessageObject = messageObjects.find(obj => obj.turnIndex === turnIndex && obj.type === 'user');

        if (userMessageObject) {
            console.log(`Processing user message from Conversation Turn ${turnIndex + 1}:`);

            // Add user message text to the collection
            selectedMessages.push({ user: userMessageObject.userMessageText });
            console.log("User message:", userMessageObject.userMessageText);

            // Check if the next assistant message corresponds to this user message
            const assistantMessageObject = messageObjects.find(obj => obj.turnIndex === turnIndex && obj.type === 'assistant');

            if (assistantMessageObject) {
                console.log("Corresponding assistant message found.");
                
                // Click the copy button and get the clipboard content
                assistantMessageObject.copyButton.click();
                await new Promise(resolve => setTimeout(resolve, 200)); // Wait for the copy action

                const assistantMessageText = await navigator.clipboard.readText();
                selectedMessages[selectedMessages.length - 1].assistant = assistantMessageText;
                console.log("Copied assistant message:", assistantMessageText);
            } else {
                selectedMessages[selectedMessages.length - 1].assistant = "No response found.";
                console.warn("No corresponding assistant message found.");
            }
        } else {
            console.warn(`User message object for Conversation Turn ${turnIndex + 1} not found.`);
        }
    }

    // Combine all user and assistant messages into a single string
    const combinedMessages = selectedMessages.map(pair =>
        `User: ${pair.user}\nAssistant: ${pair.assistant}`
    ).join('\n\n');

    // Copy the combined text to the clipboard
    await navigator.clipboard.writeText(combinedMessages);
    alert("Messages copied to clipboard!");
    console.log("Messages copied to clipboard:", combinedMessages);
}
