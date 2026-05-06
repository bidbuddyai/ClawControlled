# ClawControlled

ClawControlled is a production-oriented OpenClaw desktop client built with Electron, React, TypeScript, and Vite. It provides an operational workspace for chat sessions, agent management, cron monitoring, canvas workflows, server configuration, and device-connected node features.

## What ClawControlled Is

ClawControlled is the rebuilt evolution of the earlier ClawControl client. It focuses on:

- a clean operational light/dark interface
- reliable multi-session chat workflows
- robust New Chat session creation and switching
- interactive slash-command guidance with typed fallback
- OpenClaw management surfaces for agents, sessions, cron, settings, and usage
- desktop packaging for Linux via AppImage and `.deb`

## Core Features

- **ClawControlled branding** across app metadata, UI labels, and packaging
- **Real light/dark mode toggle** with persisted user preference
- **Operational UI theme** using a consistent green/neutral design system
- **Reliable New Chat flow** from the sidebar button and `/session` command path
- **Interactive command center** when typing `/`, with grouped actions and confirm flow for destructive actions
- **Concurrent per-session streaming** with corrected stream isolation behavior
- **Session management** with unread counts, pinning, caching, and quick switching
- **Agent management** with detail views and create/edit flows
- **Cron management** with list/detail/create surfaces
- **Canvas panel integration** with panel toggle and runtime visibility state
- **Usage monitoring** and management dashboards
- **Voice dictation and wake-word support** where platform support exists
- **Image attachments** in chat
- **Node/device-connected features** for OpenClaw node mode

## Setup

### Requirements

- Node.js 20+ recommended
- npm
- Linux desktop environment for Linux packaging
- OpenClaw Gateway / server reachable over `ws://` or `wss://`

### Install

```bash
git clone <your-repo-url>
cd ClawControlled
npm install
```

## Run Commands

### Development

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Typecheck

```bash
npm run typecheck
```

### Tests

```bash
npm run test
npm run test:run
```

### Production Build

```bash
npm run build
```

### Platform Builds

```bash
npm run build:linux
npm run build:mac
npm run build:win
```

## Linux Build Outputs

Current Linux packaging produces:

- `release/ClawControlled-*.AppImage`
- `release/clawcontrolled_*_amd64.deb`

### Run Linux Artifacts

**AppImage**

```bash
chmod +x release/ClawControlled-*.AppImage
./release/ClawControlled-*.AppImage
```

**Debian/Ubuntu**

```bash
sudo dpkg -i release/clawcontrolled_*_amd64.deb
```

## Connecting to OpenClaw

1. Open **Settings**.
2. Set the **Server URL** to your OpenClaw WebSocket endpoint.
3. Choose token or password authentication if required.
4. Save and connect.
5. Approve the device pairing request on the server when prompted.

## Feature Notes

### New Chat Session

ClawControlled supports a dedicated New Chat workflow that:

- creates a brand new session
- clears the active chat view for the new session
- preserves prior sessions in history
- switches immediately to the new session
- resets session-scoped UI state cleanly

### Slash Command UX

Typing `/` opens the interactive command center. Typed commands still work normally.

Current guided categories:

- `/session`
- `/agent`
- `/cron`
- `/config`
- `/canvas`
- `/model`
- `/tools`

### Theme System

ClawControlled uses a strict operational palette:

- primary green `#03512A`
- light background `#FFFFFF`
- dark background near `#06140D`
- no neon accent scheme

## Known Limitations

- Some deeper AEGIS-style management surfaces still rely on existing app views rather than fully rebuilt dedicated panels.
- Several slash-command category actions currently provide guided/stub responses where backend-safe execution flows still need broader UI work.
- Build output includes non-fatal Vite chunk-size warnings and dynamic import warnings.
- `npm install` currently reports upstream dependency vulnerabilities; installation still succeeds.

## Verification Status

Latest verified commands in this rebuild:

```bash
npm install
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Observed status during verification:

- install: success
- lint: warnings only, no errors
- typecheck: success
- tests: success
- build: success through web/electron build and Linux packaging flow

## Project Structure

```text
ClawControlled/
├── electron/
├── src/
│   ├── components/
│   ├── lib/
│   ├── store/
│   └── styles/
├── plugins/
└── release/
```

## Notes for Operators

ClawControlled is intended to be a polished OpenClaw operations client rather than a generic chat shell. The current rebuild prioritizes stability, multi-session correctness, guided command execution, and clean operational presentation.
