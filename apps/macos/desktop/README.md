# n8n Desktop for macOS (Tauri)

A native macOS wrapper for n8n using Tauri. It launches the local n8n server on a random free port (localhost) and renders the editor UI in a secure WebView.

## Requirements
- macOS 13+
- Xcode Command Line Tools
- Rust toolchain (`rustup`)
- Node.js 22+ and pnpm 10+

## Build steps

1. From the repo root, build the server and UI into `compiled`:

```bash
pnpm i
pnpm build:n8n
```

2. Build the Tauri app:

```bash
cd apps/macos/desktop/src-tauri
cargo tauri build
```

The `.app` and `.dmg` will be in `apps/macos/desktop/src-tauri/target/release/bundle`.

## Run in dev

```bash
cd apps/macos/desktop/src-tauri
cargo tauri dev
```

This opens a window that boots the local server then navigates to the editor.

## macOS integrations

- Stores `N8N_ENCRYPTION_KEY` in macOS Keychain (service: `io.n8n.desktop`, account: `encryption_key`).
- Uses localhost only (no external listeners) with a random free port and Healthcheck.
- Hardened runtime + app sandbox with network client entitlement.

## Notes

- On first run, server startup and UI cache generation may take longer.
- The app relies on the monorepo workspace. For a fully self-contained bundle, extend the build step to include `compiled` artifacts inside the `.app` Resources.