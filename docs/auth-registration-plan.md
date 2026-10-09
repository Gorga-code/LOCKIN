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
