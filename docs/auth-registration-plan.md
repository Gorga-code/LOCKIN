# Authentication Registration-First Plan

## Status

Draft plan only. No application code is changed by this document.

## Goal

Change the account flow so that:

1. Keep the existing **Sign up** wording, route, and internal naming.
2. A user must complete Sign up before signing in.
3. Sign up never leaves the user logged in automatically.
4. After Sign up, the user is returned to the sign-in page and must explicitly sign in.
5. An email/password sign-in attempt for an account that does not exist is rejected and remains on the sign-in page.

## Current behavior found

- `src/app/signup/page.tsx` calls `supabase.auth.signUp`.
- When Supabase returns `data.session`, the registration page currently redirects directly to `/dashboard`.
- `src/app/login/page.tsx` calls `supabase.auth.signInWithPassword`; it does not create accounts during sign-in.
- `src/lib/supabase/proxy.ts` redirects an already authenticated user away from both `/login` and `/signup`.
- Authentication labels and messages are catalog-backed in both `messages/en.json` and `messages/id.json`.
- Local Supabase email confirmations are currently disabled in `supabase/config.toml`. Therefore, a successful registration can return a session immediately even though the product should still require a separate sign-in action.
- Google OAuth is conditionally shown when `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`. OAuth providers can create/authenticate users through the provider flow, so this needs to be aligned with the registration-first rule before implementation.

## Proposed implementation

### 1. Preserve existing authentication naming and copy

Keep the existing auth translation keys, labels, route, and component naming in:

- `messages/en.json`
- `messages/id.json`

The following will remain unchanged:

- The `Sign up` / `Daftar` user-facing wording.
- The existing `/signup` route.
- Existing identifiers such as `SignUpPage`, `handleSignUp`, `signUpButton`, and `signUpTitle`.
- The `Sign in` / `Masuk` wording.

Only the following catalog additions or adjustments are planned:

- Add a dedicated success message explaining that Sign up succeeded and the user must now sign in.
- Add a dedicated message for an unregistered or invalid email/password sign-in attempt. This should not reveal whether a particular email exists; it should use a generic authentication failure message.
- Add any needed Google-related copy if the provider remains enabled.

The exact Indonesian wording will be reviewed for naturalness before implementation.

### 2. Change the registration completion flow

Update `src/app/signup/page.tsx` so that:

1. It validates the password and Supabase configuration as it does now.
2. It calls `supabase.auth.signUp`.
3. If registration fails, it stays on the registration page and shows the existing error surface.
4. If registration succeeds and Supabase returns a session, it explicitly signs out that newly created session before navigating away.
5. It redirects to `/login` with a short-lived success indicator, for example a query parameter such as `registered=1`.
6. It never redirects directly to `/dashboard`.
7. If email confirmation is enabled later and Supabase returns no session, it still returns the user to sign-in with an appropriate message explaining the next step.

The explicit sign-out is important because local Supabase currently allows registration without email confirmation and may return an active session immediately. Merely redirecting to `/login` would otherwise cause the middleware to redirect the user back to `/dashboard`.

No component, handler, translation key, route, or other application identifier will be renamed from `SignUp`/`signUp` to `Register`/`register` as part of this change. The only `signUp` call is the official Supabase Auth SDK method and must remain unchanged.

### 3. Show the registration result on the sign-in page

Update `src/app/login/page.tsx` so that:

- It reads the registration result query parameter.
- It displays a success/info message such as “Sign up successful. Please sign in.”
- It removes or replaces the query parameter after navigation where appropriate, so refreshing the page does not repeatedly show the same one-time message.
- It preserves the existing `next` destination when the user was originally sent to sign-in from a protected page.
- It continues to show an error and remains on `/login` when `signInWithPassword` fails.

No sign-in code will call `signUp`, and no registration code will call `signInWithPassword`.

### 4. Preserve unregistered-account rejection

The email/password sign-in path will continue to rely on Supabase Auth for credential verification:

- Existing accounts with the correct password can sign in.
- An unregistered email, or an incorrect password, remains on the sign-in page.
- The UI will use a generic message such as “Incorrect email or password” rather than exposing whether an email is registered.
- No client-submitted user ID will be introduced; the authenticated Supabase session remains the source of identity.

This is the correct and secure behavior for the requirement that an unregistered account cannot log in.

### 5. Decide and enforce the Google OAuth policy

The current app can show a Google sign-in button. The product requirement says users should register first and only sign in afterward, but Google OAuth can combine account creation and authentication in one provider flow.

Recommended initial policy:

- Keep `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false` for the local release until an explicit Google registration/sign-in design is approved.
- Do not change Google OAuth behavior silently as part of the email/password change.
- If Google is required later, implement a separate documented policy for whether Google registration is allowed and how a first-time Google user is distinguished from a returning user.

This avoids a loophole where the password flow is registration-first but Google can create and log in a new account immediately.

### 6. Verify middleware interaction

After the registration flow signs out before redirecting:

- `/login` remains accessible after registration.
- The middleware does not send the user to `/dashboard` because no authenticated session remains.
- A successful explicit sign-in still redirects to the requested `next` path or `/dashboard`.
- Protected routes remain protected for unauthenticated users.

The middleware should only be changed if tests show that the current redirect behavior conflicts with the new flow. The preferred implementation is to preserve the existing protection rules and fix the session lifecycle at registration.

## Validation plan

After implementation, test the following cases locally with the Supabase stack:

### Registration

- Sign up with a new valid email/password.
- Confirm the user is returned to `/login`, not `/dashboard`.
- Confirm the user is not authenticated immediately after Sign up.
- Confirm the sign-in page displays the Sign up-success message.

### Sign-in

- Sign in with the newly registered credentials.
- Confirm the user reaches `/dashboard`.
- Visit `/login` while signed in and confirm existing middleware behavior remains intentional.
- Try an unregistered email.
- Try a registered email with the wrong password.
- Confirm both failures remain on `/login` and use a generic error.

### Navigation and localization

- Verify the existing Sign up labels and new status messages in English.
- Verify the existing Daftar labels and new status messages in Indonesian.
- Verify the “No account yet?” action points to registration.
- Verify the “Already have an account?” action points to sign-in.

### Regression checks

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run the relevant unit/auth tests if present.
- Run the browser flow tests if the project has authentication E2E coverage.

## Expected files to change during implementation

- `src/app/signup/page.tsx`
- `src/app/login/page.tsx`
- `messages/en.json`
- `messages/id.json`

Potentially, only if required by the chosen Google policy or failing validation:

- `src/lib/supabase/proxy.ts`
- `supabase/config.toml`
- Authentication tests or E2E test files

No database schema change is expected for this feature.

## Naming decision

The project will intentionally continue using the existing `SignUp`/`signUp` naming for this feature. This includes `SignUpPage`, `handleSignUp`, the `/signup` route, and the translation keys. The behavior is changing, but the vocabulary and identifiers are not. This avoids an unrelated rename and keeps the change focused on authentication behavior.

## Assessment

This approach is technically sound and matches the requested behavior:

- It uses the existing Supabase Auth flow instead of duplicating account state in the application database.
- It explicitly clears the session returned by local Supabase registration.
- It preserves secure generic login errors.
- It keeps identity derived from the authenticated Supabase session.
- It avoids weakening protected-route middleware.
- It handles both English and Indonesian copy through the existing i18n system.
- It does not require a database migration.

---

# Camera Session Page Plan

## Status

Planning only. No camera/session application code has been changed by this section.

## Goal

After a user has successfully signed in, the existing **Start a new session** action should open `/session/new` instead of a 404 page. The first version of this page will provide an Omegle-style camera preview experience, but without peer matching or sending video to another person:

- Ask the browser for camera permission.
- Show the local camera preview after permission is granted.
- Show a sidebar with session options for region and display name.
- Keep raw camera frames local to the browser.
- Stop all camera tracks when the user leaves the page or the session is cancelled.

The page remains protected by the existing `/session` middleware rule, so an unauthenticated visitor should be redirected to sign in.

## Current behavior found

- The dashboard links to `/session/new`.
- The navbar also links to `/session/new`.
- `/session` is already included in `PROTECTED_PREFIXES`.
- No `src/app/session/new/page.tsx` currently exists, so `/session/new` returns 404.
- The database schema already has session-related tables and a `camera_mode` field, but the current request is specifically for the camera setup UI and preview.
- The repository guardrails require all MediaPipe/vision processing to remain local and prohibit uploading or storing raw video/frames.

## Proposed implementation

### 1. Create the protected session setup page

Add `src/app/session/new/page.tsx` as a client component because camera permissions and `navigator.mediaDevices.getUserMedia` are browser-only APIs.

The page layout will contain:

- A main camera panel with a `<video>` element.
- A clear empty state before permission is requested.
- A loading state while the browser permission request is pending.
- A permission-denied/unavailable state with instructions to enable the camera in Chrome site settings.
- A sidebar for session options.

The initial page will not implement peer-to-peer video, public rooms, or remote users. “Omegle-style” refers to the visual camera-preview interaction only for this milestone.

### 2. Implement camera permission and local preview

Use `navigator.mediaDevices.getUserMedia({ video: true, audio: false })` only after the user presses an explicit **Turn on camera** action.

The implementation will:

1. Check that `navigator.mediaDevices.getUserMedia` exists.
2. Request video only; microphone access will not be requested.
3. Store the returned `MediaStream` in a ref.
4. Attach the stream to the video element.
5. Render the preview muted, inline, and without uploading the stream.
6. Stop every track on unmount and when the user disables the camera.
7. Convert browser failures into user-facing states without exposing raw browser errors unnecessarily.

No `MediaRecorder`, upload endpoint, storage bucket, WebRTC peer connection, or raw frame persistence will be added for this milestone.

### 3. Add sidebar options

The sidebar will include:

- **Region**: a select/input with a small, explicit initial option set. The first version should keep the value in component state unless product requirements define a persisted profile field.
- **Display name**: a text input held in component state. It should be trimmed and length-limited before it can be used by a later session-start action.

For this first camera page, these options are setup UI only. They will not be sent to Supabase or exposed to other users until a session-start/data model requirement is defined.

Recommended initial defaults:

- Region: a neutral “Select region” value rather than silently guessing the user’s location.
- Display name: empty, with a clear optional/required label decided in the UI copy.

### 4. Add localized copy

Add camera/session translations to:

- `messages/en.json`
- `messages/id.json`

The copy will cover:

- Camera setup title and description.
- Turn on camera.
- Camera enabled/disabled states.
- Permission request in progress.
- Permission denied.
- Camera unavailable or unsupported browser.
- Region label.
- Display name label.
- Back/cancel navigation.

Existing terminology and privacy wording will be preserved. UI copy will describe this as a local camera preview, not as verified focus/productivity time.

### 5. Handle navigation and cleanup

The page will provide a safe way to leave setup, such as a back/cancel link to `/dashboard`. Camera cleanup must run when:

- The user navigates away.
- The component unmounts.
- The camera is manually turned off.
- A permission request fails after a stream was partially created.

The implementation must avoid retaining a `MediaStream` in global state or local storage.

### 6. Keep authentication and data boundaries intact

- The existing protected route behavior will be reused; no client-submitted user ID will be trusted.
- No server route is needed for camera permission or preview.
- No database migration is expected for the first UI-only camera milestone.
- If a later task starts and persists a session, it must derive the user from the authenticated Supabase session and enforce existing RLS policies.

## Recommended implementation order

1. Add the `/session/new` page shell and protected-route behavior.
2. Add localized labels and states.
3. Add the explicit camera permission flow and local preview.
4. Add cleanup and error handling.
5. Add the region and display-name sidebar state.
6. Validate camera-off, permission-denied, and successful-preview paths.

This is one cohesive feature, but these steps provide internal checkpoints so a camera resource leak or permission regression is caught before moving on.

## Validation plan

### Static checks

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.

### Browser checks

- Sign in and open `/session/new` from the dashboard.
- Confirm an unauthenticated request to `/session/new` redirects to `/login`.
- Confirm the page initially does not request the camera before the user clicks **Turn on camera**.
- Allow camera access and confirm the local preview appears.
- Confirm no microphone permission is requested.
- Deny camera access and confirm a useful recovery message appears.
- Turn the camera off and confirm the preview stops.
- Navigate away and confirm camera tracks are stopped.
- Enter region and display name values and confirm the UI retains them during the page session.
- Verify both English and Indonesian copy.

### Privacy checks

- Confirm no raw image/video request is sent to the application or Supabase.
- Confirm no raw frame or stream is placed in local storage, cookies, database payloads, or logs.
- Confirm the browser permission is requested only from the explicit user action.

## Expected files to change during implementation

- `src/app/session/new/page.tsx`
- `messages/en.json`
- `messages/id.json`

Potentially, only if validation identifies a routing or test gap:

- `src/lib/supabase/proxy.ts`
- Camera/session component test files
- Browser E2E test files

No database migration is expected for this first camera-preview implementation.

## Assessment

This approach is reasonable for the requested next feature because it delivers the visible camera experience without prematurely introducing peer video, raw media storage, or a session persistence contract. It also respects the repository’s privacy guardrail: camera data remains local, and only permission state/UI state is handled by the page.
