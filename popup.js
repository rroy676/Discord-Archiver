const api = typeof browser !== 'undefined' ? browser : chrome;

// ── Version check ──────────────────────────────────────────────────────────
// Reads the current version from manifest.json, then hits the GitHub releases
// API to see if a newer tag exists. All requests go directly from the browser
// to GitHub — nothing is proxied or logged.
const GITHUB_RELEASES_URL =
    'https://api.github.com/repos/rroy676/Discord-Archiver/releases/latest';

const parseVersion = v => (v || '').replace(/^v/, '').split('.').map(Number);

const isNewer = (remote, local) => {
    for (let i = 0; i < 3; i++) {
        if ((remote[i] || 0) > (local[i] || 0)) return true;
        if ((remote[i] || 0) < (local[i] || 0)) return false;
    }
    return false;
};

async function checkForUpdate() {
    try {
        const manifest      = api.runtime.getManifest();
        const localVersion  = parseVersion(manifest.version);
        const versionBadge  = document.getElementById('versionBadge');
        const updateChip    = document.getElementById('updateChip');

        if (versionBadge) versionBadge.textContent = `v${manifest.version}`;

        const res = await fetch(GITHUB_RELEASES_URL, {
            headers: { 'Accept': 'application/vnd.github+json' }
        });
        if (!res.ok) return; // silently ignore network failures

        const data          = await res.json();
        const remoteVersion = parseVersion(data.tag_name);

        if (isNewer(remoteVersion, localVersion) && updateChip) {
            updateChip.href        = data.html_url;
            updateChip.textContent = `⬆ v${data.tag_name?.replace(/^v/, '')} available`;
            updateChip.style.display = 'inline-block';
        }
    } catch (_) {
        // Version check is best-effort — never surface errors to the user
    }
}

// ── Main ───────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const statusDiv   = document.getElementById('status');

    if (!downloadBtn) return;

    // Kick off version check in the background — doesn't block the UI
    checkForUpdate();

    const setStatus = (msg, type = 'success') => {
        statusDiv.textContent  = msg;
        statusDiv.className    = type; // 'success' | 'error'
        statusDiv.style.display = 'block';
    };

    const setButtonEnabled = (enabled) => {
        downloadBtn.disabled = !enabled;
    };

    downloadBtn.addEventListener('click', async () => {
        try {
            const [tab] = await api.tabs.query({ active: true, currentWindow: true });

            if (!tab?.url?.includes('discord.com')) {
                setStatus('Please open a Discord channel first.', 'error');
                return;
            }

            setButtonEnabled(false);
            setStatus('Export started — see the overlay on Discord.', 'success');

            await api.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['inject.js'],
                world: 'MAIN'
            });

        } catch (err) {
            console.error('Discord Archiver Error:', err);

            setStatus('Permission needed.', 'error');
            setButtonEnabled(true); // Re-enable so the user can retry after granting permission

            alert(
                'Action blocked.\n\n' +
                'Click the Puzzle Piece icon in the toolbar and select\n' +
                '"Always allow on discord.com", then try again.'
            );
        }
    });
});
