use serde::Serialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

use crate::crypto;
use crate::graphql::execute_graphql;

pub const STORE_FILE: &str = "connection.json";
pub const HOST_KEY: &str = "host";
pub const API_KEY_KEY: &str = "apiKey";

#[cfg(unix)]
fn restrict_permissions(app: &AppHandle) {
    use std::fs;
    use std::os::unix::fs::PermissionsExt;

    if let Ok(dir) = app.path().app_config_dir() {
        let path = dir.join(STORE_FILE);
        if let Ok(metadata) = fs::metadata(&path) {
            let mut perms = metadata.permissions();
            perms.set_mode(0o600);
            let _ = fs::set_permissions(&path, perms);
        }
    }
}

#[cfg(not(unix))]
fn restrict_permissions(_app: &AppHandle) {}

#[tauri::command]
pub fn save_connection(app: AppHandle, host: String, api_key: String) -> Result<(), String> {
    let encrypted = crypto::encrypt(&app, &api_key)?;

    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.set(HOST_KEY, serde_json::json!(host));
    store.set(API_KEY_KEY, serde_json::json!(encrypted));
    store.save().map_err(|e| e.to_string())?;
    restrict_permissions(&app);
    Ok(())
}

#[tauri::command]
pub fn get_connection_host(app: AppHandle) -> Result<Option<String>, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    Ok(store
        .get(HOST_KEY)
        .and_then(|v| v.as_str().map(|s| s.to_string())))
}

#[tauri::command]
pub fn clear_connection(app: AppHandle) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.delete(HOST_KEY);
    store.delete(API_KEY_KEY);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize)]
pub struct ConnectionTestResult {
    pub ok: bool,
    pub message: String,
}

/// Tests a host/key pair directly (used by the setup screen before saving).
#[tauri::command]
pub async fn test_connection(host: String, api_key: String) -> Result<ConnectionTestResult, String> {
    match execute_graphql(&host, &api_key, "{ info { os { platform } } }", None).await {
        Ok(_) => Ok(ConnectionTestResult {
            ok: true,
            message: "Connection successful".into(),
        }),
        Err(e) => Ok(ConnectionTestResult {
            ok: false,
            message: e,
        }),
    }
}
