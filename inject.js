(async function() {
    // --- Double-injection guard ---
    if (window.__discordArchiverRunning) {
        console.warn('Discord Archiver: Already running. Ignoring duplicate call.');
        return;
    }
    window.__discordArchiverRunning = true;

    console.log("Discord Archiver: Starting...");
    let isRunning = true;

    // --- Helper: HTML escape (prevents XSS in exported file) ---
    const escapeHtml = s => s != null
        ? String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
        : '';

    // --- Overlay UI (Object.assign keeps styles readable and maintainable) ---
    const statusDiv = document.createElement('div');
    Object.assign(statusDiv.style, {
        position: 'fixed', top: '20px', right: '20px', zIndex: '9999',
        background: '#2b2d31', color: 'white', padding: '15px',
        borderRadius: '8px', border: '2px solid #5865f2',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        fontFamily: 'sans-serif', minWidth: '200px', textAlign: 'center'
    });
    statusDiv.innerHTML = `
        <b style="display:block;margin-bottom:10px;">Archiver Active</b>
        <div style="font-size:1.2rem;margin-bottom:10px;">Messages: <span id='arch-count'>0</span></div>
        <button id="stop-archiver" style="width:100%;background:#ed4245;color:white;border:none;border-radius:4px;padding:8px;cursor:pointer;font-weight:bold;">STOP &amp; SAVE</button>
        <small id="status-text" style="display:block;margin-top:8px;color:#949ba4;">Scraping history...</small>
    `;
    document.body.appendChild(statusDiv);

    document.getElementById('stop-archiver').addEventListener('click', () => {
        isRunning = false;
        document.getElementById('stop-archiver').disabled = true;
        document.getElementById('stop-archiver').style.background = '#4e5058';
        document.getElementById('status-text').innerText = 'Finishing current batch...';
    });

    // --- Token extraction ---
    // localStorage.getItem('token') has not worked on Discord for years — removed.
    const getToken = () => {
        try {
            let foundToken = null;
            window.webpackChunkdiscord_app.push([[Math.random()], {}, (req) => {
                for (const m in req.c) {
                    const module = req.c[m].exports;
                    if (module?.default?.getToken) {
                        const result = module.default.getToken();
                        if (typeof result === 'string' && result.length > 50) {
                            foundToken = result;
                            break;
                        }
                    }
                }
            }]);
            return foundToken;
        } catch (e) {
            return null;
        }
    };

    const token = getToken();
    if (!token) {
        statusDiv.remove();
        window.__discordArchiverRunning = false;
        return alert('Discord Archiver: Token not found.\nPlease refresh Discord (F5) and try again.');
    }

    // --- Markdown parser ---
    const parseMarkdown = (text, mentions = []) => {
        if (!text) return '';
        return text
            // Escape HTML first to prevent injection
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            // Code blocks (before inline code, to avoid double-processing)
            .replace(/```([a-z0-9+#]*\n)?([\s\S]*?)```/gi,
                '<pre class="markdown-code-block"><code>$2</code></pre>')
            .replace(/`(.*?)`/g, '<span class="markdown-code">$1</span>')
            // Blockquotes
            .replace(/^&gt; (.+)/gm, '<div class="blockquote">$1</div>')
            // Text formatting
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            .replace(/__([^_\n]+)__/g, '<u>$1</u>')
            .replace(/\|\|([\s\S]*?)\|\|/g,
                '<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // User mentions
            .replace(/&lt;@!?(\d+)&gt;/g, (_, id) => {
                const m = mentions.find(u => u.id === id);
                return `<span class="mention">@${m ? escapeHtml(m.global_name || m.username) : id}</span>`;
            })
            // Channel and role mentions
            .replace(/&lt;#(\d+)&gt;/g, '<span class="mention">#channel</span>')
            .replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="mention">@role</span>')
            // Custom emoji (static and animated)
            .replace(/&lt;a?:([a-zA-Z0-9_]+):(\d+)&gt;/g, (_, name, id) =>
                `<img class="custom-emoji" src="https://cdn.discordapp.com/emojis/${id}.webp?size=32" alt=":${name}:" title=":${name}:">`)
            // Markdown links then bare URLs
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
                '<a href="$2" target="_blank" class="chatlog__link">$1</a>')
            .replace(/(?<!href="|">)(https?:\/\/[^\s&<]+)/g,
                '<a href="$1" target="_blank" class="chatlog__link">$1</a>')
            .replace(/\n/g, '<br>');
    };

    // --- Fixed channel ID extraction (handles query strings and hashes) ---
    const channelId = window.location.pathname.split('/').pop();
    const channelName = escapeHtml(document.title.split(' | ')[0].replace(/^#/, '') || 'Archive');

    let allMessages = [];
    let lastId = null;

    try {
        while (isRunning) {
            let url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=100`;
            if (lastId) url += `&before=${lastId}`;

            const resp = await fetch(url, { headers: { 'Authorization': token } });

            if (resp.status === 429) {
                const data = await resp.json();
                const retryAfter = data.retry_after || 5;
                statusDiv.style.borderColor = 'orange';
                document.getElementById('status-text').innerText =
                    `Rate limited. Waiting ${Math.ceil(retryAfter)}s...`;
                await new Promise(r => setTimeout(r, (retryAfter * 1000) + 500));
                statusDiv.style.borderColor = '#5865f2';
                document.getElementById('status-text').innerText = 'Scraping history...';
                continue;
            }

            // Guard against 401, 403, 500, etc.
            // Previously, missing this check caused an infinite loop when Discord
            // returned an error object instead of a message array.
            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                const errMsg = errData.message || `HTTP ${resp.status}`;
                document.getElementById('status-text').innerText = `Error: ${errMsg}`;
                statusDiv.style.borderColor = 'red';
                console.error('Discord Archiver: API error', resp.status, errData);
                break;
            }

            const msgs = await resp.json();
            if (!Array.isArray(msgs) || msgs.length === 0) break;

            // Use concat instead of spread (...msgs) — spread passes each element as a
            // function argument and can exceed the JS engine's argument limit on large archives.
            allMessages = allMessages.concat(msgs);
            lastId = msgs[msgs.length - 1].id;

            document.getElementById('arch-count').innerText = allMessages.length.toLocaleString();

            const jitter = Math.floor(Math.random() * 300) + 500;
            await new Promise(r => setTimeout(r, jitter));
        }

        if (allMessages.length > 10000) {
            document.getElementById('status-text').innerText = 'Processing large archive...';
        }
        statusDiv.innerHTML = '<b>Generating Archive...</b>';

        if (allMessages.length > 0) {
            allMessages.reverse();
            const uniqueDates = [
                ...new Set(allMessages.map(m => new Date(m.timestamp).toLocaleDateString()))
            ];

            // Build HTML via array parts — avoids creating a new string on every += iteration,
            // which is extremely slow and GC-heavy for archives with 50k+ messages.
            //
            // The search+highlight logic is defined here as a real JS function and injected
            // via .toString(). This avoids ALL double-escaping bugs that occur when backslashes
            // and regex literals live inside a template literal — the JS engine parses this
            // function normally, and its source text is embedded verbatim into the output HTML.
            const searchScriptFn = function() {
                window.onload = function() { window.scrollTo(0, document.body.scrollHeight); };

                function escRe(s) {
                    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }

                function applyHighlight(cell, val) {
                    if (!cell) return;
                    if (!cell.hasAttribute('data-original')) {
                        cell.setAttribute('data-original', cell.innerHTML);
                    }
                    var original = cell.getAttribute('data-original');
                    if (!val) { cell.innerHTML = original; return; }
                    var re = new RegExp('(<[^>]*>)|(' + escRe(val) + ')', 'gi');
                    cell.innerHTML = original.replace(re, function(m, tag, txt) {
                        return tag ? tag : '<mark>' + txt + '</mark>';
                    });
                }

                function clearAllHighlights() {
                    document.querySelectorAll('.chatlog__message-container').forEach(function(m) {
                        var cell = m.children[1] || null;
                        if (cell && cell.hasAttribute('data-original')) {
                            cell.innerHTML = cell.getAttribute('data-original');
                        }
                    });
                }

                var searchTimer = null;
                document.getElementById('searchInput').oninput = function() {
                    var val = this.value;
                    clearTimeout(searchTimer);
                    searchTimer = setTimeout(function() {
                        var lower = val.toLowerCase();

                        // Require at least 3 characters — 1 or 2 match too many messages,
                        // making both the hide/show pass and highlighting sluggish.
                        // Clearing back to empty (val === '') still resets everything.
                        if (lower.length > 0 && lower.length < 3) return;

                        clearAllHighlights();

                        // Step 1: show/hide all messages (classList only — fast)
                        var visible = [];
                        document.querySelectorAll('.chatlog__message-container').forEach(function(m) {
                            var content = decodeURIComponent(m.getAttribute('data-content'));
                            var matches = lower === '' || content.includes(lower);
                            m.classList.toggle('hidden', !matches);
                            if (matches && lower !== '') visible.push(m);
                        });

                        // Step 2: highlight all visible matches in chunks of 50,
                        // yielding between each chunk so the browser doesn't freeze.
                        var CHUNK = 50;
                        var idx = 0;
                        var highlightVal = val; // capture in case input changes mid-run
                        function highlightChunk() {
                            var end = Math.min(idx + CHUNK, visible.length);
                            for (; idx < end; idx++) {
                                applyHighlight(visible[idx].children[1] || null, highlightVal);
                            }
                            if (idx < visible.length) {
                                setTimeout(highlightChunk, 0);
                            }
                        }
                        if (visible.length > 0) highlightChunk();

                        // Step 3: hide orphaned date separators
                        document.querySelectorAll('.date-separator').forEach(function(sep) {
                            if (lower === '') { sep.classList.remove('hidden'); return; }
                            var el = sep.nextElementSibling;
                            var hasVisible = false;
                            while (el && !el.classList.contains('date-separator')) {
                                if (!el.classList.contains('hidden')) { hasVisible = true; break; }
                                el = el.nextElementSibling;
                            }
                            sep.classList.toggle('hidden', !hasVisible);
                        });
                    }, 250);
                };
            };

            const parts = [];

            parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<title>#${channelName}</title>
<style>
    html { scroll-behavior: smooth; }
    body { background: #313338; color: #dbdee1; font-family: sans-serif; margin: 0; padding: 0; display: flex; }
    .sidebar { width: 200px; position: fixed; top: 0; left: 0; bottom: 0; background: #2b2d31; border-right: 1px solid #1e1f22; display: flex; flex-direction: column; padding: 20px 10px; z-index: 1001; }
    .sidebar h3 { font-size: .9rem; color: #949ba4; text-transform: uppercase; margin-bottom: 15px; padding-left: 10px; }
    .date-list { overflow-y: auto; flex-grow: 1; }
    .date-link { display: block; color: #b5bac1; text-decoration: none; padding: 8px 10px; border-radius: 4px; font-size: .85rem; margin-bottom: 2px; }
    .date-link:hover { background: #35373c; color: #fff; }
    .main-content { margin-left: 220px; flex-grow: 1; }
    .header-fixed { position: fixed; top: 0; left: 220px; right: 0; background: #2b2d31; border-bottom: 1px solid #1e1f22; z-index: 1000; padding: 1.5rem 2rem; }
    .header-flex { display: flex; align-items: center; justify-content: space-between; }
    #searchInput { width: 300px; background: #1e1f22; border: 1px solid #4e5058; color: white; padding: 8px; border-radius: 4px; outline: none; }
    #searchInput:focus { border-color: #5865f2; }
    .chatlog { margin-top: 120px; padding: 20px; padding-bottom: 120px; }
    .date-separator { border-bottom: 1px solid #4e5058; margin: 2rem 0 1rem; color: #949ba4; font-size: .75rem; text-transform: uppercase; font-weight: bold; }
    .chatlog__message-container { display: grid; grid-template-columns: 56px 1fr; padding: 4px 0; }
    .chatlog__message-container:hover { background: #2e3035; border-radius: 4px; }
    .chatlog__avatar { width: 40px; height: 40px; border-radius: 50%; margin-left: 8px; }
    .chatlog__author { color: #fff; font-weight: 600; margin-right: 8px; }
    .chatlog__timestamp { color: #949ba4; font-size: .75rem; }
    .markdown-code { background: #1e1f22; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: .9em; }
    .markdown-code-block { background: #1e1f22; padding: 10px; border-radius: 4px; border: 1px solid #232428; overflow-x: auto; font-family: monospace; font-size: .9em; margin: 6px 0; }
    .mention { background: rgba(88,101,242,.3); color: #c9cdfb; padding: 0 2px; border-radius: 3px; cursor: default; }
    .chatlog__link { color: #00aff4; }
    .chatlog__attachment-img { max-width: 500px; border-radius: 8px; margin-top: 5px; display: block; }
    .chatlog__attachment-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; background: #2b2d31; border: 1px solid #4e5058; padding: 8px 12px; border-radius: 4px; color: #00aff4; text-decoration: none; font-size: .85rem; }
    .chatlog__attachment-link:hover { background: #35373c; }
    .reply-context { background: rgba(0,0,0,.15); border-left: 3px solid #5865f2; padding: 4px 8px; border-radius: 0 4px 4px 0; margin-bottom: 4px; font-size: .8rem; color: #949ba4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .reply-author { color: #c9cdfb; font-weight: 600; margin-right: 6px; }
    .embed { background: #2b2d31; border-left: 4px solid #4e5058; padding: 10px 14px; border-radius: 0 4px 4px 0; margin-top: 8px; max-width: 480px; overflow: hidden; }
    .embed-provider { font-size: .75rem; color: #949ba4; margin-bottom: 4px; }
    .embed-author { font-size: .875rem; color: #dbdee1; font-weight: 600; margin-bottom: 4px; }
    .embed-title { font-weight: bold; color: #00aff4; text-decoration: none; display: block; margin-bottom: 4px; }
    .embed-title.no-url { color: #dbdee1; cursor: default; }
    .embed-description { font-size: .9rem; color: #dbdee1; }
    .embed-image { max-width: 100%; border-radius: 4px; margin-top: 8px; display: block; }
    .embed-thumbnail { max-width: 80px; max-height: 80px; border-radius: 4px; float: right; margin-left: 10px; }
    .embed-footer { font-size: .75rem; color: #949ba4; margin-top: 8px; clear: both; }
    .blockquote { border-left: 4px solid #4e5058; padding-left: 10px; margin: 4px 0; color: #b9bbbe; }
    .spoiler { background: #202225; color: transparent; border-radius: 3px; padding: 0 2px; cursor: pointer; user-select: none; transition: color .1s; }
    .spoiler.revealed { background: #36393f; color: inherit; }
    .custom-emoji { width: 22px; height: 22px; vertical-align: middle; }
    .nav-buttons { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 2000; }
    .scroll-btn { background: #5865f2; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,.3); font-weight: bold; font-size: .9rem; }
    .scroll-btn:hover { background: #4752c4; }
    .hidden { display: none !important; }
</style>
</head>
<body>
<div class="sidebar">
    <h3>Jump to Date</h3>
    <div class="date-list">
        ${uniqueDates.map(d =>
            `<a href="#d-${d.replace(/[/.]/g, '-')}" class="date-link">${d}</a>`
        ).join('\n        ')}
    </div>
</div>
<div class="main-content">
    <div class="header-fixed" id="top-anchor">
        <div class="header-flex">
            <div>
                <div style="font-size:1.4rem;font-weight:bold;">#${channelName}</div>
                <div style="font-size:.8rem;color:#949ba4;">${allMessages.length.toLocaleString()} Messages &middot; Archived ${new Date().toLocaleString()}</div>
            </div>
            <input type="text" id="searchInput" placeholder="&#128269; Filter messages...">
        </div>
    </div>
    <div class="chatlog">`);

            let lastAuthorId = null;
            let currentDay = '';

            allMessages.forEach(msg => {
                const d = new Date(msg.timestamp);
                const dStr = d.toLocaleDateString();
                const dID = dStr.replace(/[/.]/g, '-');

                if (dStr !== currentDay) {
                    currentDay = dStr;
                    parts.push(`<div class="date-separator" id="d-${dID}">${dStr}</div>`);
                }

                const name = escapeHtml(msg.author.global_name || msg.author.username);
                const avatar = msg.author.avatar
                    ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
                    : `https://cdn.discordapp.com/embed/avatars/0.png`;

                // Attachments: images inline, video with player, everything else as a link
                let atts = '';
                msg.attachments?.forEach(a => {
                    if (a.content_type?.startsWith('image/')) {
                        atts += `<img class="chatlog__attachment-img" src="${escapeHtml(a.url)}" alt="${escapeHtml(a.filename)}" loading="lazy"><br>`;
                    } else if (a.content_type?.startsWith('video/')) {
                        atts += `<video controls style="max-width:500px;border-radius:8px;margin-top:5px;display:block;" src="${escapeHtml(a.url)}"></video>`;
                    } else {
                        atts += `<a class="chatlog__attachment-link" href="${escapeHtml(a.url)}" target="_blank">&#128206; ${escapeHtml(a.filename)}</a>`;
                    }
                });

                // Embeds (rich, article, link, image, video types)
                let embedsHtml = '';
                msg.embeds?.forEach(embed => {
                    const borderColor = embed.color
                        ? '#' + embed.color.toString(16).padStart(6, '0')
                        : '#4e5058';
                    const ep = [`<div class="embed" style="border-left-color:${borderColor}">`];
                    if (embed.provider?.name) ep.push(`<div class="embed-provider">${escapeHtml(embed.provider.name)}</div>`);
                    if (embed.author?.name)   ep.push(`<div class="embed-author">${escapeHtml(embed.author.name)}</div>`);
                    if (embed.thumbnail?.url) ep.push(`<img class="embed-thumbnail" src="${escapeHtml(embed.thumbnail.url)}" loading="lazy">`);
                    if (embed.title) {
                        if (embed.url) ep.push(`<a class="embed-title" href="${escapeHtml(embed.url)}" target="_blank">${escapeHtml(embed.title)}</a>`);
                        else           ep.push(`<span class="embed-title no-url">${escapeHtml(embed.title)}</span>`);
                    }
                    if (embed.description) ep.push(`<div class="embed-description">${parseMarkdown(embed.description)}</div>`);
                    if (embed.image?.url)   ep.push(`<img class="embed-image" src="${escapeHtml(embed.image.url)}" loading="lazy">`);
                    if (embed.footer?.text) ep.push(`<div class="embed-footer">${escapeHtml(embed.footer.text)}</div>`);
                    ep.push('</div>');
                    embedsHtml += ep.join('');
                });

                // Reply context: shows who was being replied to and a snippet
                let replyHtml = '';
                if (msg.referenced_message) {
                    const ref = msg.referenced_message;
                    const refName = escapeHtml(ref.author?.global_name || ref.author?.username || 'Unknown');
                    const refContent = escapeHtml((ref.content || '[attachment]').substring(0, 120));
                    replyHtml = `<div class="reply-context"><span class="reply-author">&#8618; ${refName}</span>${refContent}</div>`;
                }

                const encodedContent = encodeURIComponent((msg.content || '').toLowerCase());
                // Don't group messages that are replies — they need their own header for context
                const isGrouped = msg.author.id === lastAuthorId && !msg.referenced_message;

                if (isGrouped) {
                    parts.push(`<div class="chatlog__message-container" data-content="${encodedContent}">
    <div style="font-size:.6rem;color:#949ba4;text-align:right;padding-right:10px;padding-top:4px;">${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    <div>${parseMarkdown(msg.content, msg.mentions)}${atts}${embedsHtml}</div>
</div>`);
                } else {
                    parts.push(`<div class="chatlog__message-container" style="margin-top:12px;" data-content="${encodedContent}">
    <img class="chatlog__avatar" src="${avatar}" loading="lazy">
    <div>${replyHtml}<span class="chatlog__author">${name}</span><span class="chatlog__timestamp">${d.toLocaleString()}</span><br>${parseMarkdown(msg.content, msg.mentions)}${atts}${embedsHtml}</div>
</div>`);
                }
                lastAuthorId = msg.author.id;
            });

            parts.push(`    </div>
</div>
<div class="nav-buttons">
    <button class="scroll-btn" onclick="window.scrollTo({top:0,behavior:'smooth'})">&#8593; Top</button>
    <button class="scroll-btn" onclick="window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})">&#8595; Bottom</button>
</div>
<script>(${searchScriptFn})()</script>
</body>
</html>`);

            const blob = new Blob([parts.join('')], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            // Include date in filename so multiple archives don't overwrite each other
            a.download = `archive_${channelName}_${new Date().toISOString().slice(0, 10)}.html`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }

    } catch (err) {
        console.error('Discord Archiver: Fatal error:', err);
        const st = document.getElementById('status-text');
        if (st) {
            st.innerText = 'Fatal error — check console (F12).';
            statusDiv.style.borderColor = 'red';
        }
        window.__discordArchiverRunning = false;
        return; // Leave overlay visible so the user sees the error state
    }

    window.__discordArchiverRunning = false;
    statusDiv.remove();
})();
