# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A macOS desktop app (Tauri 2, Rust + React/TypeScript) that talks directly to a single Unraid
server's official GraphQL API to show system/array status and manage Docker containers, VMs,
shares, and notifications. Not affiliated with Lime Technology.

## Commands

```sh
npm install           # install JS deps
npm run dev            # vite only, browser preview (no Tauri/native APIs — invoke() calls will fail)
npm run tauri dev      # full app: Rust backend + webview, hot-reloads the frontend
npm run build           # tsc typecheck + vite build (frontend only)
npm run tauri build     # release build, produces the .dmg in src-tauri/target/release/bundle/dmg/
npx tsc --noEmit         # typecheck without building
```

There is no lint or test setup in this repo (no eslint config, no test runner). Rust side: `cd
src-tauri && cargo check` / `cargo build` for a Rust-only check.

`npm run tauri dev` recompiles the Rust binary on backend changes (slow, ~20–30s) but hot-reloads
the frontend instantly. Prefer `npm run dev` for pure UI iteration when you don't need real Tauri
`invoke()` calls.

## Architecture

**Split responsibility between Rust and the frontend**: the Rust backend (`src-tauri/src/`) owns
connection storage, secret encryption, and the two long-lived WebSocket subscriptions. Everything
else — all GraphQL queries/mutations, polling, and UI state — lives in the frontend and goes
through one generic passthrough command.

- `src-tauri/src/connection.rs` — stores `{host, apiKey}` in a Tauri store (`connection.json` in
  the app config dir), API key encrypted via `crypto.rs`. `test_connection` is used by the setup
  screen before saving.
- `src-tauri/src/crypto.rs` — AES-256-GCM, key generated once and persisted as `connection.key`
  (chmod 600) next to the store file. Not exposed to the frontend.
- `src-tauri/src/graphql.rs` — `graphql_request(query, variables)` is the **only** command the
  frontend uses to talk to Unraid's `/graphql` endpoint. It reads the stored host/key itself; the
  frontend never sees the API key. All queries/mutations are defined as raw GraphQL strings in
  `src/lib/queries.ts`, not in Rust.
- `src-tauri/src/docker_stats.rs` / `notification_stream.rs` — each opens a `graphql-transport-ws`
  WebSocket subscription (`dockerContainerStats`, `notificationAdded`) in a spawned Tokio task and
  re-emits messages as Tauri events (`docker-stats`, `unraid-notification`, plus `*-error`
  variants). Auto-reconnects with a 5s backoff on error. State (`AbortHandle`) is tracked per-app
  in `Mutex`-guarded managed state so `start_*`/`stop_*` commands are idempotent.

**Frontend data flow**: `src/lib/api.ts` wraps `invoke("graphql_request", ...)` as
`graphqlRequest<T>()`. `src/lib/queries.ts` is the single place with every query/mutation string
plus a `useX()` React Query hook per one — polled via `refetchInterval` (see below), not via the
WebSocket subscriptions except for the two exceptions above (Docker stats, notifications), which
are consumed instead through `useDockerStats()` / `useNotificationStream()` listening for the
Tauri events emitted by the Rust side.

Mutations invalidate their query key on success (e.g. `useDockerAction` invalidates
`["docker-containers"]`) rather than doing optimistic updates — there's a `suppressedContainerIds`
set in `queries.ts` so intentional stop/restart/pause actions aren't misreported as crashes by the
notification watcher (see below).

**Polling**: `useRefreshInterval()` (`src/lib/settings.tsx`) provides a single interval (default
5s, user-configurable in Settings, persisted to `localStorage`) used as `refetchInterval` by every
query hook. Only queries for the currently mounted page actually poll — `App.tsx` conditionally
renders one page component at a time, so switching pages naturally starts/stops that page's
polling. `useSystemInfo` and `useNotifications` are the exception: they're also used in
`Sidebar.tsx` (online/offline dot, unread badge), so they poll continuously regardless of page.

**Background notification watcher**: `NotificationWatcher` (`src/lib/notificationWatcher.ts`) is
mounted once at the app root (in `App.tsx`, only when connected) and never unmounts. It diffs
consecutive polled Docker/array results to detect state transitions (container crashed, update
available, disk health degraded) and fires native notifications via `src/lib/notifications.ts`,
gated by per-category toggles from `useNotificationSettings()`. It also owns the
`useNotificationStream()` WebSocket subscription for server-side Unraid alerts.

**Error handling convention**: Rust commands return `Result<T, String>`, so a failed `invoke()`
rejects with a plain string (not an `Error`). `src/components/ErrorNotice.tsx` is the shared way
pages render query errors — it special-cases the "Could not reach the server" prefix
(`graphql.rs`'s `execute_graphql`) to show a friendly offline message instead of the raw
transport error. Loading states use `src/components/Loading.tsx` (`TableLoadingRow` for table
bodies, `LoadingBlock` for list containers), rendered when a query's `isLoading` is true and no
cached data exists yet.

**Setup/connection gate**: `App.tsx` calls `get_connection_host` on mount; if no host is stored it
renders `Setup.tsx` instead of the main layout. `Setup.tsx`'s "Connect" flow requires a successful
`test_connection` before it will call `save_connection` — don't bypass that check when editing
this flow, since `save_connection` itself doesn't validate reachability.

**i18n**: `src/i18n/` — `nb` (Norwegian, default) and `en`, flat key namespaces per page
(`dashboard.*`, `docker.*`, etc.) in `src/i18n/locales/{nb,en}.json`. Both files must be kept in
sync — add new keys to both when adding UI strings.

**Styling**: Tailwind v4 (via `@tailwindcss/vite`, no separate config file — see `src/index.css`
for the `@import`/theme setup). `src/lib/ui.ts` exports the shared `CARD` class string used for
every card/panel border+background. No responsive breakpoints are used anywhere — layout is fixed
for the app's single native window (`minWidth: 820, minHeight: 520` in `src-tauri/tauri.conf.json`).

## Known constraints worth knowing before changing things

- The Tauri app identifier is `com.froderoste.unraid-admin`; its config dir
  (`~/Library/Application Support/com.froderoste.unraid-admin/`) holds the real user's live
  connection (`connection.json` + `connection.key`). `npm run tauri dev` uses this **same**
  identifier/config dir as the built app — back up and restore those two files if you need to
  temporarily point dev at a different/fake connection.
- Restart, in `useDockerAction`, is implemented client-side as stop-then-start because some
  Unraid API versions don't expose a `restart` field on `DockerMutations`.
