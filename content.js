console.log("Content script loaded: content.js");

// Array to store message objects
let messageObjects = [];

// Function to add options ("Collect and Copy Messages") to the header
function addOptionsToHeader() {
    const header = document.querySelector('div.draggable.no-draggable-children.sticky');

    if (!header) {
        console.warn("Header element not found.");
        return;
    }

    console.log("Header found. Adding Collect and Copy Messages button...");

    // Create the "Collect and Copy Messages" button
    const collectMessagesButton = document.createElement('button');
    collectMessagesButton.className = 'header-button';
    collectMessagesButton.innerText = 'Collect and Copy Messages';
    collectMessagesButton.addEventListener('click', () => {
        console.log("Collect and Copy Messages button clicked.");
        collectAndCopyMessages();
    });

    // Add the "Collect and Copy Messages" button to the header if it's not already there
    if (!header.querySelector('.header-button')) {
        header.appendChild(collectMessagesButton);
        console.log("Collect and Copy Messages button added to header.");
    }
}

// Function to initialize message objects for each conversation turn
function initializeMessageObjects() {
    console.clear();
    console.log("Initializing message objects...");

    messageObjects = [];

    const conversationTurns = document.querySelectorAll('div.group\\/conversation-turn');

    if (conversationTurns.length === 0) {
        console.warn("No conversation turns found.");
        return;
    }

    conversationTurns.forEach((turn, index) => {
        console.log(`Processing turn ${index + 1}`);

        const userMessageElement = turn.querySelector('div[data-message-author-role="user"]');
        if (userMessageElement) {
            console.log(`User message found at turn ${index + 1}`);
            const userMessageText = userMessageElement.innerText;
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${index}`;
            checkbox.className = 'message-checkbox';
            turn.insertBefore(checkbox, turn.firstChild);

            const userMessageObject = {
                id: `turn-${index}`,
                userMessage: userMessageText,
                checkbox: checkbox,
                assistantMessageElement: null,
                copyButton: null,
                type: 'user'
            };

            messageObjects.push(userMessageObject);
            return;
        }

        const assistantDiv = turn.querySelector('div[data-message-author-role="assistant"]');
        if (assistantDiv) {
            console.log(`Assistant message found at turn ${index + 1}`);
            const copyButton = turn.querySelector('button[aria-label="Copy"]');
            const assistantMessageObject = {
                id: `turn-${index}`,
                userMessage: null,
                checkbox: null,
                assistantMessageElement: assistantDiv,
                copyButton: copyButton,
                type: 'assistant'
            };

            messageObjects.push(assistantMessageObject);
        }
    });

    console.log("Message objects initialized:", messageObjects);
    addOptionsToHeader(); // Ensure the "Collect and Copy Messages" button is added to the header
}

// Function to collect selected messages and copy them to the clipboard
async function collectAndCopyMessages() {
    console.log("Collecting and copying selected messages...");

    const collectedMessages = [];

    for (let i = 0; i < messageObjects.length; i++) {
        const currentMessage = messageObjects[i];

        if (currentMessage.type === 'user' && currentMessage.checkbox.checked) {
            console.log(`Processing user message from Conversation Turn ${i + 1}:`);

            const formattedUserMessage = formatUserMessage(currentMessage.userMessage);
            collectedMessages.push(`${formattedUserMessage}`);

            const nextMessage = messageObjects[i + 1];
            if (nextMessage && nextMessage.type === 'assistant' && nextMessage.copyButton) {
                console.log("Corresponding assistant message found.");

                nextMessage.copyButton.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                const assistantMessageText = await navigator.clipboard.readText();
                collectedMessages.push(`${assistantMessageText}\n\n---`);

                console.log("Copied assistant message:", assistantMessageText);
            } else {
                console.warn("No corresponding assistant message found.");
                collectedMessages.push("Assistant: No response found.");
            }
        }
    }

    const finalMessage = collectedMessages.join('\n\n');
    await navigator.clipboard.writeText(finalMessage);
    alert("Messages copied to clipboard!");
    console.log("Messages copied to clipboard:", finalMessage);
}

function formatUserMessage(userText) {
    return (
        '<span style="display: inline-block; background-color: #f0f0f0; border-radius: 18px; padding: 10px 15px; margin: 5px 0; font-family: Arial, sans-serif; color: #333; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">' +
        userText +
        '</span>'
    );
}

// Listen for messages from the pop-up
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addCheckboxes") {
        console.log("Received 'addCheckboxes' message from the pop-up.");
        initializeMessageObjects();
        sendResponse({ status: "Checkboxes added" });
    }
});
