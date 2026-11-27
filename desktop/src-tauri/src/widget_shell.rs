use tauri::{App, AppHandle, Emitter, Manager, Url, WebviewWindow};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_opener::OpenerExt;

fn is_focus_link(url: &Url) -> bool {
    url.scheme() == "lockin-focus"
        && url.host_str() == Some("open")
        && matches!(url.path(), "" | "/")
        && url.username().is_empty()
        && url.password().is_none()
        && url.port().is_none()
        && url.query().is_none()
        && url.fragment().is_none()
}

pub fn install(app: &App) {
    let handle = app.handle().clone();
    app.deep_link().on_open_url(move |event| {
        if event.urls().iter().any(is_focus_link) {
            if let Some(window) = handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("lockin-focus-open", ());
            }
        }
    });

    #[cfg(any(windows, target_os = "linux"))]
    if let Err(error) = app.deep_link().register_all() {
        eprintln!("Could not register lockin-focus://: {error}");
    }
}

#[tauri::command]
pub fn opened_from_site(app: AppHandle) -> bool {
    app.deep_link().get_current().ok().flatten()
        .is_some_and(|urls| urls.iter().any(is_focus_link))
}

#[tauri::command]
pub fn return_to_website(app: AppHandle) -> Result<(), String> {
    let configured = option_env!("LOCKIN_FOCUS_RETURN_URL")
        .unwrap_or("http://localhost:3000/dashboard");
    let url = Url::parse(configured).map_err(|error| error.to_string())?;
    let local = matches!(url.host_str(), Some("localhost" | "127.0.0.1"));

    if url.host().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || !(url.scheme() == "https" || (url.scheme() == "http" && local))
    {
        return Err("Use an HTTPS or local HTTP LOCKIN address.".into());
    }

    app.opener().open_url(url.as_str(), None::<&str>)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn sample_widget_pointer(window: WebviewWindow, bounds: [f64; 4]) -> Result<[f64; 2], String> {
    sample_pointer(&window, bounds).map_err(|error| error.to_string())
}

fn sample_pointer(window: &WebviewWindow, bounds: [f64; 4]) -> tauri::Result<[f64; 2]> {
    let point = window.cursor_position()?;
    let origin = window.inner_position()?;
    let scale = window.scale_factor()?;
    let x = (point.x - f64::from(origin.x)) / scale;
    let y = (point.y - f64::from(origin.y)) / scale;

    #[cfg(windows)]
    {
        use super::DRAGGING;
        use std::sync::atomic::{AtomicBool, Ordering};

        static IGNORING: AtomicBool = AtomicBool::new(false);
        let [left, top, right, bottom] = bounds;
        let over_panel = x >= left && x < right && y >= top && y < bottom;
        let ignore = !over_panel && !DRAGGING.load(Ordering::Acquire);
        if ignore != IGNORING.load(Ordering::Relaxed) {
            window.set_ignore_cursor_events(ignore)?;
            IGNORING.store(ignore, Ordering::Relaxed);
        }
    }
    #[cfg(not(windows))]
    let _ = bounds;

    Ok([x, y])
}
