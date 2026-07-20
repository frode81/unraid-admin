use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::connection::{API_KEY_KEY, HOST_KEY, STORE_FILE};
use crate::crypto;

pub async fn execute_graphql(
    host: &str,
    api_key: &str,
    query: &str,
    variables: Option<Value>,
) -> Result<Value, String> {
    let url = format!("http://{}/graphql", host.trim_end_matches('/'));
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "query": query,
        "variables": variables.unwrap_or_else(|| serde_json::json!({})),
    });

    let resp = client
        .post(&url)
        .header("x-api-key", api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Could not reach the server: {e}"))?;

    let status = resp.status();
    let json: Value = resp
        .json()
        .await
        .map_err(|e| format!("Unexpected response from the server: {e}"))?;

    if !status.is_success() {
        return Err(format!("HTTP {status}: {json}"));
    }
    if let Some(errors) = json.get("errors") {
        return Err(format!("GraphQL error: {errors}"));
    }
    Ok(json.get("data").cloned().unwrap_or(Value::Null))
}

/// Generic passthrough used by the frontend for every query/mutation.
#[tauri::command]
pub async fn graphql_request(
    app: AppHandle,
    query: String,
    variables: Option<Value>,
) -> Result<Value, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    let host = store
        .get(HOST_KEY)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or_else(|| "No connection is configured yet.".to_string())?;
    let encrypted_key = store
        .get(API_KEY_KEY)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or_else(|| "No API key is stored.".to_string())?;
    let api_key = crypto::decrypt(&app, &encrypted_key)?;

    execute_graphql(&host, &api_key, &query, variables).await
}
