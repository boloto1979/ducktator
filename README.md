<p align="center">
  <img src="public/images/duck.png" width="100" alt="DuckTator logo" />
</p>

<h1 align="center">DuckTator</h1>

<p align="center">
  A productivity Chrome extension that deploys a dictator duck to roast you when you procrastinate.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

---

## Overview

DuckTator monitors the time you spend on blacklisted websites. After the configured interval (default: 5 minutes), it overlays the current tab with a fullscreen duck screen that insults you with an AI-generated or curated roast message — and only lets you stay if you admit weakness by clicking a button, which restarts the timer.

> No cloud. No tracking. Everything runs locally in your browser.

---

## Features

- **Site blacklist** — block any domain via the popup or the options page
- **AI-powered roasts** — uses Chrome's on-device Gemini Nano (`window.ai`) to generate context-aware insults based on the page title and URL; falls back to curated messages if unavailable
- **3 aggressiveness levels** — Gentle 🐥, Aggressive 🦆, Brutal ☠️ — each with its own message set and AI prompt
- **Active schedule** — restrict monitoring to specific days of the week and time ranges (supports overnight ranges)
- **Pause mode** — snooze monitoring for 15, 30, or 60 minutes without disabling the extension
- **Quack sound** — synthesized duck sound via Web Audio API when the overlay appears (no audio files required), configurable
- **Activity log** — timestamped log of the last 50 roast events, accessible from the popup
- **Global toggle** — enable/disable the extension instantly from the popup with a visual badge indicator

---

## How It Works

```
User navigates to a blacklisted site
          │
          ▼
[background] chrome.alarms.create('roast_<tabId>', { delayInMinutes: 5 })
          │
          ▼  (timer fires)
[background] chrome.tabs.sendMessage → ROAST_THE_USER
          │
          ▼
[content script] captures page title + URL path as context
          │
          ├── window.ai available? → Gemini Nano generates a roast
          └── fallback → picks a random message from the curated list
          │
          ▼
Fullscreen overlay blocks the page
          │
          └── User clicks "I am weak..." → overlay dismissed, timer restarted
```

The background service worker uses `chrome.alarms` so the timer persists even when the browser window is minimized or the popup is closed.

---

## Installation (Development)

**Requirements:** Node.js 18+, Chrome 114+

```bash
git clone https://github.com/your-username/duck-tator.git
cd duck-tator
npm install
```

### Development (hot-reload)

```bash
npm run dev
```

Then in Chrome:

1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

The extension reloads automatically on file changes thanks to `@crxjs/vite-plugin`. If a reload does not trigger, click the refresh icon on the extension card in `chrome://extensions`.

### Production build

```bash
npm run build
```

The `dist/` folder contains the packaged extension ready to be loaded or zipped for distribution.

---

## Enabling On-Device AI (Optional)

By default, DuckTator uses a curated list of fallback messages. To enable AI-generated roasts powered by Gemini Nano running locally on your machine:

1. Use **Chrome 128 or later**
2. Open `chrome://flags` and enable:
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
3. Open `chrome://components`, find **Optimization Guide On Device Model** and click **Check for update** (~1.7 GB download)
4. Verify in DevTools console:
   ```js
   await window.ai.languageModel.capabilities()
   // Expected: { available: "readily" }
   ```

> AI requires a device with sufficient RAM and GPU. If unavailable, the extension falls back silently to the curated message list.

---

## Project Structure

```
src/
├── background/
│   └── index.ts          # Service worker — alarms, tab monitoring, schedule/pause logic
├── content/
│   ├── index.ts          # Injected into every page — receives roast command, reads DOM context
│   └── ui.ts             # Creates the overlay DOM (no framework)
├── popup/
│   └── index.tsx         # Popup UI — toggle, blacklist, pause controls, activity log
├── options/
│   └── index.tsx         # Options page — blacklist, aggressiveness, sound, schedule
├── services/
│   ├── ai.ts             # Roast generation — window.ai + fallback messages per level
│   └── storage.ts        # Typed wrapper over chrome.storage.local
├── components/
│   ├── Header.tsx
│   └── Layout.tsx
├── types/
│   └── index.ts          # AppStorage, Schedule, RoastMessage interfaces
└── utils/
    ├── constants.ts      # ROAST_DELAY_MINUTES, DEFAULT_SCHEDULE
    ├── domain.ts         # URL parsing helpers
    └── sound.ts          # Web Audio API quack synthesizer
```

---

## Configuration

All settings are persisted in `chrome.storage.local`.

| Setting | Default | Description |
|---|---|---|
| `blacklist` | `[]` | List of blocked domain substrings |
| `global_enabled` | `true` | Master on/off switch |
| `aggressiveness` | `2` | Roast intensity: `1` Gentle, `2` Aggressive, `3` Brutal |
| `sound_enabled` | `true` | Play synthesized quack on overlay appearance |
| `schedule.enabled` | `false` | Restrict monitoring to a time window |
| `schedule.days` | `[1,2,3,4,5]` | Active days (0=Sun … 6=Sat) |
| `schedule.startTime` | `"09:00"` | Start of active window |
| `schedule.endTime` | `"18:00"` | End of active window |
| `paused_until` | `0` | Unix timestamp (ms) until which monitoring is paused |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build | [Vite 5](https://vitejs.dev) + [@crxjs/vite-plugin](https://crxjs.dev) |
| Language | TypeScript 5 (strict) |
| UI | React 18 (popup & options), vanilla DOM (overlay) |
| Styling | TailwindCSS 3 + PostCSS |
| Extension API | Chrome Manifest V3 — `storage`, `tabs`, `alarms`, `scripting`, `action` |
| AI | Chrome `window.ai` Prompt API (Gemini Nano, on-device) |
| Audio | Web Audio API (synthesized, no external files) |

---

## Roadmap

- [ ] **Statistics** — time spent per site, roast count, focus streak, weekly summary
- [ ] **Mini challenges** — solve a math problem or type a custom phrase to unlock the site (Hardcore mode)
- [ ] **Sync across devices** — `chrome.storage.sync` support
- [ ] **Configurable delay per site** — different timers for different domains
- [ ] **Firefox support** — WebExtensions API compatibility

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a pull request

---

## License

[MIT](LICENSE)
