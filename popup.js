const api = typeof browser !== 'undefined' ? browser : chrome;

window.addEventListener('load', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const statusDiv = document.getElementById('status');

    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', async () => {
        try {
            const [tab] = await api.tabs.query({ active: true, currentWindow: true });

            // Safety check: Don't try to inject into browser settings or empty tabs
            if (!tab?.url?.includes('discord.com')) {
                alert('Please open a Discord channel before exporting.');
                return;
            }

            if (statusDiv) {
                statusDiv.textContent = 'Starting Export...';
                statusDiv.style.display = 'block';
                statusDiv.style.color = '#23a559'; // Discord success green
            }

            await api.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['inject.js'],
                world: 'MAIN'
            });

            // Optional: Update UI to show it's running
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = '0.5';
            downloadBtn.style.cursor = 'not-allowed';

        } catch (err) {
            console.error('Discord Archiver Error:', err);
            
            if (statusDiv) {
                statusDiv.textContent = 'Permission needed.';
                statusDiv.style.color = '#f23f43'; // Discord error red
                statusDiv.style.display = 'block';
            }
            
            alert('Action blocked. Please click the "Puzzle Piece" icon and select "Always allow on discord.com"');
        }
    });
});