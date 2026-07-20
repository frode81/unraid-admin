use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{AeadCore, Aes256Gcm, Nonce};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::fs;
use tauri::{AppHandle, Manager};

const KEY_FILE: &str = "connection.key";

fn key_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(KEY_FILE))
}

#[cfg(unix)]
fn restrict(path: &std::path::Path) {
    use std::os::unix::fs::PermissionsExt;
    if let Ok(metadata) = fs::metadata(path) {
        let mut perms = metadata.permissions();
        perms.set_mode(0o600);
        let _ = fs::set_permissions(path, perms);
    }
}

#[cfg(not(unix))]
fn restrict(_path: &std::path::Path) {}

fn load_or_create_key(app: &AppHandle) -> Result<[u8; 32], String> {
    let path = key_path(app)?;
    if let Ok(bytes) = fs::read(&path) {
        if bytes.len() == 32 {
            let mut key = [0u8; 32];
            key.copy_from_slice(&bytes);
            return Ok(key);
        }
    }
    let key = Aes256Gcm::generate_key(OsRng);
    fs::write(&path, key.as_slice()).map_err(|e| e.to_string())?;
    restrict(&path);
    let mut out = [0u8; 32];
    out.copy_from_slice(key.as_slice());
    Ok(out)
}

/// Encrypts `plaintext` with AES-256-GCM using a locally stored key
/// (`connection.key`, chmod 600, generated on first use). Returns
/// base64(nonce || ciphertext).
pub fn encrypt(app: &AppHandle, plaintext: &str) -> Result<String, String> {
    let key_bytes = load_or_create_key(app)?;
    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| e.to_string())?;

    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(combined))
}

pub fn decrypt(app: &AppHandle, encoded: &str) -> Result<String, String> {
    let key_bytes = load_or_create_key(app)?;
    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;
    let combined = STANDARD.decode(encoded).map_err(|e| e.to_string())?;
    if combined.len() < 12 {
        return Err("Invalid encrypted value".into());
    }
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| e.to_string())?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}
