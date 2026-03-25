# 📦 Discord Channel Archiver (Universal V1.1.0)

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rroy676/Discord-Archiver?color=5865f2&label=Download%20Extension&style=for-the-badge)](https://github.com/rroy676/Discord-Archiver/releases/latest)

A lightweight, high-performance browser extension to export Discord chat history into a searchable, offline HTML file. Now fully compatible with **Chrome** and **Firefox** using Manifest V3 standards.

---

## 📖 Table of Contents
* [⚠️ Disclaimer & Safety](#️-disclaimer--safety)
* [✨ Features](#-features)
* [🚀 Installation (Chrome & Firefox)](#-installation)
* [📂 How to Use](#-how-to-use)
* [🔍 Troubleshooting](#-troubleshooting)
* [📜 License](#-license)

---

> [!CAUTION]
> ## ⚠️ Disclaimer & Safety
> **USE AT YOUR OWN RISK.** This tool automates a standard Discord user account. 
> **Discord's Terms of Service strictly prohibit "self-botting" and automated scraping.**

### 🛑 Potential Consequences
* **Account Suspension**: Discord's automated systems may detect rapid API requests and permanently ban your account.
* **No Recovery**: Support rarely overturns bans related to [Community Guideline](https://discord.com/guidelines) violations.

### 🛡️ Safety Best Practices
1. **Don't Overuse**: Avoid archiving dozens of massive channels in a single session.
2. **Smart Jitter**: The script includes a **randomized delay (500ms–800ms)** between requests to mimic human behavior.
3. **Local Processing**: Your Authorization Token and message data are processed **entirely within your browser**. No data is ever sent to third-party servers.

---

## ✨ Features
* **Universal V3 Support**: Rebuilt for the latest Chrome and Firefox security standards.
* **Stop & Save**: Break the scraping loop at any time and download what you've gathered so far.
* **Smart Navigation Sidebar**: Jump to specific dates instantly from a fixed sidebar.
* **Offline Search**: Real-time filtering of archived messages without an internet connection.
* **Rate-Limit Protection**: Automatically detects and handles Discord's "429 Too Many Requests" errors.

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
   *(Note: Firefox MV3 blocks all scripts until this manual permission is granted.)*

---

## 📂 How to Use
1. Open Discord in your browser and navigate to the channel you want to archive.
2. Click the **Discord Archiver** icon in your browser toolbar.
3. Hit **Export to HTML**. 
4. An overlay will appear on the Discord page showing progress. Click **STOP & SAVE** to finish and download your file.

---

## 🔍 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Nothing happens on click** | Ensure you've granted site permissions via the "Puzzle Piece" menu (especially on Firefox). |
| **Token Not Found** | Refresh the Discord tab (F5) and try again to re-sync the injection bridge. |
| **Broken Images** | Ensure you are connected to the internet; images are linked directly to Discord's CDN. |
| **Extension Disappears** | Firefox temporary add-ons are removed when the browser closes. You must reload it via `about:debugging` next session. |

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
