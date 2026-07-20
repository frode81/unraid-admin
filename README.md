<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="96" alt="Admin for Unraid icon" />
</p>

<h1 align="center">Admin for Unraid</h1>

<p align="center">
  A native-feeling macOS menu bar app for monitoring and managing your Unraid server —
  system, array, Docker containers, and virtual machines — right from your Mac.
</p>

<p align="center">
  <img src="docs/screenshots/dashboard.png" width="720" alt="Dashboard screenshot" />
</p>

## Features

- **Dashboard** — CPU, memory, array capacity, network throughput, temperature, and per-disk status at a glance
- **Docker** — start/stop/restart containers, view live resource usage, update images
- **Virtual machines** — start, stop, pause, and reset VMs
- **Shares** — usage, cache settings, and health for every share
- **Notifications** — view and dismiss Unraid alerts without opening the web UI
- Friendly, readable error states when the server is unreachable (instead of raw API errors)
- Light/dark mode, Norwegian and English localization
- Talks directly to Unraid's official GraphQL API — no polling scripts, no plugins

## Screenshots

| Dashboard | Docker |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Docker](docs/screenshots/docker.png) |

| Virtual machines | Offline / connection error |
| --- | --- |
| ![VMs](docs/screenshots/vms.png) | ![Offline state](docs/screenshots/offline.png) |

## Installation

1. Download the latest `.dmg` from [Releases](https://github.com/frode81/unraid-admin/releases)
2. Drag **Admin for Unraid** into `Applications`
3. On your Unraid server, create an API key under **Settings → Management Access → API Keys**
4. Open the app and connect with your server address and API key

## Development

Built with [Tauri](https://tauri.app) (Rust) + React + TypeScript + Vite.

```sh
npm install
npm run tauri dev    # run in development
npm run tauri build  # build a release .dmg
```

Requires Rust and the standard [Tauri prerequisites](https://tauri.app/start/prerequisites/) for macOS.

## Disclaimer

Not affiliated with or endorsed by Lime Technology, Inc. Unraid® is a trademark of Lime Technology, Inc.
