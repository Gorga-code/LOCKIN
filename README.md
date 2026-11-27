# LOCKIN

LOCKIN is a study and focus app. Use the website to set up study sessions, manage tasks, and review your web session history. Use the Windows desktop widget for a small focus companion that stays available while you work in other apps.

## What the desktop widget does

- **Four-edge docking.** Drag the avatar or panel to any side of the screen. Docked panels collapse to a small tab and reopen on hover. A floating panel stays open.
- **Live focus reminders.** Click **Start** to enable local camera detection. The avatar turns red and shows a short warning when a phone is visible, your face is out of view for about five seconds, or both eyes appear closed for about ten seconds.
- **Session recap.** **Stop** releases the camera and shows the latest session duration, total time away, phone alerts, and eye alerts. **×** ends the session if needed, opens the configured LOCKIN website, and closes the widget.
- **Local camera processing.** MediaPipe analyzes frames on the device. The widget stores the latest recap locally and discards the camera frames.

## Requirements

- Windows 10 or 11, Git, and Node.js 24 with npm.
- Rust with the Windows MSVC toolchain, Microsoft C++ Build Tools, and Microsoft Edge WebView2 for the desktop build.
- The team's Supabase configuration for running the signed-in website.

[Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/#windows)

## Run locally on Windows

Run the commands in PowerShell from the repository root. Use a checkout that includes the `desktop/` directory.

### Terminal 1 · Website

```powershell
npm.cmd ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Open `.env.local` and fill in the values from your team's Supabase project using the keys in `.env.example`. Then start Next.js.

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in. If you want camera detection in the website's solo session as well, run `npm.cmd run vision:setup` from the root.

### Terminal 2 · Desktop widget

```powershell
npm.cmd --prefix .\desktop install
npm.cmd --prefix .\desktop start
```

The first launch prepares the camera models and builds the Tauri app. Windows may ask for camera permission when you press **Start**. Launch the desktop app once to register its Windows link. The website header's **Desktop Focus** button can then open the widget.

The desktop widget also runs on its own. The website should be running if you want **×** to return to the local dashboard. If Next.js uses another port, set `LOCKIN_FOCUS_RETURN_URL` before starting or building the desktop app.

```powershell
$env:LOCKIN_FOCUS_RETURN_URL = 'http://localhost:3001/dashboard'
npm.cmd --prefix .\desktop start
```

## Build the desktop executable

```powershell
npm.cmd --prefix .\desktop run build
```

Open `desktop/src-tauri/target/release/lockin-desktop.exe` after the build completes.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/` | Next.js website, including sessions, history, and the Desktop Focus launcher |
| `AI/vision/` | Shared face, eye, and phone detection code |
| `desktop/ui/` | Floating widget and session controls |
| `desktop/src-tauri/` | Rust window, docking, and website launch integration |
| `supabase/` | Database migrations and local database configuration |
