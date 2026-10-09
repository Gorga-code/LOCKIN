# Session Modes and Room Collaboration Plan

## Status

Planning only. No application code, database schema, or extension code is changed by this document.

## Product direction

After a signed-in user clicks **New session**, LOCKIN will ask which type of session they want:

1. **Solo session** — the user works independently with the full focus toolkit.
2. **Multiplayer session** — the user studies with other LOCKIN users in a room.

The multiplayer experience should support two entry paths:

1. **Create a room** — configure a new room and start the session as its host.
2. **Join a room** — browse available rooms, inspect a preview, and join one.

The room capacity is limited to **five people total**, including the room creator. A room may be used as:

- A 1-on-1 session with one other person.
- A small group-study session with up to five participants.

The first implementation should treat multiplayer as a structured study room, not as a public random-video service. Any camera sharing or peer video behavior must be explicitly designed and approved; raw camera frames must never be uploaded or stored.

## Relationship to Chapter 2

This direction expands the document's Phase 1 solo workflow and prepares the deferred Phase 2 private 1v1 concept:

- Solo focus sessions remain the first-release core.
- Multiplayer rooms are an extension of the session model.
- The existing Chapter 2 limit of five people per room is adopted as the product limit.
- The earlier “private 1v1 rooms” Phase 2 scope becomes a broader private-room model supporting either 2 or up to 5 participants.
- The full focus toolkit remains available in solo mode.
- Multiplayer must not weaken authentication, ownership checks, RLS, privacy, or the rule against sending raw camera video to the server.

## Scope boundaries

### Included in this plan

- A session-mode selection screen.
- Solo session setup and execution.
- Multiplayer create-room flow.
- Multiplayer join-room flow.
- Room list and room preview.
- Room capacity and membership states.
- Room elapsed-time display.
- Leave/end behavior.
- Reuse of timer, camera, event, and extension concepts across modes where appropriate.

### Explicitly excluded from the first implementation

- Random stranger matching.
- Public anonymous rooms.
- Unlimited room sizes.
- Server-side video recording.
- Uploading raw camera frames.
- Sending raw camera video to an AI provider.
- Competitive scoring or ranking.
- Payments or premium room limits.
- Complex moderation tooling.
- Voice chat unless separately approved.

## Proposed user flows

### Entry flow

1. User signs in.
2. User clicks **New session**.
3. The app opens a mode-selection screen:
   - Solo session.
   - Multiplayer session.
4. The selected mode determines the next setup flow.

### Solo session flow

1. User selects **Solo session**.
2. User enters a task goal.
3. User selects a duration.
4. User chooses camera mode:
   - Camera on.
   - Camera off.
5. If camera is on:
   - Request browser permission after an explicit action.
   - Show a local preview.
   - Run local presence/phone detection when available.
   - Show warnings according to grace-period and cooldown rules.
6. User configures the website extension:
   - Select permitted websites.
   - Run a preflight check.
   - Enable blocking during the active session.
7. User starts the session.
8. During the session, the user can:
   - See elapsed time.
   - Pause.
   - Resume.
   - End early.
   - Turn camera monitoring off where allowed.
   - Use an explicit break mode where supported.
   - Deliberately override a website restriction.
9. When the session ends:
   - Stop camera tracks and local detection.
   - Release website restrictions.
   - Persist session metadata and events.
   - Ask whether the task goal was completed.
   - Show a recap.

### Multiplayer create-room flow

1. User selects **Multiplayer session**.
2. User selects **Create a room**.
3. User configures:
   - Room name or title.
   - Maximum participant count from 2 through 5.
   - Task/room goal.
   - Planned duration.
   - Camera preference.
   - Website restriction preference, if the room policy supports it.
4. The app displays a pre-start room lobby.
5. The creator sees:
   - Room name.
   - Current participants.
   - Maximum capacity.
   - Planned duration.
   - Elapsed time after start.
   - Camera/monitoring availability.
6. The creator starts the room session.
7. Other participants can join until the capacity is reached.
8. The room session runs with shared room timing, while each participant's personal events remain attributable to that participant.
9. The creator can end the room session.
10. A participant can leave independently; leaving must not silently delete the room's records.

### Multiplayer join-room flow

1. User selects **Multiplayer session**.
2. User selects **Join a room**.
3. The app displays available rooms that are:
   - Authenticated.
   - Not full.
   - Joinable.
   - Not already ended.
4. User selects a room.
5. The app shows a preview before joining:
   - Room name.
   - Host/participant display names, subject to privacy policy.
   - Current participant count and capacity.
   - Planned duration.
   - Current elapsed time.
   - Room status.
   - Camera/monitoring policy.
6. User confirms **Join**.
7. Joining starts that user's participation in the room session.
8. User can leave at any time.
9. Leaving ends that user's participation, not necessarily the entire room.

## Session and room state model

The implementation should keep room state, session state, and camera state separate.

### Solo session states

```text
setup
→ active
→ paused
→ active
→ completed
```

Alternative ending:

```text
active or paused
→ early_exit
```

### Multiplayer room states

```text
lobby
→ active
→ ended
```

Possible membership states:

```text
invited or discovered
→ joined
→ left
```

### Camera states

```text
off
→ requesting
→ on
→ unavailable
```

Camera failure must never be recorded as user absence. Camera processing remains local and only event metadata may be persisted.

## Room rules

- Maximum room size: 5 participants total.
- Minimum size for a multiplayer room: 2 if the room is intended to be a shared session.
- The creator is counted as one participant.
- A full room cannot accept another join request.
- Ended rooms cannot be joined.
- A room creator can end the room.
- A participant can leave without ending the room for everyone.
- The room's shared timer starts when the creator starts the room, not when each participant opens the preview.
- A joining participant's personal join timestamp must be retained for accurate participation history.
- Room membership and session records must be protected by authenticated ownership and membership checks.
- Users must not be able to submit another user's ID to join, modify, or read records.

## Camera policy for multiplayer

The initial recommendation is:

- Keep camera permission explicit for every participant.
- Keep local camera processing local to each participant's browser.
- Do not upload or relay raw camera frames through the application.
- Show only camera availability and approved metadata to the room.
- Treat camera-off as a valid mode.
- Do not expose a participant's raw camera stream to other room members unless a separate privacy and product decision explicitly approves peer video.

This preserves Chapter 2's privacy-by-design requirement while still allowing a shared timer and shared study room.

## Extension policy

### Solo

The full extension feature set applies:

- Session-specific allowlist.
- Preflight check.
- Top-level navigation blocking.
- Break mode.
- Deliberate override.
- Override event logging.
- Release of restrictions when the session ends.

### Multiplayer

The first version should choose one clear policy before implementation:

1. **Per-participant policy (recommended)** — each participant controls their own allowlist and extension state.
2. **Shared room policy** — the creator defines one allowlist for the room.

The recommended approach is per-participant policy because it avoids allowing one user's client to control another user's browser. If a shared policy is later added, it should be distributed as room configuration, while enforcement remains local to each participant's extension.

## Data model direction

The existing session tables provide a base for solo sessions. Multiplayer will likely require additional entities or fields, subject to schema review before coding:

- `rooms`
  - Owner/creator.
  - Name/title.
  - Capacity.
  - Status.
  - Planned duration.
  - Started and ended timestamps.
- `room_members`
  - Room ID.
  - Authenticated user ID.
  - Role: creator or participant.
  - Joined and left timestamps.
  - Membership status.
- `sessions`
  - Either a solo session or a participant's session within a room.
  - Goal, planned time, elapsed time, status, camera mode.
- `session_events`
  - Per-user metadata events such as camera unavailable, face absence, phone detection, or extension override.
- `session_allowlist`
  - Preferably per participant unless a shared policy is explicitly selected.

All user-owned and room-owned records require RLS. Room visibility should expose only the minimum metadata needed for a preview. Raw camera data is not a database field.

## Product and UI screens

### Screen 1: Mode selection

- “Solo session”
- “Multiplayer session”
- Short explanations of the difference.
- Camera/privacy note.

### Screen 2: Solo setup

- Task goal.
- Duration.
- Camera on/off.
- Local preview when enabled.
- Website allowlist entry point.
- Extension preflight status.
- Start session action.

### Screen 3: Multiplayer choice

- “Create a room”
- “Join a room”
- Back to mode selection.

### Screen 4: Create-room setup

- Room name.
- Participant limit: 2–5.
- Goal.
- Duration.
- Camera preference.
- Extension preference.
- Create room action.

### Screen 5: Room lobby/preview

- Room identity.
- Participant list.
- Capacity.
- Planned duration.
- Current elapsed time.
- Room status.
- Join, start, leave, or end actions based on role.

### Screen 6: Active multiplayer room

- Shared elapsed timer.
- Participant presence/membership status.
- The current user's local camera controls.
- The current user's local detection status.
- Leave room action.
- Host-only end-room action.

### Screen 7: Recap

- Shared room metadata.
- The current user's participation duration.
- The current user's events and overrides.
- Goal completion response.
- Supportive summary.
- No claim that elapsed time proves focus or productivity.

## Existing implementation checklist

The following checklist tracks the previously planned work and how this new direction affects it.

### Authentication and access

- [x] Sign Up and Sign In exist.
- [x] Protected routes exist for `/session`.
- [x] Unauthenticated users are redirected away from protected session pages.
- [x] Registration-first sign-in behavior is implemented.
- [ ] Verify multiplayer room access with authenticated users only.
- [ ] Add membership/room authorization checks.

### Session foundation

- [x] Dashboard has a **New session** entry point.
- [x] `/session/new` page exists as an initial camera setup prototype.
- [x] Local camera permission request exists.
- [x] Camera tracks are stopped on manual disable and page cleanup.
- [ ] Add mode selection: solo vs multiplayer.
- [ ] Add solo task-goal input.
- [ ] Add solo duration selection.
- [ ] Add solo start-session action.
- [ ] Add timer state machine.
- [ ] Add pause/resume controls.
- [ ] Add end/early-exit controls.
- [ ] Persist solo session metadata.
- [ ] Persist session transitions and timestamps.

### Solo camera and detection

- [x] Camera on/off control exists in the prototype.
- [x] Camera permission denial/unavailable states exist.
- [ ] Integrate local MediaPipe face detection.
- [ ] Integrate local visible-phone detection.
- [ ] Add configurable grace period.
- [ ] Add warning cooldown.
- [ ] Record metadata events only.
- [ ] Mark camera failure as unavailable rather than absence.
- [ ] Provide a camera-off session mode.
- [ ] Benchmark false alerts, missed events, and device load.

### Extension and distraction controls

- [ ] Create/restore the Manifest V3 extension package.
- [ ] Add website allowlist UI.
- [ ] Add extension preflight check.
- [ ] Block non-allowed top-level navigation during active solo sessions.
- [ ] Add break mode.
- [ ] Add deliberate override flow.
- [ ] Record override metadata.
- [ ] Release restrictions when a session ends.
- [ ] Decide and implement multiplayer per-participant extension policy.

### Multiplayer rooms

- [ ] Add solo/multiplayer selection screen.
- [ ] Add create-room flow.
- [x] Add create-room form for room name, capacity, goal, and duration.
- [x] Add a dedicated room-lobby route after room creation.
- [ ] Add room capacity selection from 2 through 5.
- [ ] Enforce a maximum of five members server-side.
- [ ] Add room lobby.
- [ ] Add available-room list.
- [ ] Add room preview before joining.
- [ ] Show participant count and capacity.
- [ ] Show participant display names according to privacy rules.
- [ ] Show planned duration and elapsed room time.
- [ ] Add join-room action.
- [ ] Add leave-room action.
- [ ] Add host end-room action.
- [ ] Track per-user join and leave timestamps.
- [ ] Handle full, ended, and unavailable rooms.
- [ ] Add realtime synchronization only after the data and authorization model is settled.

### History and AI Coach

- [ ] Add solo session history.
- [ ] Add multiplayer participation history.
- [ ] Add session detail view.
- [ ] Add confirmed deletion of personal history.
- [ ] Add goal-completion check-in.
- [ ] Generate structured post-session summaries.
- [ ] Add asynchronous AI reflection.
- [ ] Add supportive suggestions.
- [ ] Add feedback controls.
- [ ] Keep raw video out of all AI requests.
- [ ] Keep room participant data out of AI requests unless explicitly required and consented.

## Chapter 2 requirement coverage

This new plan covers or advances the following Chapter 2 items:

- [x] US01 direction: task and duration remain part of both solo and room setup.
- [x] US02 direction: pause, resume, stop, early exit, and room leave are explicitly modeled.
- [x] US03 direction: website allowlist and extension controls remain in scope for solo sessions.
- [x] US04 direction: camera-based presence reminders remain local and optional.
- [x] US05 direction: visible-phone reminders remain local and metadata-only.
- [x] US06 direction: camera consent, camera-off mode, and cleanup are explicit.
- [x] US07 direction: recap must distinguish shared room metadata from each user's own events.
- [x] US08 direction: history and deletion remain authenticated and user-scoped.
- [x] Phase 2 direction: private 1v1 is represented as a room with capacity 2.
- [x] New product direction: group study is represented as a room with capacity up to 5.
- [ ] Full solo workflow implemented.
- [ ] Full extension workflow implemented.
- [ ] Full local detection workflow implemented.
- [ ] Full history and AI reflection workflow implemented.
- [ ] Multiplayer authorization and realtime synchronization implemented.
- [ ] Multiplayer browser and cross-user integration tests implemented.

## Recommended implementation phases

### Phase 0 — UI and navigation skeleton

- [x] Replace the camera-only entry page with solo/multiplayer mode selection.
- [x] Add clickable solo setup placeholder.
- [x] Add solo setup layout for title, goal, duration, camera toggle, and website restrictions.
- [ ] Add a user-entered session title and long-form task notes to the solo setup.
- [x] Add visual website-add controls without activating restriction enforcement.
- [x] Add solo active-session preview with camera controls and a timer that starts from the preview.
- [x] Add clickable multiplayer choice placeholder.
- [x] Add clickable create-room placeholder.
- [x] Add clickable join-room and room-preview placeholder.
- [x] Add clickable active-session placeholder.
- [x] Keep camera, timer, database, extension, and realtime behavior inactive.

### Phase A — Finish the solo workflow first

1. Replace the prototype session setup with mode selection plus solo setup.
2. Implement task, duration, camera mode, timer, pause/resume, and end.
3. Persist sessions and events with authenticated Route Handlers and RLS.
4. Add local detection and camera state reporting.
5. Integrate the extension allowlist and preflight flow.
6. Build history and recap.

### Phase B — Add multiplayer data and authorization

1. Finalize room and membership schema.
2. Add RLS policies and server-side capacity enforcement.
3. Add create-room setup.
4. Add room lobby and available-room list.
5. Add preview and join flow.
6. Add leave/end lifecycle.

### Phase C — Synchronize the active room

1. Add shared room timer synchronization.
2. Track individual join/leave timestamps.
3. Display participant membership state.
4. Apply per-participant camera and extension policies.
5. Add reconnect and stale-membership handling.

### Phase D — Validate the complete product

1. Run solo workflow tests.
2. Run negative RLS/cross-user tests.
3. Run room-capacity and concurrent-join tests.
4. Run leave/end/reconnect tests.
5. Run camera privacy and cleanup tests.
6. Run extension blocking and release tests.
7. Run browser E2E flows.

## Decisions that should remain explicit before implementation

The following choices affect database design or user experience and should be confirmed before the relevant phase:

1. Should multiplayer rooms be invite-only, discoverable to authenticated users, or both?
2. Should display names be profile data, room-member data, or temporary per-room labels?
3. Should a room's task and duration be shared by everyone, or can each participant have a personal goal and duration?
4. Should a multiplayer room begin when the host starts it, or when the first two participants are present?
5. Should a host be allowed to change capacity or duration after creating the room?
6. Should a participant's camera preview be visible only to themselves, or should approved peer video be introduced later?
7. Should extension rules be per participant (recommended) or shared by the room?
8. Should a room remain joinable after the host leaves, or should the room end automatically?
9. Should participants see exact display names and presence states, or privacy-preserving aliases?
10. Should multiplayer session recaps be visible only to each participant, or should the room have a shared summary?

## Assessment

This product direction is coherent and can be implemented without abandoning the Chapter 2 goals. The main architectural rule is to build the solo session state machine and authorization boundaries first, then reuse them for rooms. Multiplayer should add room coordination and membership; it should not duplicate or bypass the existing session, camera, extension, privacy, or RLS rules.

The recommended order is therefore:

```text
authentication
→ solo setup
→ solo active session
→ local detection and extension
→ history and recap
→ room schema and RLS
→ room create/join/preview
→ synchronized multiplayer session
```
