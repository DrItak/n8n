#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{env, path::PathBuf, process::Stdio, time::Duration};

use anyhow::{Context, Result};
use keyring::Entry;
use portpicker::pick_unused_port;
use tauri::{Manager, State};
use tokio::{process::Command, sync::Mutex, time::sleep};

struct AppState {
    server_url: Mutex<Option<String>>,
}

#[tauri::command]
async fn get_server_url(state: State<'_, AppState>) -> Result<String, String> {
    let url = state
        .server_url
        .lock()
        .await
        .clone()
        .unwrap_or_else(|| "http://localhost:5678".to_string());
    Ok(url)
}

fn user_home() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn n8n_data_dir() -> PathBuf {
    let mut base = user_home();
    base.push(".n8n");
    base
}

fn ensure_encryption_key() -> Result<String> {
    let service = "io.n8n.desktop";
    let account = "encryption_key";
    let entry = Entry::new(service, account).context("create keychain entry")?;
    if let Ok(existing) = entry.get_password() {
        return Ok(existing);
    }
    let key = base64::encode(rand::random::<[u8; 24]>());
    entry
        .set_password(&key)
        .context("store encryption key in keychain")?;
    Ok(key)
}

async fn wait_until_ready(url: &str, timeout_secs: u64) -> Result<()> {
    let client = reqwest::Client::new();
    let deadline = std::time::Instant::now() + Duration::from_secs(timeout_secs);
    loop {
        if std::time::Instant::now() > deadline {
            anyhow::bail!("timeout waiting for server readiness");
        }
        let res = client.get(format!("{url}/healthz")).send().await;
        if let Ok(resp) = res {
            if resp.status().is_success() {
                return Ok(());
            }
        }
        sleep(Duration::from_millis(250)).await;
    }
}

async fn launch_server(port: u16) -> Result<()> {
    // Locate node and compiled n8n binary
    // Prefer the compiled monorepo script if present; fallback to workspace binary
    let workspace_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent().unwrap() // src-tauri
        .parent().unwrap() // desktop
        .parent().unwrap() // macos
        .parent().unwrap() // apps
        .parent().unwrap() // repo root
        .to_path_buf();

    let compiled_dir = workspace_root.join("compiled");
    let cli_bin = if compiled_dir.exists() {
        compiled_dir.join("node_modules/.bin/n8n")
    } else {
        workspace_root.join("packages/cli/bin/n8n")
    };

    let node_bin = which::which("node").unwrap_or_else(|_| PathBuf::from("node"));

    let encryption_key = ensure_encryption_key()?;

    let mut cmd = Command::new(node_bin);
    cmd.arg(cli_bin)
        .arg("start")
        .env("N8N_PORT", port.to_string())
        .env("N8N_LISTEN_ADDRESS", "127.0.0.1")
        .env("N8N_HOST", "localhost")
        .env("N8N_PROTOCOL", "http")
        .env("N8N_ENCRYPTION_KEY", encryption_key)
        .current_dir(&workspace_root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd.spawn().context("spawn n8n server")?;

    // Detach but keep process alive with app; kill on exit
    tauri::async_runtime::spawn(async move {
        if let Some(mut out) = child.stdout.take() {
            let _ = tokio::io::copy(&mut out, &mut tokio::io::sink()).await;
        }
    });

    tauri::async_runtime::spawn(async move {
        if let Some(mut err) = child.stderr.take() {
            let _ = tokio::io::copy(&mut err, &mut tokio::io::sink()).await;
        }
    });

    // Give process a moment to bind
    sleep(Duration::from_millis(200)).await;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    tauri::Builder::default()
        .manage(AppState {
            server_url: Mutex::new(None),
        })
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let port = pick_unused_port().unwrap_or(5678);
                // Launch server
                if let Err(err) = launch_server(port).await {
                    let _ = tauri::api::dialog::message(Some(&handle), "n8n Desktop", format!(
                        "Failed to start n8n server: {err:?}"
                    ));
                    return;
                }
                let url = format!("http://localhost:{port}");
                // Wait until healthy
                let _ = wait_until_ready(&url, 60).await;
                if let Some(state) = handle.try_state::<AppState>() {
                    let mut guard = state.server_url.lock().await;
                    *guard = Some(url);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_server_url])
        .run(tauri::generate_context!())
        .expect("error while running n8n desktop app");
    Ok(())
}