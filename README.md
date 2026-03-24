# 📦 Discord Channel Archiver

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rroy676/Discord-Archiver?color=5865f2&label=Download%20Extension&style=for-the-badge)](https://github.com/rroy676/Discord-Archiver/releases/latest)

A lightweight browser extension to export Discord chat history into a searchable, offline HTML file with smart navigation and "Stop & Save" functionality.

---

## 📖 Table of Contents
* [⚠️ Disclaimer & Safety](#️-disclaimer--safety)
* [✨ Features](#-features)
* [🚀 How to Install (Firefox)](#-how-to-install-firefox)
* [📂 How to Use](#-how-to-use)
* [📜 License](#-license)

---

> [!CAUTION]
> ## ⚠️ Disclaimer & Safety
> **USE AT YOUR OWN RISK.** This tool automates a standard Discord user account (commonly known as "self-botting"). 
> **Discord's Terms of Service strictly prohibit this.**

### 🛑 Potential Consequences
* **Account Suspension**: Discord's automated systems may detect rapid API requests and permanently ban your account.
* **No Recovery**: Because self-botting is a violation of the [Community Guidelines](https://discord.com/guidelines), Discord support rarely overturns these bans.

### 🛡️ Safety Best Practices
1. **Don't Overuse**: Avoid archiving dozens of massive channels in a single session.
2. **Respect the Delay**: The script includes a **650ms delay** between requests. **Do not decrease this value**; faster requests are the primary way accounts get flagged.
3. **Local Processing**: Your Authorization Token and message data are processed **entirely within your browser**. No data is ever sent to the developers or third-party servers.

---

## ✨ Features
* **Stop & Save**: Break the scraping loop at any time and download what you've gathered so far.
* **Smart Navigation Sidebar**: Jump to specific dates instantly from a fixed sidebar.
* **Jump to Top/Bottom**: Quick-action buttons to zip through long histories.
* **Offline Search**: Search through archived messages without an internet connection.
* **Rate-Limit Protection**: Automatically handles Discord's "429 Too Many Requests" errors.

## 🚀 How to Install (Firefox)
1. Download the latest `.zip` from the [Releases](https://github.com/rroy676/Discord-Archiver/releases) page and extract it.
2. Open Firefox and type `about:debugging` in the URL bar.
3. Click **"This Firefox"** on the left sidebar.
4. Click **"Load Temporary Add-on..."**.
5. Navigate to your extracted folder and select the `manifest.json` file.

## 📂 How to Use
1. Open Discord in your browser and navigate to the channel you want to archive.
2. Click the **Discord Archiver** icon in your browser toolbar.
3. Hit **Start Archiving**. 
4. Watch the progress in the popup. You can click **STOP & SAVE** at any time to generate the file immediately.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
