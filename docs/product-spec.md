Cover 

#### Group: 12 

#### Name/NPM: 

1. Fahmi Milan Amyar - 2406360060 

2. Gorga Simatupang - 2406487020 

3. Otniel Kristian Sianturi - 2406401571 

Chapter 1 

|**1.Introduction**|**1**|
|---|---|
|**2. Background and Environmental Setting**|**2**|
|2.1. Digital Participation and Distraction|2|
|2.2. Root-Cause Analysis|2|
|2.3. Why the proposed features fit the problem|2|
|**3. Project Definition**|**2**|
|3.1. Project statement and objectives|2|
|3.3. System components and requirements|3|
|3.4. Completion criteria|4|
|3.5. Frontend and backend technology stack|4|
|**4. User Stories and Acceptance Criteria**|**5**|
|4.1. General customer user stories|5|
|4.2. Detailed user stories and acceptance criteria|5|
|**5. Target Users and Market Sizing**|**7**|
|5.1. Source baseline and assumptions|7|
|5.2. Total addressable and serviceable available markets|8|
|5.3. Serviceable obtainable market over twelve months|8|
|5.4. Conclusion|9|
|Sensitivity and validation|10|
|**6. Competitor Analysis**|**10**|
|6.1. Comparison with the proposed first release|11|
|**7. Risk Analysis**|**11**|
|7.1. Likelihood and consequence scales|11|
|7.2. Scoring and escalation|12|
|7.3. Initial risk register|13|



# **1. Introduction** 

This project proposes a Focus and Accountability application that helps Indonesian young adults turn study intentions into structured work sessions. The first release will combine a task goal and timer, camera-based presence and visible-phone detection, a Chrome website allowlist, and session history. Its purpose is to help users reduce avoidable interruptions and reflect on their work habits while retaining control over their sessions and personal data. 

The initial users will be adult Gen Z university students who regularly study on laptops or desktop computers. Recruitment will begin through student communities in Greater Jakarta, including Jakarta and Depok, with nationwide availability as the longer-term direction. Young professionals are a possible expansion segment. This launch choice reflects a practical recruitment strategy; it does not assume that Jakarta residents experience more distraction than other Indonesians. 

# **2. Background and Environmental Setting** 

## **2.1. Digital Participation and Distraction** 

There is also Indonesia-specific evidence of digital distraction in education. In PISA 2022, 25% of Indonesian students reported being distracted by their own digital-device use in most or all mathematics lessons, while 27% reported distraction from other students using devices. The survey concerns 15-year-olds in school; these percentages must not be presented as the prevalence of distraction among university students, workers, or all Gen Z Indonesians [2]. 

Together, these findings justify investigating support for self-directed digital work. They do not establish that webcam monitoring is the solution users prefer. The project therefore treats demand for the proposed combination of features as a hypothesis to validate through interviews and prototype testing. 

## **2.2. Root-Cause Analysis** 

## **2.3. Why the proposed features fit the problem** 

These starting points are assumptions towards the features we want to create to solve the 

problem, as it will be further supported with relevant data. 

|**Potential difficulty**|**Product response**|**Intended benefit**|
|---|---|---|
|An unclear starting point|A specific task goal and|Make<br>the<br>commitment|
||chosen duration|concrete.|



|Unplanned<br>browser|A session-specific website|Add friction before visiting|
|---|---|---|
|navigation|allowlist|unrelated sites.|
|Leaving the desk or visible|Presence and visible-phone|Help users notice possible|
|phone use|reminders|interruptions.|
|Little<br>reflection<br>after|Session history and a goal|Support<br>review<br>and|
|studying|check-in|adjustment over time.|



# **3. Project Definition** 

## **3.1. Project statement and objectives** 

The project will develop a web application and companion Chrome extension that allow users to define a task, protect a timed work session, receive optional camera-based reminders, and review their session history. Accountability will come from a recorded commitment and an end-of-session reflection. The core engineering objective is a reliable, usable session workflow; improvement in concentration or task completion is an outcome to evaluate, not an assumed result. 

## **3.2. Primary scope and later development** 

|**Release**|**Included functionality**|
|---|---|
|Phase 1 - Solo|Create a task goal; select a duration; start, pause, resume, and end a|
|sessions|session; record completion or early exit.|
|Phase<br>1<br>-|Detects face presence and sustained visible-phone events after camera|
|Detection|consent. Use configurable grace periods and warning cooldowns. Offer<br>camera-off sessions with monitoring clearly marked unavailable.|
|Phase 1 - Chrome<br>extension|Choose permitted websites; block non-allowed top-level web<br>navigation during an active session; provide a preflight check, break<br>mode, and deliberate override with a recorded event.|
|Phase 1 - History|Display planned and elapsed time, pauses, detected events, rule<br>overrides, and the user’s own goal-completion response. Allow|



|||deletion of personal history.|
|---|---|---|
|Phase<br>2|-|Private 1v1 rooms, shared session rules, basic scoring, and match|
|Competition||summaries. These are outside the first-release acceptance criteria.|



## **3.3. System components and requirements** 

The proposed architecture consists of a browser interface, a Chrome extension, local computer-vision processing, an authenticated backend, and a database for session records. Users need a compatible laptop or desktop, supported Chrome version, and an internet connection. Camera-assisted mode additionally requires a functioning webcam and suitable lighting. No dedicated sensor hardware is proposed. 

Camera processing should occur locally where feasible. The backend should receive session metadata and event timestamps rather than video. Technical trials must establish supported hardware, processing load, detection performance, and behaviour when the app is in the background. Exact performance claims and minimum device specifications will be set after benchmarking. 

## **3.4. Completion criteria** 

Phase 1 is complete when the solo workflow, browser rules, detection-state reporting, session persistence, and history controls pass acceptance testing. Detector quality must be reported using labelled trials, including false-alert rates and missed events. Session duration and face presence must never be labelled as verified productive time. 

## **3.5. Frontend and backend technology stack** 

Use Next.js, React, and TypeScript for the web app; Supabase for authentication and PostgreSQL persistence; and a separate Manifest V3 package for the extension [5–10]. 

|**Layer**|**Technology**|**Project responsib**|**ility**|||
|---|---|---|---|---|---|
|Frontend|Next.js<br>App<br>Router,<br>React, TypeScript|Build the dashboa<br>settings,<br>and|rd, session<br>history.|setup,<br>Use|timer,<br>client|
|||components<br>for|<br>camera|access|<br>and|
|||interactive session|state|||



|Styling|Tailwind CSS|Provide consistent responsive layouts,<br>form<br>states,<br>and<br>accessible<br>visual<br>feedback. This is a proposed team choice.|
|---|---|---|
|Application API|Next.js Route Handlers|Validate authenticated requests, enforce<br>ownership and session transitions, and<br>assemble<br>summaries.<br>Do<br>not<br>trust<br>client-submitted user IDs|
|Backend services|Supabase<br>Auth<br>and<br>PostgreSQL|Manage accounts and persist sessions,<br>allowlists, events, and summaries. Apply<br>Row Level Security to every user-owned<br>table|
|Browser controls|Chrome<br>Manifest<br>V3<br>with TypeScript|Apply<br>declarativeNetRequest<br>rules;<br>observe relevant tab events; coordinate<br>session status with the approved app<br>origin|
|Local detection|MediaPipe Tasks Vision|Use Face Detector for presence and Object<br>Detector with a compatible model whose<br>labels include a phone class. Verify model<br>labels, licence, and device performance<br>before selection|
|Development and<br>QA|Git,<br>npm,<br>Vitest,<br>Playwright|Track changes, lock dependencies, test<br>session logic and authorization, and check<br>browser workflows. These are proposed<br>tools, not implemented capabilities.|



# **4. User Stories and Acceptance Criteria** 

## **4.1. General customer user stories** 

General User Stories - To depict what our potential customers might use these for applications for: 

|G01|Completing an assignment. As a university student with a report due, I want<br>to work through a defined writing goal while keeping research sites<br>accessible and reducing unrelated browsing, so that I can make progress<br>before the deadline. This need is supported by US01–US05 and US07.|
|---|---|
|G02|Building a study routine. As a student preparing for exams, I want to<br>complete short study sessions and review my goals and interruptions over|
||time, so that I can identify habits to improve and return consistently. This<br>need is supported by US01–US02 and US06–US08.|



## **4.2. Detailed user stories and acceptance criteria** 

These stories define the first release. Thresholds and timing settings are proposed requirements to calibrate during testing, rather than claims about validated detector accuracy. 

|**ID**|**User story**|**Acceptance criteria**|
|---|---|---|
|US01|As a student, I want to set a<br>task and duration so that I<br>know what I am committing<br>to.|A session requires a non-empty task and<br>positive duration. The app displays both<br>before starting.|
|US02|As a user, I want to pause,<br>resume, or stop so that the<br>session<br>accommodates<br>legitimate interruptions.|Pauses are separate from active elapsed time.<br>Early exits are saved as such. Ending a<br>session releases its website restrictions.|
||As a user, I want to choose|A<br>preflight<br>check<br>verifies<br>the<br>rules.<br>Non-allowed top-level navigation is blocked|
|US03|allowed websites so that work<br>resources remain accessible.|while active. Necessary login flows can be<br>permitted. Overrides are deliberate and<br>logged.|



|**ID**|**User story**|**Acceptance criteria**|
|---|---|---|
|US04|As a user, I want a reminder<br>when I leave the camera view<br>so that I notice an unplanned<br>interruption.|After a configurable grace period, sustained<br>absence creates one event and reminder.<br>Breaks suppress alerts. Camera failure is<br>marked unavailable, not absence.|
|US05|As a user, I want a reminder<br>when a phone remains visible<br>so that I can reconsider the<br>interruption.|A sustained detection above the configured<br>confidence threshold triggers a reminder. A<br>cooldown prevents alert spam; dismissal does<br>not erase the original event.|
|US06|As a user, I want to control<br>camera monitoring so that I<br>can<br>decide<br>what<br>I<br>am<br>comfortable sharing.|Consent<br>is<br>requested<br>before<br>capture.<br>Camera-off mode remains available. The app<br>stops capture when monitoring is disabled or<br>the session ends. Raw video is not uploaded.|
|US07|As a user, I want a session<br>summary<br>so<br>that<br>I<br>can<br>compare my plan with what<br>happened.|Show<br>goal,<br>duration,<br>pauses,<br>events,<br>overrides, and monitoring availability. Ask<br>whether the goal was completed. Do not call<br>elapsed time verified focus.|
|US08|As a returning user, I want to<br>review and delete my history<br>so that I can learn from<br>sessions<br>and<br>control<br>my<br>records.|Authenticated users see only their own<br>records. History survives sign-in on another<br>device.<br>A<br>confirmed<br>deletion<br>removes<br>selected records from normal retrieval.|



Phase 2 story, deferred: As a user, I want to join a private 1v1 session with agreed rules so that another person can help motivate me. Scoring, disconnect handling, fairness, and match retention requirements will be specified separately. 

# **5. Target Users and Market Sizing** 

This is a preliminary user-count model for the student segment, not a revenue forecast or a measured count of buyers. Gen Z students aged 18–29 at the 2026 launch are the proposed target. Young professionals and under-18 users are excluded from the calculation. Historical population inputs are labelled by source year; they are not represented as 2026 population estimates. 

## **5.1. Source baseline and assumptions** 

The Ministry of Higher Education, Science, and Technology website displays 9,967,487 students in its Higher Education Statistics section, labelled “Buku Statistik Pendidikan Tinggi 2024.” This is the national student baseline used below. It is not an age-filtered Gen Z total, an estimate of computer access, or a measure of distraction [3]. 

|**Input**|**Base case**|**Evidence status**|
|---|---|---|
|National<br>student<br>baseline N|9,967,487|Published ministry headline, labelled 2024 [3].|
|Adult Gen Z share A|80%|Planning<br>assumption;<br>obtain<br>an<br>age<br>breakdown.|
|Recurring<br>need<br>and<br>interest B|40% of A|Planning<br>assumption;<br>survey<br>need<br>and<br>willingness to try voluntary accountability.|
|Technical serviceability<br>C|60% of A × B|Planning assumption; jointly covers computer<br>access, suitable internet, supported Chrome,<br>and ability to install the extension.|



## **5.2. Total addressable and serviceable available markets** 

Total Addressable Market (TAM) = N × A × B = 9,967,487 × 80% × 40% = approximately 3.19 million potential student users. This is an assumed problem-qualified national market for focus and accountability support. It is smaller than the total student population and should be labelled “scenario estimate.” 

Serviceable Available Market (SAM) = TAM × C = 3,189,596 × 60% = approximately 1.91 million potential users serviceable by the proposed web-and-Chrome product nationally. Camera participation is optional; camera-assisted uptake needs an additional measured eligibility and consent rate. SAM is national because the service is intended to be available online across Indonesia; Greater Jakarta is the first recruitment area. 

## **5.3. Serviceable obtainable market over twelve months** 

Proposed funnel: 10 student communities × 200 unique, screened eligible prospects = 2,000 prospects. Assuming 30% complete a first session gives 600 activated users. Assuming 40% of those complete at least three sessions in days 15–28 after activation gives 240 retained users acquired during the first 12 months. All funnel inputs are targets, not secured partnerships or observed conversion rates. Count overlapping community members only once. 

The planning Serviceable Obtainable Market (SOM) is therefore 240 cohort-retained users, not 240 paying customers or necessarily 240 simultaneous monthly active users. The practical next step is to confirm community access and replace each assumption with measured data. 

## **5.4. Conclusion** 

The base-case model suggests a national student TAM of approximately 3.19 million and a technically serviceable SAM of approximately 1.91 million. The proposed first-year SOM is 240 retained users recruited through Greater Jakarta student communities. This supports a focused campus pilot before broader acquisition; it does not demonstrate demand or willingness to pay. 



<!-- Start of picture text -->
TAM SAM SOM | Student market scenario<br>0 1 2 3<br>Potential student users in millions + national estimates<br>Enlarged scale for the first-year recruitment target<br>somPo 20<br>) 100 200 300<br>Cohort-retained users acquired during the first 12 months<br><!-- End of picture text -->

Figure 1. Base-case scenario estimates. The top panel uses a shared linear scale for TAM and SAM. The bottom panel enlarges SOM on a separate scale so the 240-user recruitment target remains visible. The three values overlap and must not be added together. Calculations use the historical student baseline [3] and the assumptions in Sections 4.1–4.3. 

SAM equals 60% of TAM. The SOM target is approximately 0.0125% of SAM, but is derived from recruitment capacity rather than an assumed market-share capture. It counts users retained within their own activation cohorts during the first year; it is not a forecast of simultaneous monthly active users. 

### **Sensitivity and validation** 

Lower assumptions of A = 70%, B = 20%, and C = 40% give TAM ≈ 1.40 million and SAM ≈ 0.56 million. Higher assumptions of A = 90%, B = 60%, and C = 80% give TAM ≈ 5.38 million and SAM ≈ 4.31 million. These are sensitivity scenarios, not statistical confidence intervals. 

Replace assumptions through 15–20 exploratory interviews, a screened survey of approximately 100–150 target students, and a two-week pilot with 20–30 participants. Measure technical eligibility, installation and camera consent, first-session activation, and repeat use. Convenience samples cannot establish national prevalence. Treat this market model as a planning aid until those inputs are validated. 

# **6. Competitor Analysis** 

Three similar applications were reviewed using their official product pages on 17 September 2026. They address overlapping needs through distraction blocking, game-based motivation, or social accountability. This comparison records advertised capabilities, not hands-on test results; availability can differ by platform or plan [13–15]. 

|**Application**|**Documented approach**|**Relevance to this project**|
|---|---|---|
|Freedom [13]|Blocks apps, websites, or internet<br>access;<br>supports<br>scheduled<br>sessions, synchronized blocking,<br>locked<br>mode,<br>and<br>website<br>exceptions.|A direct benchmark for the allowlist<br>and session controls. Its broader device<br>coverage is an advantage over our<br>Chrome-only first release.|
|Forest [14]|Uses a focus timer and virtual tree<br>growth<br>to<br>reward<br>completed<br>sessions<br>and<br>discourage<br>distraction. The product presents<br>accumulated sessions visually and<br>advertises Deep Focus blocking.|A direct benchmark for motivation and<br>understandable progress. It already<br>combines timing with gamification, so<br>gamification<br>alone<br>would<br>not<br>distinguish our later release.|
|Focusmate<br>[15]|Matches<br>users<br>for<br>video<br>coworking. Partners state goals<br>and check in at the end of a 25-,<br>50-, or 75-minute session; video<br>remains on.|A benchmark for accountability and<br>goal reflection. Our first release<br>proposes solo, local detection; its<br>established partner model is relevant to<br>phase two.|



## **6.1. Comparison with the proposed first release** 

|**Dimension**|**Existing alternatives**|**Our proposed approach**|
|---|---|---|
|Distraction<br>management|Freedom<br>emphasizes<br>blocking<br>across devices; Forest combines<br>focus sessions and motivation.|A task-specific Chrome allowlist with<br>deliberate overrides and an interruption<br>record.|
|Accountabili<br>ty|Focusmate<br>provides<br>another<br>person<br>and<br>end-of-session<br>check-ins.|A personal goal, optional presence and<br>phone reminders, and a self-reported<br>result.|
|Motivation|Forest<br>uses<br>virtual<br>growth;<br>Focusmate<br>uses<br>social<br>commitment.|Session history in phase one; private<br>1v1 and basic scoring in phase two.|
|Camera<br>handling|Focusmate requires live video with<br>a partner.|Process camera frames locally and<br>transmit event metadata rather than a<br>peer video feed.|



# **7. Risk Analysis** 

## **7.1. Likelihood and consequence scales** 

Score likelihood L and severity S from 1 to 5 over development and the first 12 pilot weeks. These are initial team estimates before controls are verified, not measured probabilities. Use the highest applicable consequence. 

|**Score**|**Likelihood of at least one**<br>**occurrence**|**Severity of consequences**|
|---|---|---|
|1|Rare • greater than 0% and at|Negligible: cosmetic issue; less than one|
||most 10%|workday of rework; core session unaffected.|
|2|Unlikely • over 10% to 30%|Minor: workaround available; 1–2 workdays of<br>rework; isolated inconvenience.|



|**Score**|**Likelihood of at least one**<br>**occurrence**|**Severity of consequences**|
|---|---|---|
|||Moderate: a core feature is interrupted or some|
|3|Possible • over 30% to 50%|recoverable records are lost; 3–5 workdays of<br>rework.|
|4|Likely • over 50% to 75%|Major: repeated session failures, material pilot<br>drop-off, or a 1–2 week release delay.|
|5|Almost certain • over 75% to<br>100%|Severe:<br>unauthorized<br>personal-data<br>access,<br>irrecoverable user-data loss, an unusable pilot, or<br>a delay exceeding two weeks.|



## **7.2. Scoring and escalation** 

Risk priority score R = L × S. Low = 1–4; Moderate = 5–9; High = 10–14; Critical = 15–25. These ordinal scores prioritize attention; they are not expected financial losses. Any severity-5 privacy or security risk is escalated to Critical regardless of its product score. 

|**L / S**|**1**|**2**|**3**|**4**|**5**|
|---|---|---|---|---|---|
|5|5|10|15|20|25|
|4|4|8|12|16|20|
|3|3|6|9|12|15|
|2|2|4|6|8|10|
|1|1|2|3|4|5|



Rows show likelihood; columns show severity. Green = Low, yellow = Moderate, orange = High, red = Critical. Read scores alongside the defined bands. 

## **7.3. Initial risk register** 

Owners are proposed team responsibilities, not named appointments. Each rating includes a brief rationale. The register covers phase one; scoring manipulation and opponent fairness must be assessed separately before phase two. 

|**Risk**<br>**and**<br>**consequence**|**L**|**S**|**R**<br>**and**<br>**level**|**Mitigation and owner**|
|---|---|---|---|---|
|R01 - False or missed<br>detections.<br>Variable<br>lighting and camera<br>angles may produce<br>frequent errors and<br>loss of trust.|4|4|16<br>/<br>Critical|CV lead: labelled trials across devices and<br>lighting; confidence and duration thresholds;<br>cooldowns; dismissals; unavailable state.<br>Track precision, recall, and user-reported false<br>alerts.|
|R02<br>-<br>Background|||||
|suspension<br>or<br>high<br>CPU<br>load. Camera<br>processing may stop<br>or make a study laptop<br>sluggish.|4|3|12<br>/<br>High|Frontend/CV lead: benchmark hidden-tab<br>behaviour; use worker inference and capped<br>frame rate; show monitoring gaps; offer<br>camera-off mode.|
|R03<br>-<br>Incorrect<br>allowlist rules. Login||||Extension lead: preflight test; required-domain|
|redirects or required<br>study pages may be<br>blocked,<br>disrupting<br>the main task.|4|4|16<br>/<br>Critical|exceptions;<br>expiry<br>and<br>stop<br>controls;<br>deliberate override; test pause, restart, and rule<br>cleanup.|
|R04 - Data exposure.<br>Misconfigured access<br>policies<br>or<br>leaked<br>credentials may reveal<br>another user’s records.|3|5|15<br>/<br>Critical|Backend lead: Row Level Security; negative<br>cross-user tests; server-only secrets; minimal<br>metadata; no video upload; deletion controls;<br>incident procedure.|



|**Risk**<br>**and**<br>**consequence**|**L**|**S**|**R**<br>**and**<br>**level**|**Mitigation and owner**|
|---|---|---|---|---|
|R05<br>-<br>Lost<br>or|||||
|duplicate<br>records.<br>Network failures or<br>service outages may<br>corrupt<br>session<br>summaries.|3|3|9<br>/<br>Moderat<br>e|Backend lead: local event queue with unique<br>IDs; retry safely; reconcile timestamps;<br>display sync status; verify backup and restore<br>arrangements.|
|R06 - Weak adoption.|||||
|Camera concerns and<br>extension setup may<br>deter<br>users<br>despite<br>stated interest in focus<br>tools.|4|4|16<br>/<br>Critical|Product lead: test onboarding and camera-off<br>use; interview users who decline; measure<br>activation and retention; revise assumptions<br>before expansion.|
|R07<br>-<br>Scope<br>and|||||
|integration<br>delay.||||Project<br>lead:<br>freeze<br>phase-one<br>scope;|
|Adding<br>1v1<br>or<br>training models too<br>early may prevent a<br>stable solo release.|3|4|12<br>/<br>High|prototype extension and detector integration<br>first; use compatible pretrained models; defer<br>phase-two work.|
|R08 - Restrictions are||||Extension/product leads: report detectable|
|bypassed. Users can<br>disable the extension<br>or<br>use<br>another<br>browser or device.|4|3|12<br>/<br>High|disconnects;<br>explain<br>enforcement<br>limits;<br>preserve voluntary exit; never describe records<br>as proof of focus or use them for high-stakes<br>ranking.|



References 

[1] APJII. “APJII Jumlah Pengguna Internet Indonesia Tembus 221 Juta Orang.” 7 February 2024. 

https://apjii.or.id/berita/d/apjii-jumlah-pengguna-internet-indonesia-tembus-221-juta-orang Supports 2024 internet-user count, penetration, and Gen Z share. These measures do not establish app demand. 

[2] OECD. PISA 2022 Results Volume I and II Country Notes — Indonesia. 5 December 2023. 

https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fb cc5-en/indonesia_c2e1ae0e-en.html 

See “Support and discipline in mathematics lessons.” School-based findings concern 15-year-olds, not the adult target market. 

[3] Ministry of Higher Education, Science, and Technology. Higher Education Statistics homepage panel. Labelled Buku Statistik Pendidikan Tinggi 2024. 

https://kemdiktisaintek.go.id/en 

Panel displays 9,967,487 students. Used as an aggregate historical baseline; no age, demand, or device eligibility breakdown is inferred from it. 

[4] MDN Web Docs. Page Visibility API. 

https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API 

Supports the distinction between a page becoming hidden and identifying the user’s destination or mental attention. 

[5] Google Chrome for Developers. Tabs API. 

https://developer.chrome.com/docs/extensions/reference/api/tabs 

Describes extension access to browser tabs and permission-dependent tab information. 

[6] Google Chrome for Developers. Declarative Net Request API. 

https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest 

Describes rules for blocking or modifying network requests. Actual allowlist behaviour still requires implementation and testing. 

[7] Next.js. Documentation. 

https://nextjs.org/docs 

Framework documentation supporting the proposed React application and client/server structure. 

[8] Next.js. Route Handlers. 

https://nextjs.org/docs/app/getting-started/route-handlers 

HTTP request handling for the proposed application API. 

[9] Supabase. Auth. 

https://supabase.com/docs/guides/auth 

Authentication capabilities for account and session management. [10] Supabase. Row Level Security. https://supabase.com/docs/guides/database/postgres/row-level-security Database authorization and privileged-key boundaries. 

[11] Google AI Edge. Face detection guide for Web. https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js Browser face detection and worker guidance; does not establish mental-focus detection. 

[12] Google AI Edge. Object detection guide for Web. 

https://developers.google.com/edge/mediapipe/solutions/vision/object_detector/web_js Requires a compatible trained model; the phone class must be verified for the selected model. [13] Freedom. Official product and feature page. https://freedom.to/ Source for the competitor description; platform-specific functionality may vary. [14] Forest. Official product and feature page. https://www.forestapp.cc/ Source for the timer, tree-growth motivation, and advertised blocking features. [15] Focusmate. How It Works. https://www.focusmate.com/how-it-works/ Source for video coworking, goal sharing, check-ins, and session durations. 

