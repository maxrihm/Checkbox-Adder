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

            // Add "Copy" button for user message
            const copyButton = document.createElement('button');
            copyButton.innerText = 'Copy';
            copyButton.className = 'copy-button';
            copyButton.addEventListener('click', () => {
                // Pass the checkbox reference to collectAndCopyMessages to handle individual copy
                collectAndCopyMessages(checkbox);
            });
            turn.insertBefore(copyButton, checkbox.nextSibling);

            // Format user message to limit line breaks
            const formattedUserMessage = formatUserMessage(userMessageElement.innerText);
            userMessageElement.innerHTML = formattedUserMessage;

            messageObjects.push({
                id: `turn-${index}`,
                userMessage: formattedUserMessage,
                checkbox: checkbox,
                type: 'user'
            });
            return;
        }

        const assistantDiv = turn.querySelector('div[data-message-author-role="assistant"]');
        if (assistantDiv) {
            console.log(`Assistant message found at turn ${index + 1}`);
            const copyButton = turn.querySelector('button[aria-label="Copy"]');

            // Add "Copy" button for assistant message if not present
            if (!copyButton) {
                const newCopyButton = document.createElement('button');
                newCopyButton.innerText = 'Copy';
                newCopyButton.className = 'copy-button';
                newCopyButton.addEventListener('click', () => {
                    collectAndCopyMessages();
                });
                turn.insertBefore(newCopyButton, assistantDiv);
            }

            messageObjects.push({
                id: `turn-${index}`,
                userMessage: null,
                checkbox: null,
                assistantMessageElement: assistantDiv,
                type: 'assistant'
            });
        }
    });

    addOptionsToHeader();
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

// Function to collect selected messages and copy them to the clipboard
async function collectAndCopyMessages(targetCheckbox = null) {
    console.log("Collecting and copying messages...");

    // Determine which message objects to process
    let targetMessages = [];
    if (targetCheckbox) {
        // Single message case: find the corresponding message object
        const singleMessageObject = messageObjects.find(obj => obj.checkbox === targetCheckbox);
        if (singleMessageObject) {
            targetMessages = [singleMessageObject];
        }
    } else {
        // General case: use all selected message objects
        targetMessages = messageObjects.filter(obj => obj.type === 'user' && obj.checkbox && obj.checkbox.checked);
    }

    // Collect messages using the helper function
    const collectedMessages = collectMessagesForObject(targetMessages);

    // Copy the collected messages to clipboard
    const finalMessage = collectedMessages.join('\n\n');
    await navigator.clipboard.writeText(finalMessage);
    alert("Messages copied to clipboard!");
    console.log("Messages copied to clipboard:", finalMessage);
}

// Helper function to collect messages from the specified message objects
function collectMessagesForObject(messages) {
    const collectedMessages = [];

    for (let i = 0; i < messages.length; i++) {
        const currentMessage = messages[i];
        if (currentMessage.type === 'user') {
            console.log("Copying user message...");

            const formattedUserMessage = formatUserMessage(currentMessage.userMessage);
            collectedMessages.push(`${formattedUserMessage}`);

            // Find the corresponding assistant message
            const nextMessage = messageObjects.find((obj, index) => obj.type === 'assistant' && index > messageObjects.indexOf(currentMessage));
            if (nextMessage && nextMessage.assistantMessageElement) {
                console.log("Corresponding assistant message found.");

                const assistantMessageText = nextMessage.assistantMessageElement.innerText;
                collectedMessages.push(`${assistantMessageText}\n\n---`);
            } else {
                console.warn("No corresponding assistant message found.");
                collectedMessages.push("Assistant: No response found.");
            }
        }
    }

    return collectedMessages;
}


function formatUserMessage(userText) {
    const formattedText = userText.replace(/\n{2,}/g, '\n');
    return (
        '<span id="chat-gpt-answer" style="display: inline-block; background-color: #f0f0f0; border-radius: 18px; padding: 10px 15px; margin: 5px 0; font-family: Arial, sans-serif; color: #333; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">' +
        formattedText +
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
