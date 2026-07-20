use std::sync::Mutex;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_store::StoreExt;
use tokio::task::AbortHandle;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::Message;

use crate::connection::{API_KEY_KEY, HOST_KEY, STORE_FILE};
use crate::crypto;

#[derive(Default)]
pub struct StatsStreamState(pub Mutex<Option<AbortHandle>>);

fn get_connection(app: &AppHandle) -> Result<(String, String), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    let host = store
        .get(HOST_KEY)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or_else(|| "No connection is configured yet.".to_string())?;
    let encrypted_key = store
        .get(API_KEY_KEY)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or_else(|| "No API key is stored.".to_string())?;
    let api_key = crypto::decrypt(app, &encrypted_key)?;
    Ok((host, api_key))
}

async fn stream_once(app: &AppHandle) -> Result<(), String> {
    let (host, api_key) = get_connection(app)?;
    let url = format!("ws://{}/graphql", host.trim_end_matches('/'));

    let mut request = url
        .into_client_request()
        .map_err(|e| format!("Invalid WebSocket URL: {e}"))?;
    request
        .headers_mut()
        .insert("x-api-key", api_key.parse().map_err(|e| format!("{e}"))?);
    request.headers_mut().insert(
        "Sec-WebSocket-Protocol",
        "graphql-transport-ws".parse().map_err(|e| format!("{e}"))?,
    );

    let (ws_stream, _) = connect_async(request)
        .await
        .map_err(|e| format!("Could not connect to WebSocket: {e}"))?;
    let (mut write, mut read) = ws_stream.split();

    write
        .send(Message::Text(
            json!({ "type": "connection_init", "payload": { "x-api-key": api_key } }).to_string(),
        ))
        .await
        .map_err(|e| format!("Could not start connection: {e}"))?;

    let query = "subscription { dockerContainerStats { id cpuPercent memUsage memPercent netIO blockIO } }";
    write
        .send(Message::Text(
            json!({ "id": "docker-stats", "type": "subscribe", "payload": { "query": query } })
                .to_string(),
        ))
        .await
        .map_err(|e| format!("Could not start subscription: {e}"))?;

    while let Some(msg) = read.next().await {
        let msg = msg.map_err(|e| format!("WebSocket error: {e}"))?;
        let Message::Text(text) = msg else { continue };
        let value: Value = match serde_json::from_str(&text) {
            Ok(v) => v,
            Err(_) => continue,
        };

        match value.get("type").and_then(|t| t.as_str()) {
            Some("next") => {
                if let Some(data) = value
                    .get("payload")
                    .and_then(|p| p.get("data"))
                    .and_then(|d| d.get("dockerContainerStats"))
                {
                    let _ = app.emit("docker-stats", data.clone());
                }
            }
            Some("error") => {
                let payload = value
                    .get("payload")
                    .map(|p| p.to_string())
                    .unwrap_or_else(|| "unknown error".to_string());
                let _ = app.emit("docker-stats-error", format!("Subscription rejected: {payload}"));
            }
            Some("complete") => break,
            _ => {}
        }
    }

    Ok(())
}

async fn run(app: AppHandle) {
    loop {
        if let Err(e) = stream_once(&app).await {
            let _ = app.emit("docker-stats-error", e);
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

#[tauri::command]
pub async fn start_docker_stats(
    app: AppHandle,
    state: State<'_, StatsStreamState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if guard.is_some() {
        return Ok(());
    }
    let handle = tokio::spawn(run(app));
    *guard = Some(handle.abort_handle());
    Ok(())
}

#[tauri::command]
pub fn stop_docker_stats(state: State<StatsStreamState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(handle) = guard.take() {
        handle.abort();
    }
    Ok(())
}
