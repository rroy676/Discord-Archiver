(async function() {
    console.log("Starting Unlimited Discord Archiver...");
    
    let isRunning = true;

    const statusDiv = document.createElement('div');
    statusDiv.style = "position:fixed;top:20px;right:20px;z-index:9999;background:#2b2d31;color:white;padding:15px;border-radius:8px;border:1px solid #5865f2;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-family:sans-serif;min-width:180px;text-align:center;";
    
    statusDiv.innerHTML = `
        <b style="display:block;margin-bottom:10px;">Archiver Active</b>
        <div style="font-size:1.2rem;margin-bottom:10px;">Messages: <span id='arch-count'>0</span></div>
        <button id="stop-archiver" style="width:100%; background:#ed4245; color:white; border:none; border-radius:4px; padding:8px; cursor:pointer; font-weight:bold;">STOP & SAVE</button>
        <small id="status-text" style="display:block;margin-top:8px;color:#949ba4;">Scraping history...</small>
    `;
    document.body.appendChild(statusDiv);

    document.getElementById('stop-archiver').addEventListener('click', () => {
        isRunning = false;
        document.getElementById('stop-archiver').disabled = true;
        document.getElementById('stop-archiver').style.background = "#4e5058";
        document.getElementById('status-text').innerText = "Finishing current batch...";
    });

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
            return foundToken || localStorage.getItem('token')?.replace(/"/g, "");
        } catch (e) { return null; }
    };

    const token = getToken();
    if (!token) {
        statusDiv.remove();
        return alert("Error: Token not found.");
    }

    const parseMarkdown = (text, mentions = []) => {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/```([a-z0-9+#]*\n)?([\s\S]*?)```/gi, '<pre class="markdown-code-block"><code>$2</code></pre>')
            .replace(/`(.*?)`/g, '<span class="markdown-code">$1</span>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/&lt;@!?(\d+)&gt;/g, (match, id) => {
                const m = mentions.find(user => user.id === id);
                return `<span class="mention">@${m ? (m.global_name || m.username) : id}</span>`;
            })
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" class="chatlog__link">$1</a>')
            .replace(/(?<!href="|">)(https?:\/\/[^\s&<]+)/g, '<a href="$1" target="_blank" class="chatlog__link">$1</a>')
            .replace(/\n/g, '<br>');
    };

    const channelId = window.location.href.split('/').pop();
    const channelName = document.title.split(' | ')[0].replace(/^#/, '') || "Archive";
    let allMessages = [];
    let lastId = null;

    try {
        while (isRunning) {
            let url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=100`;
            if (lastId) url += `&before=${lastId}`;
            
            const resp = await fetch(url, { headers: { 'Authorization': token } });
            
            if (resp.status === 429) {
                const retryAfter = (await resp.json()).retry_after || 5;
                statusDiv.style.borderColor = "red";
                await new Promise(r => setTimeout(r, (retryAfter * 1000) + 500));
                continue;
            }

            const msgs = await resp.json();
            if (!msgs || msgs.length === 0) break;

            allMessages.push(...msgs);
            lastId = msgs[msgs.length - 1].id;
            
            document.getElementById('arch-count').innerText = allMessages.length.toLocaleString();
            
            await new Promise(r => setTimeout(r, 650)); 
        }

        statusDiv.innerHTML = "<b>Generating Archive...</b>";

        if (allMessages.length > 0) {
            allMessages.reverse();
            const uniqueDates = [...new Set(allMessages.map(m => new Date(m.timestamp).toLocaleDateString()))];

            let htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>#${channelName}</title>
            <style>
                html { scroll-behavior: smooth; }
                body { background-color: #313338; color: #dbdee1; font-family: sans-serif; padding: 0; margin: 0; display: flex; }
                
                /* Fixed Left Sidebar for Dates */
                .sidebar { width: 200px; position: fixed; top: 0; left: 0; bottom: 0; background: #2b2d31; border-right: 1px solid #1e1f22; display: flex; flex-direction: column; padding: 20px 10px; z-index: 1001; }
                .sidebar h3 { font-size: 0.9rem; color: #949ba4; text-transform: uppercase; margin-bottom: 15px; padding-left: 10px; }
                .date-list { overflow-y: auto; flex-grow: 1; }
                .date-link { display: block; color: #b5bac1; text-decoration: none; padding: 8px 10px; border-radius: 4px; font-size: 0.85rem; margin-bottom: 2px; }
                .date-link:hover { background: #35373c; color: #fff; }

                /* Header and Content Adjustment */
                .main-content { margin-left: 220px; flex-grow: 1; }
                .header-fixed { position: fixed; top: 0; left: 220px; right: 0; background-color: #2b2d31; border-bottom: 1px solid #1e1f22; z-index: 1000; padding: 1.5rem 2rem; }
                .header-flex { display: flex; align-items: center; justify-content: space-between; }
                #searchInput { width: 300px; background: #1e1f22; border: 1px solid #4e5058; color: white; padding: 8px; border-radius: 4px; }
                
                .chatlog { margin-top: 120px; padding: 20px; padding-bottom: 120px; }
                .date-separator { border-bottom: 1px solid #4e5058; margin: 2rem 0 1rem; color: #949ba4; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; }
                .chatlog__message-container { display: grid; grid-template-columns: 56px 1fr; padding: 4px 0; }
                .chatlog__message-container:hover { background: #2e3035; }
                .chatlog__avatar { width: 40px; height: 40px; border-radius: 50%; margin-left: 8px; }
                .chatlog__author { color: #fff; font-weight: 600; margin-right: 8px; }
                .chatlog__timestamp { color: #949ba4; font-size: 0.75rem; }
                .markdown-code-block { background: #1e1f22; padding: 10px; border-radius: 4px; border: 1px solid #232428; overflow-x: auto; }
                .mention { background: rgba(88, 101, 242, 0.3); color: #c9cdfb; padding: 0 2px; border-radius: 3px; }
                .chatlog__attachment-img { max-width: 500px; border-radius: 8px; margin-top: 5px; }
                
                .nav-buttons { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 2000; }
                .scroll-btn { background: #5865f2; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold; font-size: 0.9rem; }
                
                .hidden { display: none !important; }
            </style></head><body>
            <div class="sidebar">
                <h3>Jump to Date</h3>
                <div class="date-list">
                    ${uniqueDates.map(d => `<a href="#d-${d.replace(/\//g, '-').replace(/\./g, '-')}" class="date-link">${d}</a>`).join('')}
                </div>
            </div>
            <div class="main-content">
                <div class="header-fixed" id="top-anchor">
                    <div class="header-flex">
                        <div><div style="font-size: 1.4rem; font-weight: bold;">#${channelName}</div><div style="font-size: 0.8rem; color: #949ba4;">${allMessages.length} Messages</div></div>
                        <input type="text" id="searchInput" placeholder="Filter messages...">
                    </div>
                </div>
                <div class="chatlog">`;

            let lastAuthorId = null;
            let currentDay = "";

            allMessages.forEach(msg => {
                const d = new Date(msg.timestamp);
                const dStr = d.toLocaleDateString();
                const dID = dStr.replace(/\//g, '-').replace(/\./g, '-');
                if (dStr !== currentDay) {
                    currentDay = dStr;
                    htmlContent += `<div class="date-separator" id="d-${dID}">${dStr}</div>`;
                }

                const name = msg.author.global_name || msg.author.username;
                const avatar = msg.author.avatar ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`;
                
                let atts = '';
                msg.attachments?.forEach(a => { if(a.content_type?.startsWith('image/')) atts += `<img class="chatlog__attachment-img" src="${a.url}"><br>`; });

                if (msg.author.id === lastAuthorId) {
                    htmlContent += `<div class="chatlog__message-container" data-content="${(msg.content||'').toLowerCase().replace(/"/g, '&quot;')}">
                        <div style="font-size:0.6rem; color:#949ba4; text-align:right; padding-right:10px;">${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        <div>${parseMarkdown(msg.content, msg.mentions)}${atts}</div>
                    </div>`;
                } else {
                    htmlContent += `<div class="chatlog__message-container" style="margin-top:12px;" data-content="${(msg.content||'').toLowerCase().replace(/"/g, '&quot;')}">
                        <img class="chatlog__avatar" src="${avatar}">
                        <div><span class="chatlog__author">${name}</span><span class="chatlog__timestamp">${d.toLocaleString()}</span><br>${parseMarkdown(msg.content, msg.mentions)}${atts}</div>
                    </div>`;
                }
                lastAuthorId = msg.author.id;
            });

            htmlContent += `</div></div>
            <div class="nav-buttons">
                <button class="scroll-btn" onclick="window.scrollTo(0, 0)">↑ Top</button>
                <button class="scroll-btn" onclick="window.scrollTo(0, document.body.scrollHeight)">↓ Bottom</button>
            </div>
            <script>
                window.onload = () => window.scrollTo(0, document.body.scrollHeight);
                document.getElementById('searchInput').oninput = (e) => {
                    const val = e.target.value.toLowerCase();
                    document.querySelectorAll('.chatlog__message-container').forEach(m => {
                        m.classList.toggle('hidden', !m.getAttribute('data-content').includes(val));
                    });
                };
            <\/script></body></html>`;

            const blob = new Blob([htmlContent], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `archive_${channelName}.html`;
            a.click();
        }
    } catch (err) { console.error(err); }
    statusDiv.remove();
})();