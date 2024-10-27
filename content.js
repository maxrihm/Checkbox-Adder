console.log("Content script loaded: content.js");

// Array to store message objects
let messageObjects = [];

// Function to add options ("Collect and Copy Messages") to the header
function updateCounter() {
    const selectedCount = document.querySelectorAll('.message-checkbox:checked').length;
    const totalCount = document.querySelectorAll('.message-checkbox').length;
    const counterLabel = document.getElementById('selection-counter');
    if (counterLabel) {
        counterLabel.innerText = `Selected: ${selectedCount} / Total: ${totalCount}`;
    }
}

// Function to select all checkboxes
function selectAllCheckboxes() {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = true);
    updateCounter();
}

// Function to clear all selections
function clearSelections() {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    const textboxes = document.querySelectorAll('input[type="text"], textarea');
    textboxes.forEach(textbox => textbox.value = '');
    updateCounter();
}

// Modified function to add options to the header, including new buttons
function addOptionsToHeader() {
    const header = document.querySelector('div.draggable.no-draggable-children.sticky');

    if (!header) {
        console.warn("Header element not found.");
        return;
    }

    // Avoid adding buttons multiple times
    if (header.querySelector('.header-button')) {
        return;
    }

    console.log("Header found. Adding buttons...");

    // Create the "Collect and Copy Messages" button
    const collectMessagesButton = document.createElement('button');
    collectMessagesButton.className = 'header-button';
    collectMessagesButton.innerText = 'Collect and Copy Messages';
    collectMessagesButton.addEventListener('click', () => {
        console.log("Collect and Copy Messages button clicked.");
        collectAndCopyMessages();
    });

    // Create the "Select All" button
    const selectAllButton = document.createElement('button');
    selectAllButton.className = 'header-button';
    selectAllButton.innerText = 'Select All';
    selectAllButton.addEventListener('click', selectAllCheckboxes);

    // Create the "Clear Selections" button
    const clearSelectionsButton = document.createElement('button');
    clearSelectionsButton.className = 'header-button';
    clearSelectionsButton.innerText = 'Clear Selections';
    clearSelectionsButton.addEventListener('click', clearSelections);

    // Create the counter label
    const counterLabel = document.createElement('span');
    counterLabel.id = 'selection-counter';
    counterLabel.className = 'header-label';
    counterLabel.innerText = 'Selected: 0 / Total: 0';

    // Append the buttons and label to the header
    header.appendChild(collectMessagesButton);
    header.appendChild(selectAllButton);
    header.appendChild(clearSelectionsButton);
    header.appendChild(counterLabel);

    console.log("Buttons and counter label added to header.");
    updateCounter(); // Update counter initially
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
        const userMessageElement = turn.querySelector('div[data-message-author-role="user"]');
        if (userMessageElement) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${index}`;
            checkbox.className = 'message-checkbox';
            checkbox.addEventListener('change', updateCounter);
            turn.insertBefore(checkbox, turn.firstChild);

            messageObjects.push({
                id: `turn-${index}`,
                userMessage: userMessageElement.innerText,
                checkbox: checkbox,
                type: 'user'
            });
            return;
        }
    });

    addOptionsToHeader();
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
