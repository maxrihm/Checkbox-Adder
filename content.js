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
        console.log(`Processing turn ${index + 1}`);

        const userMessageElement = turn.querySelector('div[data-message-author-role="user"]');
        if (userMessageElement) {
            console.log(`User message found at turn ${index + 1}`);
            const userMessageText = userMessageElement.innerText;

            // Create checkbox for the user message
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${index}`;
            checkbox.className = 'message-checkbox';
            checkbox.addEventListener('change', updateCounter);
            turn.insertBefore(checkbox, turn.firstChild);

            // Add a smaller "Copy" button for user message
            const copyButton = document.createElement('button');
            copyButton.innerText = 'Copy';
            copyButton.className = 'copy-button-small';
            copyButton.addEventListener('click', () => {
                // Pass the checkbox reference to collectAndCopyMessages to handle individual copy
                collectAndCopyMessages(checkbox);
            });
            turn.insertBefore(copyButton, checkbox.nextSibling);


            // Create the user message object
            const userMessageObject = {
                id: `turn-${index}`,
                userMessage: userMessageText,
                checkbox: checkbox,
                assistantMessageElement: null,
                copyButton: copyButton,
                type: 'user'
            };

            messageObjects.push(userMessageObject);
            return;
        }

        const assistantDiv = turn.querySelector('div[data-message-author-role="assistant"]');
        if (assistantDiv) {
            console.log(`Assistant message found at turn ${index + 1}`);
            const copyButton = turn.querySelector('button[aria-label="Copy"]');

            // Create the assistant message object
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

function formatUserMessage(userText) {
    const formattedText = userText.replace(/(\r\n|\n|\r)+/g, ' ').trim();
    return (
        '<span id="chat-gpt-answer" style="display: inline-block; background-color: #f0f0f0; border-radius: 18px; padding: 10px 15px; margin: 5px 0; font-family: Arial, sans-serif; color: #333; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">' +
        formattedText +
        '</span>'
    );
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



async function collectAndCopyMessages(targetCheckbox = null) {
    console.log("Collecting and copying messages...");

    let collectedMessages = [];

    // Determine which message objects to process
    let targetMessages = [];
    if (targetCheckbox) {
        // Single message case: find the corresponding message object
        const singleMessageIndex = messageObjects.findIndex(obj => obj.checkbox === targetCheckbox);
        if (singleMessageIndex !== -1) {
            // Include both the current user message and the next assistant message
            targetMessages = [messageObjects[singleMessageIndex], messageObjects[singleMessageIndex + 1]];
        }
    } else {
        // General case: use only checked user messages
        targetMessages = messageObjects.filter((obj, index) => obj.type === 'user' && obj.checkbox && obj.checkbox.checked);
    }

    // Collect messages for each user message and its corresponding assistant message
    for (let i = 0; i < targetMessages.length; i++) {
        const currentMessage = targetMessages[i];
        const nextMessage = messageObjects[messageObjects.indexOf(currentMessage) + 1];

        if (currentMessage && currentMessage.type === 'user') {
            console.log("Copying user message...");

            // Add the user message text
            const formattedUserMessage = formatUserMessage(currentMessage.userMessage);
            collectedMessages.push(`${formattedUserMessage}`);

            // Handle the corresponding assistant message
            if (nextMessage && nextMessage.type === 'assistant' && nextMessage.copyButton) {
                console.log("Corresponding assistant message found.");

                // Click the copy button to copy the content
                nextMessage.copyButton.click();
                await new Promise(resolve => setTimeout(resolve, 200)); // Wait for the copy action

                // Read the copied text from the clipboard
                const assistantMessageText = await navigator.clipboard.readText();
                collectedMessages.push(`${assistantMessageText}\n\n---`);

                console.log("Copied assistant message:", assistantMessageText);
            } else {
                console.warn("No corresponding assistant message found.");
                collectedMessages.push("Assistant: No response found.");
            }
        }
    }

    // Copy the collected messages to clipboard
    const finalMessage = collectedMessages.join('\n\n');
    await navigator.clipboard.writeText(finalMessage);
    console.log("Messages copied to clipboard:", finalMessage);
}





// Listen for messages from the pop-up
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addCheckboxes") {
        console.log("Received 'addCheckboxes' message from the pop-up.");
        initializeMessageObjects();
        sendResponse({ status: "Checkboxes added" });
    }
});
