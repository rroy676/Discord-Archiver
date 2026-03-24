document.getElementById('downloadBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['inject.js'],
        world: 'MAIN' // Critical: This allows inject.js to see Discord's internal variables
    });
});