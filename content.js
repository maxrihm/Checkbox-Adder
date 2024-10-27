// Select all divs with the specified attribute
const targetDivs = document.querySelectorAll('div[data-message-author-role="user"]');

// Add a checkbox to each targeted div
targetDivs.forEach((div, index) => {
    // Create a container for the checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.classList.add('checkbox-container');

    // Create the checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${index}`;
    checkbox.className = 'message-checkbox';

    // Append the checkbox to the container
    checkboxContainer.appendChild(checkbox);

    // Insert the checkbox container before the target div
    div.parentNode.insertBefore(checkboxContainer, div);
});

// Function to get all checked divs for further processing
function getCheckedDivs() {
    const checkedDivs = [];
    const checkboxes = document.querySelectorAll('.message-checkbox:checked');
    checkboxes.forEach(checkbox => {
        const div = checkbox.parentNode.nextSibling;
        if (div && div.matches('div[data-message-author-role="user"]')) {
            checkedDivs.push(div);
        }
    });
    return checkedDivs;
}

// Example usage: Log the checked divs when a button is clicked
// (You can create a custom button or use the browser console)
document.addEventListener('click', () => {
    const checkedDivs = getCheckedDivs();
    console.log('Checked divs:', checkedDivs);
});
