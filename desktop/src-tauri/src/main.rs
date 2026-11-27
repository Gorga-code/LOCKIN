#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod widget_shell;

use tauri::{window::Monitor, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

#[cfg(windows)]
use std::{
    sync::atomic::{AtomicBool, AtomicU8, Ordering},
    thread,
    time::Duration,
};
#[cfg(windows)]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetAsyncKeyState, VK_LBUTTON, VK_RBUTTON};

const EDGE_MARGIN: f64 = 0.0;
#[cfg(windows)]
const SNAP_DISTANCE: f64 = 22.0;
#[cfg(windows)]
const RELEASE_DISTANCE: f64 = 42.0;
#[cfg(windows)]
static DRAGGING: AtomicBool = AtomicBool::new(false);
#[cfg(windows)]
static DOCK_SIDE: AtomicU8 = AtomicU8::new(0);

struct ScreenBounds {
    left: i32,
    right: i32,
    top: i32,
    bottom: i32,
}

impl ScreenBounds {
    fn new(monitor: &Monitor, window_size: PhysicalSize<u32>, window_scale: f64) -> Self {
        let work_area = monitor.work_area();
        let scale = monitor.scale_factor();
        let ratio = scale / window_scale;
        let margin = (EDGE_MARGIN * scale).round() as i32;
        let width = (f64::from(window_size.width) * ratio).round() as i32;
        let height = (f64::from(window_size.height) * ratio).round() as i32;
        let left = work_area.position.x + margin;
        let top = work_area.position.y + margin;
        let right = work_area.position.x + work_area.size.width as i32 - width - margin;
        let bottom = work_area.position.y + work_area.size.height as i32 - height - margin;

        Self {
            left,
            right: right.max(left),
            top,
            bottom: bottom.max(top),
        }
    }
}

#[cfg(windows)]
#[derive(Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
enum DockSide {
    Left = 1,
    Right = 2,
    Top = 3,
    Bottom = 4,
}

#[cfg(windows)]
const DOCK_SIDES: [DockSide; 4] = [
    DockSide::Left,
    DockSide::Right,
    DockSide::Top,
    DockSide::Bottom,
];

#[cfg(windows)]
impl DockSide {
    fn name(self) -> &'static str {
        match self {
            Self::Left => "left",
            Self::Right => "right",
            Self::Top => "top",
            Self::Bottom => "bottom",
        }
    }

    fn distance(self, position: &PhysicalPosition<i32>, bounds: &ScreenBounds) -> u32 {
        match self {
            Self::Left => position.x.abs_diff(bounds.left),
            Self::Right => position.x.abs_diff(bounds.right),
            Self::Top => position.y.abs_diff(bounds.top),
            Self::Bottom => position.y.abs_diff(bounds.bottom),
        }
    }

    fn align(self, position: &mut PhysicalPosition<i32>, bounds: &ScreenBounds) {
        match self {
            Self::Left => position.x = bounds.left,
            Self::Right => position.x = bounds.right,
            Self::Top => position.y = bounds.top,
            Self::Bottom => position.y = bounds.bottom,
        }
    }
}

#[cfg(windows)]
fn nearest_side(
    position: &PhysicalPosition<i32>,
    bounds: &ScreenBounds,
    limit: u32,
) -> Option<DockSide> {
    DOCK_SIDES
        .into_iter()
        .min_by_key(|side| side.distance(position, bounds))
        .filter(|side| side.distance(position, bounds) <= limit)
}

#[cfg(windows)]
fn remembered_dock_side() -> Option<DockSide> {
    let value = DOCK_SIDE.load(Ordering::Acquire);
    DOCK_SIDES.into_iter().find(|side| *side as u8 == value)
}

#[cfg(windows)]
fn remember_dock_side(docked: Option<DockSide>) {
    let value = docked.map_or(0, |side| side as u8);
    DOCK_SIDE.store(value, Ordering::Release);
}

#[tauri::command]
fn dock_status() -> (&'static str, bool) {
    #[cfg(windows)]
    {
        let dragging = DRAGGING.load(Ordering::Acquire);
        let side = remembered_dock_side().map_or("free", DockSide::name);
        (side, dragging)
    }

    #[cfg(not(windows))]
    {
        ("free", false)
    }
}

#[cfg(windows)]
fn snap_position(
    raw: PhysicalPosition<i32>,
    bounds: &ScreenBounds,
    scale: f64,
    docked: &mut Option<DockSide>,
) -> PhysicalPosition<i32> {
    let attach = (SNAP_DISTANCE * scale).round() as u32;
    let release = (RELEASE_DISTANCE * scale).round() as u32;
    let mut position = PhysicalPosition::new(
        raw.x.clamp(bounds.left, bounds.right),
        raw.y.clamp(bounds.top, bounds.bottom),
    );

    // Keep the current edge at corners until the widget is pulled away from it.
    *docked = (*docked)
        .filter(|side| side.distance(&position, bounds) <= release)
        .or_else(|| nearest_side(&position, bounds, attach));

    if let Some(side) = *docked {
        side.align(&mut position, bounds);
    }
    position
}

#[cfg(windows)]
fn button_is_down(button: u16) -> bool {
    // The high bit is set while the physical mouse button is held.
    (unsafe { GetAsyncKeyState(i32::from(button)) }) < 0
}

#[cfg(windows)]
struct EdgeGlide {
    horizontal: bool,
    offset: i32,
    began: std::time::Instant,
}

#[cfg(windows)]
impl EdgeGlide {
    fn new(side: DockSide, from: PhysicalPosition<i32>, to: PhysicalPosition<i32>) -> Self {
        let horizontal = matches!(side, DockSide::Left | DockSide::Right);
        let offset = if horizontal { from.x - to.x } else { from.y - to.y };
        Self { horizontal, offset, began: std::time::Instant::now() }
    }

    fn position_at(&self, mut target: PhysicalPosition<i32>, seconds: f64) -> PhysicalPosition<i32> {
        let remaining = (1.0 - seconds / 0.105).clamp(0.0, 1.0);
        let offset = (f64::from(self.offset) * remaining.powi(3)).round() as i32;
        if self.horizontal {
            target.x += offset;
        } else {
            target.y += offset;
        }
        target
    }
}

#[cfg(windows)]
fn follow_drag(window: &WebviewWindow, button: u16) -> tauri::Result<()> {
    let Some(start_monitor) = window.current_monitor()? else {
        return Ok(());
    };
    let mut last_position = window.outer_position()?;
    let window_size = window.outer_size()?;
    let window_scale = window.scale_factor()?;
    let start_cursor = window.cursor_position()?;
    let offset_x = start_cursor.x - f64::from(last_position.x);
    let offset_y = start_cursor.y - f64::from(last_position.y);

    let mut monitor_origin = *start_monitor.position();
    let start_bounds = ScreenBounds::new(&start_monitor, window_size, window_scale);
    let mut docked = remembered_dock_side()
        .filter(|side| side.distance(&last_position, &start_bounds) <= 1)
        .or_else(|| nearest_side(&last_position, &start_bounds, 1));
    remember_dock_side(docked);

    let mut target = last_position;
    let mut glide = None;
    loop {
        let held = button_is_down(button);
        if held {
            let cursor = window.cursor_position()?;
            if let Some(monitor) = window.monitor_from_point(cursor.x, cursor.y)? {
                let previous = docked;
                let moved_monitor = *monitor.position() != monitor_origin;
                if moved_monitor {
                    monitor_origin = *monitor.position();
                    docked = None;
                    glide = None;
                }

                let scale = monitor.scale_factor();
                let ratio = scale / window_scale;
                let bounds = ScreenBounds::new(&monitor, window_size, window_scale);
                let raw = PhysicalPosition::new(
                    (cursor.x - offset_x * ratio).round() as i32,
                    (cursor.y - offset_y * ratio).round() as i32,
                );
                target = snap_position(raw, &bounds, scale, &mut docked);

                if docked != previous {
                    remember_dock_side(docked);
                    if !moved_monitor {
                        glide = docked.or(previous)
                            .map(|side| EdgeGlide::new(side, last_position, target));
                    }
                }
            }
        }

        // Finish the short glide even if the mouse was released as the magnet grabbed.
        let next = glide.as_ref().map_or(target, |motion| {
            motion.position_at(target, motion.began.elapsed().as_secs_f64())
        });
        if next != last_position {
            window.set_position(next)?;
            last_position = next;
        }
        if next == target {
            glide = None;
        }
        if !held && glide.is_none() {
            break;
        }
        thread::sleep(Duration::from_millis(12));
    }
    Ok(())
}

#[tauri::command]
fn drag_widget(window: WebviewWindow) -> Result<(), String> {
    #[cfg(windows)]
    {
        let button = if button_is_down(VK_LBUTTON) {
            VK_LBUTTON
        } else if button_is_down(VK_RBUTTON) {
            VK_RBUTTON
        } else {
            return Ok(());
        };

        if DRAGGING.swap(true, Ordering::AcqRel) {
            return Ok(());
        }

        thread::spawn(move || {
            let result = follow_drag(&window, button);
            DRAGGING.store(false, Ordering::Release);
            if let Err(error) = result {
                eprintln!("LOCKIN Desktop drag failed: {error}");
            }
        });
        Ok(())
    }

    #[cfg(not(windows))]
    {
        window.start_dragging().map_err(|error| error.to_string())
    }
}

#[tauri::command]
fn close_widget(window: WebviewWindow) -> Result<(), String> {
    window.close().map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app.get_webview_window("main").expect("main window in Tauri config");
            if let Some(monitor) = window.current_monitor()? {
                let bounds = ScreenBounds::new(&monitor, window.outer_size()?, window.scale_factor()?);
                window.set_position(PhysicalPosition::new(bounds.right, bounds.bottom))?;
                #[cfg(windows)]
                remember_dock_side(Some(DockSide::Right));
            }
            window.show()?;
            widget_shell::install(app);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            drag_widget, close_widget, dock_status,
            widget_shell::sample_widget_pointer,
            widget_shell::opened_from_site,
            widget_shell::return_to_website
        ])
        .run(tauri::generate_context!())
        .expect("failed to run LOCKIN Desktop");
}
