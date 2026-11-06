# Solo session: eyelid and camera-presence monitoring

This version uses MediaPipe Face Landmarker, replacing the earlier BlazeFace-only
worker. It estimates face presence and whether both eyes appear closed. It does
not confirm sleep, attention, identity, or phone use. The Python prototype is not
part of this browser feature.

## Run on Windows

From the project folder with Node.js 24:

```powershell
npm ci
npm run vision:setup
npm run dev
```

Open http://localhost:3000/session/solo, turn on the camera, and allow access.
For database-free preview, leave NEXT_PUBLIC_SUPABASE_URL and
NEXT_PUBLIC_SUPABASE_ANON_KEY empty in .env.local, then restart the server.

## What you see

- A face outline and a face-presence status.
- Eyes appear open/closed/not assessable, and a current closure timer.
- A visual reminder after both eyes appear closed continuously for 10 seconds.
- A current timer for how long no face has been detected, with a separate session total.
- The existing absence reminder after five seconds without a face.
- A local end-of-session summary of observed away time and eye-closure reminder count.

Reopening either eye clears the continuous closure timer. Short blinks do not reach
10 seconds. One long closure produces one counted reminder; after reopening,
another sustained closure can produce another. A missing face or missing eye scores
resets the eye timer instead of being interpreted as closed eyes.

The current absence timer resets when a face returns. The session total remains.
Counts are sampled estimates: absence starts at the first absent sample and ends at
the returning sample. The interval is excluded if more than two seconds separate
consecutive samples. Counts pause while the session is paused, the camera is off,
the tab is hidden, the model is unavailable, or video is stalled. On resuming,
continuous timers restart while session totals are retained. Closing/reloading the
page starts a new session and clears these in-memory counters.

The session timer continues during reminders. Only the user's Pause button pauses
it. Camera metrics are local to this session; this change does not save them to
Supabase. Existing authenticated session/task saving is retained. With no database,
Stop shows a local unsaved summary.

## Where to change the settings

`src/lib/vision/tracking.ts` contains:

```typescript
export const EYES_CLOSED_MS = 10_000;
export const EYE_CLOSED_THRESHOLD = 0.6;
export const EYE_REOPEN_THRESHOLD = 0.4;
export const MAX_SAMPLE_GAP_MS = 2000;
```

The two blink blendshape scores (eyeBlinkLeft and eyeBlinkRight) must both be at
least 0.6 to start a closure. Once closed, both must stay at least 0.4; falling below
that on either eye resets it. This hysteresis tolerates small coefficient changes.
The coefficients are expression strengths, not probabilities that a person is asleep.
Lighting, glasses, angle, distance, and individual differences can require threshold
tuning. Try the default first: open eyes should show open, closing both eyes should
show closed. Lowering the closed threshold increases sensitivity and false reminders.

## Local model and runtime

The exact runtime is @mediapipe/tasks-vision 0.10.32. Setup copies matching JS/WASM
files from node_modules to public/mediapipe and downloads the version-1 float16
Face Landmarker model (about 3.8 MB) to public/models/face_landmarker.task. Its SHA-256:
`64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
Setup is repeatable and checks the model hash before installation. Generated model
and runtime files are ignored by Git, so run setup before deployment/build too.

Inference runs in a classic Web Worker on the CPU, with one frame in flight, at up
to four samples a second and a maximum frame width of 640 pixels. Face Landmarker
is configured for one face. Video/frames are never uploaded or recorded. Frames and
landmarks stay in the worker and are discarded; only normalized face boxes and two
eyelid coefficients are sent to the page. Model/runtime requests use the app's own
origin after the one-time setup. No API key, Python, Docker, or database is required.

## Try it and validate

1. With your face visible and eyes open, check that eyes show open.
2. Close both eyes for less than a second and reopen: no reminder.
3. Close both eyes for 10 seconds: a visual reminder appears and count increments once.
4. Open your eyes: timer resets, count remains.
5. Move completely out of view: current away time and session total increase.
6. Return: current away time resets; total stays.
7. Pause/resume, turn the camera off/on, and hide/return to the tab: totals stay,
   continuous timers reset, and unmonitored time is not added.
8. Press Stop: local summary shows the counters and the camera is released.

```powershell
npm run typecheck
npm run lint
npm run test:vision
```

Unit tests exercise threshold timing, blink resets, both-eye gating, hysteresis,
invalid/missing signals, returning faces, totals, and monitoring gaps. Browser tests
run the real model on a portrait and blank frame; controlled eye coefficients test
the 10-second UI behavior. Actual closed-eye performance on your Windows webcam
must be checked locally. This is a study-session reminder, not a sleep measurement.

## Troubleshooting

Use Chrome or Edge with localhost/HTTPS. Allow camera access in browser site settings.
If the detector fails to load, run npm run vision:setup again, restart, and retry.
The new .task model is necessary; an earlier BlazeFace .tflite file alone is not enough.
If open eyes repeatedly show closed, use better lighting and a frontal view first,
then tune EYE_CLOSED_THRESHOLD. If no face is visible, an eye status of not assessable
is expected. Camera tracks and workers are released on stop/navigation; hidden tabs
terminate the worker, then create a new one on returning.

References:

- https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
- https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
- https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

The MediaPipe runtime is Apache-2.0. Preserve upstream notices when redistributing
model/runtime files.
