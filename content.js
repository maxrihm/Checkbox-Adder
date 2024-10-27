console.log("Content script loaded: content.js");

// Array to store message objects
let messageObjects = [];

// Function to add options ("Add Checkboxes" and "Collect and Copy Messages") to the header
function addOptionsToHeader() {
    const header = document.querySelector('div.draggable.no-draggable-children.sticky');

  if (!header) {
    console.warn("Header element not found.");
    return;
  }

  console.log("Header found. Adding options to header...");

  // Create the "Add Checkboxes" button
  const addCheckboxesButton = document.createElement('button');
  addCheckboxesButton.className = 'header-button';
  addCheckboxesButton.innerText = 'Add Checkboxes';
  addCheckboxesButton.addEventListener('click', () => {
    console.log("Add Checkboxes button clicked.");
    initializeMessageObjects();
  });

  // Create the "Collect and Copy Messages" button
  const collectMessagesButton = document.createElement('button');
  collectMessagesButton.className = 'header-button';
  collectMessagesButton.innerText = 'Collect and Copy Messages';
  collectMessagesButton.addEventListener('click', () => {
    console.log("Collect and Copy Messages button clicked.");
    collectAndCopyMessages();
  });

  // Add the buttons to the header
  header.appendChild(addCheckboxesButton);
  console.log("Add Checkboxes button added to header.");
  header.appendChild(collectMessagesButton);
  console.log("Collect and Copy Messages button added to header.");
}

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

            // Skip to the next iteration since we only handle one type of message per iteration
            return; 
        }

        // Handle assistant messages
        const assistantDiv = turn.querySelector('div[data-message-author-role="assistant"]');
        if (assistantDiv) {
            // Find the "Copy" button inside the assistant message
            const copyButton = turn.querySelector('button[aria-label="Copy"]');

            // Create the message object for the assistant message
            const assistantMessageObject = {
                id: `turn-${index}`,
                userMessage: null,
                checkbox: null,
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

// Function to collect selected messages and copy them to the clipboard
async function collectAndCopyMessages() {
    console.log("Collecting and copying selected messages...");

    const collectedMessages = [];

    for (let i = 0; i < messageObjects.length; i++) {
        const currentMessage = messageObjects[i];

        // Process only user messages
        if (currentMessage.type === 'user' && currentMessage.checkbox.checked) {
            console.log(`Processing user message from Conversation Turn ${i + 1}:`);

            const formattedUserMessage = formatUserMessage(currentMessage.userMessage);
            collectedMessages.push(`${formattedUserMessage}`);

            // The next message should be the corresponding assistant message
            const nextMessage = messageObjects[i + 1];
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

    // Combine all collected messages into a single string
    const finalMessage = collectedMessages.join('\n\n');

    // Copy the combined text to the clipboard
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

// Initialize the options in the header 5 seconds after the page loads
setTimeout(() => {
  console.log("Attempting to add options to header after 5 seconds...");
  addOptionsToHeader();
}, 5000);