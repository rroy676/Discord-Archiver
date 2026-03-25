# 📦 Discord Channel Archiver (Universal V1.2.0)

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rroy676/Discord-Archiver?color=5865f2&label=Download%20Extension&style=for-the-badge)](https://github.com/rroy676/Discord-Archiver/releases/latest)

A lightweight, high-performance browser extension to export Discord chat history into a searchable, offline HTML file. Fully compatible with **Chrome** and **Firefox** using Manifest V3 standards.

---

## 📖 Table of Contents

- [⚠️ Disclaimer & Safety](#%EF%B8%8F-disclaimer--safety)
- [✨ Features](#-features)
- [🚀 Installation (Chrome & Firefox)](#-installation)
- [📂 How to Use](#-how-to-use)
- [🔍 Troubleshooting](#-troubleshooting)
- [📜 License](#-license)

---

> [!CAUTION]
> ## ⚠️ Disclaimer & Safety
>
> **USE AT YOUR OWN RISK.** This tool automates a standard Discord user account.
> **Discord's Terms of Service strictly prohibit "self-botting" and automated scraping.**
>
> ### 🛑 Potential Consequences
> - **Account Suspension**: Discord's automated systems may detect rapid API requests and permanently ban your account.
> - **No Recovery**: Support rarely overturns bans related to [Community Guidelines](https://discord.com/guidelines) violations.
>
> ### 🛡️ Safety Best Practices
> 1. **Don't Overuse**: Avoid archiving dozens of massive channels in a single session.
> 2. **Smart Jitter**: The script includes a **randomized delay (500ms–800ms)** between requests to mimic human behavior.
> 3. **Local Processing**: Your Authorization Token and message data are processed **entirely within your browser**. No data is ever sent to third-party servers.

---

## ✨ Features

- **Universal MV3 Support**: Built for the latest Chrome and Firefox security standards.
- **Stop & Save**: Break the scraping loop at any time and download what you've gathered so far.
- **Smart Navigation Sidebar**: Jump to specific dates instantly from a fixed sidebar.
- **Highlighted Search**: Real-time filtering with match highlighting. Results update progressively — no browser freeze.
- **Rate-Limit Protection**: Automatically detects and handles Discord's "429 Too Many Requests" errors.
- **Rich Message Support**: Renders embeds, replies, image & file attachments, video, custom emoji, spoilers, blockquotes, and all Discord markdown.
- **Auto-Update Check**: The popup checks GitHub for a newer release and shows a badge if one is available.
- **100% Local**: All processing happens in your browser. No data ever leaves your machine.

---

## 🚀 Installation

### For Chrome / Edge / Brave:

1. Download the latest `.zip` from the [Releases](https://github.com/rroy676/Discord-Archiver/releases) page and extract it.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer Mode** (top right toggle).
4. Click **Load Unpacked** and select the extracted folder.
5. **Grant Permission**: Click the **Puzzle Piece** icon in the toolbar while on Discord to ensure the extension has site access.

### For Firefox:

1. Download and extract the latest `.zip`.
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...** and select the `manifest.json`.
4. **CRITICAL STEP**: Open Discord, click the **Puzzle Piece** icon in the Firefox toolbar, and select **"Always Allow on discord.com"**.

> **Note:** Firefox temporary add-ons are removed when the browser closes. You must reload via `about:debugging` each session. For a permanent install, consider loading as an unsigned add-on via `about:config` (`xpinstall.signatures.required` → `false`).

---

## 📂 How to Use

1. Open Discord in your browser and navigate to the channel you want to archive.
2. Click the **Discord Archiver** icon in your browser toolbar.
3. Hit **Export to HTML**.
4. An overlay will appear on the Discord page showing live progress. Click **STOP & SAVE** at any time to stop and download what's been collected so far.
5. The exported file is saved as `archive_channelname_YYYY-MM-DD.html` — open it in any browser, fully offline.

### 🔍 Using Search in the Exported File

- Type **3 or more characters** into the search bar to filter messages.
- Matching text is **highlighted in amber** as results load.
- Date separators for days with no matches are automatically hidden.
- Clear the search box to restore all messages.

---

## 🔍 Troubleshooting

| Issue | Solution |
|---|---|
| **Nothing happens on click** | Ensure you've granted site permissions via the "Puzzle Piece" menu (especially on Firefox). |
| **Token Not Found** | Refresh the Discord tab (F5) and try again to re-sync the injection bridge. |
| **Broken Images** | Ensure you are connected to the internet; images and avatars link directly to Discord's CDN. |
| **Extension Disappears (Firefox)** | Firefox temporary add-ons are removed on browser close. Reload via `about:debugging` each session. |
| **Export freezes or stops** | You may have hit a rate limit. Wait a few minutes and try again on a smaller channel first. |

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
