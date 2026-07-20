mod connection;
mod crypto;
mod docker_stats;
mod graphql;
mod notification_stream;

#[cfg(target_os = "macos")]
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(docker_stats::StatsStreamState::default())
        .manage(notification_stream::NotificationStreamState::default())
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                let window = _app.get_webview_window("main").unwrap();
                apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
                    .expect("failed to apply macOS vibrancy");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connection::save_connection,
            connection::get_connection_host,
            connection::clear_connection,
            connection::test_connection,
            graphql::graphql_request,
            docker_stats::start_docker_stats,
            docker_stats::stop_docker_stats,
            notification_stream::start_notification_stream,
            notification_stream::stop_notification_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
