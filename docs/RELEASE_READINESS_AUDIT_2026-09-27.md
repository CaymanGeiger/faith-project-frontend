# Hercules Honors Rewards — release readiness audit

Audit date: September 27, 2026 (America/Denver). Target: release in approximately one month, supporting iOS and Android.

Follow-up: the user subsequently approved password recovery, verified email changes and push alerts. Implementation and activation/testing status are recorded in [Account security and push notifications](ACCOUNT_SECURITY_AND_PUSH.md). This document preserves the original audit findings; it is not a claim that every finding has been resolved. Staff fulfillment and training cancellation/rescheduling remain undecided.

Implementation follow-up: [Remaining release fixes and current validation](RELEASE_FIXES_2026-09-28.md). The original findings below are preserved as the audit record.

**Recommendation: do not approve the current version for public release.** The app builds its JavaScript bundles and has substantial passing automated coverage, but there are confirmed privacy, session, messaging, and training defects, incomplete staff workflows, and unresolved native/store release gates. These are actionable findings, not a prediction that the project cannot launch next month.

This is an audit of the current local working trees, including existing uncommitted work. No application source was changed, no customer records were modified, and nothing was submitted to either store during this audit. Findings distinguish reproduced behavior, source inspection, and checks that remain unverified. “P1” means fix or establish a tested operational solution before launch; “P2” means resolve before launch unless the owner explicitly accepts the narrow limitation.

## Verification results

| Check | Result | What it establishes |
| --- | --- | --- |
| Frontend `npm run check` | Passed | Source/store guards, 27 tests across configuration, launcher, API client and runtime recovery; TypeScript; web, Android and iOS JavaScript exports |
| Backend unit tests, watchman disabled | 18 suites, 247 tests passed | Tested service behavior with the existing fixtures; not a live-database acceptance test |
| Backend production build | Passed | Production source compiles |
| Prisma schema validation | Passed | Schema is syntactically/configurationally valid; migration deployment remains untested |
| Backend full TypeScript check including tests | Failed | A test references nonexistent `UserStatus.SUSPENDED` |
| Backend non-mutating lint | Failed: 69 errors, 1 warning | Formatting plus typing/async/test quality findings; no autofixes applied |
| Fresh frontend dependency audit | 16 moderate, 0 high/critical | Dependency findings still require triage |
| Fresh backend dependency audit | 6 high, 1 moderate | Includes development dependencies |
| Backend production-dependency-only audit | 2 high entries | `multer` and its parent dependency path through `@nestjs/platform-express`; these are related entries, not two independent attacks |
| Additional isolated reproductions | 9 confirmed cases | Actual application modules with mocked database/network/native boundaries; described below |
| Current iOS simulator visual inspection | Stale training sessions confirmed | Existing signed-in session; no training preference submitted |

Earlier Expo Go smoke tests on iOS and Android are useful supporting evidence, but they do not establish that signed store builds, native permissions, upgrades, or physical devices work. A successful JavaScript export is not a successful App Store/Play Store binary build.

Saved evidence: [backend reproductions](validation/release-audit/backend-reproductions.cjs), [frontend reproductions](validation/release-audit/frontend-reproductions.mjs), [production dependency audit](validation/release-audit/backend-production-audit.json), and [backend lint output](validation/release-audit/backend-lint.log). Reproduction scripts assert the currently defective behavior; they are diagnostic evidence, not permanent regression tests. Run the backend script after building the adjacent backend checkout, and use the frontend's supported Node version for its script. Neither script connects to customer services or a real database.

## Findings requiring launch action

### R01 — P1: account deletion can leave personal data behind after an email change

**Reproduced.** Profile editing replaces the account email. Account deletion then erases imported Jotform records by matching only the current email. There is no stable user relationship or historical verified-email ownership linking those imported records to the account. The reproduction changed the account identity to a new email, deleted it, and observed the old-email submission retain its email, company and dealer number while the API reported completion. The deletion suppression record also covered only the new email.

There is a second, source-derived ownership risk: changing an account to an email belonging to an unlinked Jotform respondent can cause deletion to target that respondent's records. This consequence was not exercised against live data.

**Required outcome:** verify email changes, establish stable ownership of imported submissions and historical identities, and erase/suppress all records actually owned by the deleting account. Test old and new emails, repeated webhook delivery, competing identities, and concurrent deletion/import. Define the process for data retained by Jotform itself and approve retention periods for deletion/audit records.

Evidence: [user service](../../backend/src/users/users.service.ts), profile email update at line 48 and deletion matching at line 158. See also `backend/prisma/schema.prisma` and the Jotform privacy-lock/suppression code. Descriptive source paths in this report are relative to the workspace root, not to this document.

### R02 — P1: an expired messaging socket can continue receiving messages

**Reproduced.** A recipient joins a conversation with a valid token. After the token expires, even a failed reauthentication attempt leaves that socket connected and in its existing room. A valid sender's next message is still broadcast to that recipient. Authenticating incoming actions does not expire an existing room subscription.

**Required outcome:** disconnect/evict sockets when authentication fails and enforce expiry on long-lived subscriptions. Test expiry while idle, expiry while actively chatting, logout/revocation, and reconnection. The confirmed finding concerns token expiry; this audit does not claim that disabled users bypass every service-level conversation check.

Evidence: `backend/src/messaging/messaging.gateway.ts:78` (join), `:116` (send/broadcast), and `authenticateClient`/error handling later in that file.

### R03 — P1: session expiry leaves the app in a broken signed-in state; password recovery is missing

**Reproduced for expiry; recovery absence confirmed by source inspection.** Initial restoration clears rejected credentials, but a later `refreshMe()` receiving HTTP 401 leaves the user and stored token in place. API errors do not provide a consistent transition to sign-in. With the default seven-day token lifetime, an otherwise normal long-lived session can become unusable until the user manually signs out or restarts into the restoration path.

There is no complete forgot-password/reset/change-password flow or supported operator recovery command. A real dealer who forgets their password needs a tested recovery path. Logout also does not revoke an already issued bearer token server-side; decide and document the intended session/revocation policy.

**Required outcome:** centralize invalid-session handling, preserve safe drafts, provide a clear sign-in transition, and implement a secure recovery process. Verify expired sessions on both platforms while foregrounded, backgrounded, offline and reconnecting.

Evidence: `frontend/src/features/auth/AuthProvider.tsx:179`, `frontend/src/lib/api/client.ts:108`, and `backend/src/auth/`.

### R04 — P1: dealer submissions do not have a complete staff fulfillment workflow

**Source-confirmed workflow gap.** Dealers can save training preferences, equipment information and marketing availability. The manager-facing data does not provide a complete queue of those submissions, their actual details, assigned owner and resolution. There is no supported runtime completion path for training attendance/certification. The manager lead editor's “Certified” status updates `LeadRecord.status`, while dashboard/progress logic reads the separate `ProspectProfile.certificationStatus`.

The marketing LeadSmart adapter returns `NOT_SUBMITTED`; the lead synchronization adapter returns `LEAD_API_UNCONFIGURED`. Those are intentional, and current copy appropriately avoids claiming a completed external handoff. They still require an agreed manual process or real integration before customers rely on follow-up.

**Required outcome:** demonstrate one complete dealer journey with an actual staff operator: receive request, inspect details, assign owner, act, update the authoritative status, and show the result to the dealer. A tested, documented manual process may cover approved v1 scope; an undocumented expectation that someone will inspect the database is insufficient.

Evidence: `backend/src/marketing-consultation/lead-smart.adapter.ts`, `backend/src/leads/lead-api.adapter.ts`, `backend/src/leads/leads.service.ts`, `frontend/src/features/manager/LeadStatusEditor.tsx:46`, and the prospect profile/enrollment models.

### R05 — P1: new-account onboarding and production setup need an end-to-end operational contract

**Source-confirmed gap; operational ownership unverified.** The public registration Jotform captures submissions; that is not equivalent to creating a usable app account. Invitation-based account creation exists, but the repository does not establish a complete approved path from incoming form through review, manager assignment, invite delivery, and first login. Production manager bootstrap and ongoing class/content maintenance also need an explicitly supported process.

**Required outcome:** test a brand-new dealer and a brand-new manager from empty state in staging. Identify who approves and sends invitations, resolves duplicates, recovers access and maintains content. Do not depend on developer demo seeds for production setup.

Evidence: auth/invite routes and scripts, Jotform ingestion, seed production safeguards, and root stakeholder decision documents.

### R06 — P1: production dependency advisories need remediation and regression testing

The production-only backend dependency audit reports high-severity findings involving Multer and the Nest Express adapter dependency chain. Advisory subjects include malformed multipart fields, aborted-upload resource leakage and multipart limit handling. The Jotform multipart endpoint has authentication and restrictive upload configuration, so this report does not label it a demonstrated unauthenticated exploit.

**Required outcome:** update to compatible patched dependencies, rerun the production audit, and regression-test Jotform authentication, multipart limits, malformed input and normal submissions. Do not apply a broad breaking dependency upgrade without checking the integration.

Advisory references: [multipart denial of service](https://github.com/advisories/GHSA-wc9g-mqfw-jrwm), [aborted upload resource leakage](https://github.com/advisories/GHSA-qfvm-cv95-jqjf), [multipart limit bypass](https://github.com/advisories/GHSA-qvfw-j98x-7q72), [array-index field denial of service](https://github.com/advisories/GHSA-535w-7cp7-47q4).

### R07 — P2: training can display unavailable sessions, discard a selection and downgrade certification

Three distinct defects:

- **Visually confirmed:** “Upcoming Classes” displayed July 30 and August 13, 2026 during the September 27 inspection. The details sheet still offered “Save Training Preference.” The server rejects past sessions, so this creates a dead-end choice rather than a valid enrollment. The list endpoint does not filter date/status.
- **Reproduced:** when Getting Started already has an enrolled/completed class, selecting a different class and pressing Save & Continue advances without calling the enrollment API.
- **Reproduced:** saving a new future class unconditionally changes an already-certified profile to `IN_PROGRESS`.

**Required outcome:** separate future choices from enrollment history, honor changes to selection, preserve earned certification and establish reschedule/cancellation rules. Confirm whether recurring sessions reuse the same virtual meeting URL; its current uniqueness constraint may conflict with that content model.

Evidence: `backend/src/classes/classes.service.ts:11` and `:100`; `frontend/src/features/getting-started/ClassSetupStep.tsx:43`; [observed training screen](validation/release-audit-stale-class.png).

### R08 — P2: messages can be missed when the conversation is not open

**Broadcast behavior reproduced; UI subscription path inspected.** New messages are emitted to the conversation room, while clients join the selected conversation. An authenticated client without that open room receives no message-created event. This also prevents the conversation-list listener from reliably refreshing unread information for other conversations. The notification menu fetches when opened; it is not a background delivery mechanism.

There is no operating-system push implementation. Push is a product decision, not an automatic store requirement, but the support response model must account for users and managers being outside the conversation or outside the app.

**Required outcome:** provide authenticated per-user conversation updates and reliable refresh on foreground/reconnection. Decide whether v1 also requires push, email alerts, or an explicitly staffed alternative. Test two users with different chats open and both apps backgrounded.

Evidence: `backend/src/messaging/messaging.gateway.ts:132`, `frontend/src/features/messaging/hooks.ts`, and `frontend/src/components/layout/NotificationsMenu.tsx`.

### R09 — P2: chat history, moderation visibility and unread timestamps have correctness defects

**Reproduced:** initial history loads only one page of 50 messages despite a next cursor, and the thread has no load-older interaction. A refresh merges server results with the previous local list, retaining a message removed by moderation. A client can also persist a read timestamp in 2099, suppressing normal future unread counts; older timestamps can move read state backward across devices.

**Additional source finding:** typing events are emitted on keystrokes while the backend allows 60 typing events per minute across start/stop. Ordinary typing can exceed the limit; expiry/debounce behavior needs improvement and a realistic typing test.

**Required outcome:** implement visible history pagination, explicit deletion reconciliation/events, and monotonic server-bounded read state. Add tests covering more than 50 messages, moderation while viewing a chat, incorrect device clocks and two devices.

Evidence: `frontend/src/features/messaging/messageHistory.ts:29`, `frontend/src/features/messaging/hooks.ts:122`, `backend/src/messaging/messaging.service.ts:183`, and gateway typing handlers.

### R10 — P2: partial writes and stale screens can give conflicting results

**Source-confirmed.** Enrollment, todo completion and profile updates are separate writes. Equipment creation and related todo updates are also separate, as are portions of the JB status flow. A failure after the first write can leave saved data alongside an error, and a retry can then encounter a duplicate. Marketing already uses a transaction and is not included in this finding.

The persistent manager provider loads prospects/support by user ID and lacks a general foreground/focus refresh. New dealers or changes from another device can remain absent until another explicit reload or provider remount. Equipment entry also lacks a supported correction path after an erroneous serial is saved.

**Required outcome:** use transactions/idempotent recovery where a business action spans records, provide safe correction workflows, and refresh shared manager data at appropriate lifecycle boundaries. Verify interrupted saves and changes made on another device.

Evidence: `backend/src/classes/classes.service.ts:73`, equipment/todo services, and `frontend/src/features/manager/ManagerDataProvider.tsx:76`.

### R11 — P2: the API timeout does not cover stalled response bodies

**Source-confirmed.** The client clears its timeout after `fetch` returns response headers, before `response.json()` finishes. A stalled body can therefore leave a screen waiting beyond the intended timeout. A supplied caller signal also replaces the default timeout signal.

**Required outcome:** cover the full response operation and compose timeout/caller cancellation correctly; test headers arriving followed by a body that never completes.

Evidence: `frontend/src/lib/api/client.ts:104`.

### R12 — P2: backend quality checks currently provide incomplete protection

The full TypeScript check fails at `backend/src/auth/jwt-auth.guard.spec.ts:63`: `UserStatus.SUSPENDED` does not exist. Valid statuses are ACTIVE, INVITED and DISABLED. The transpiled test passes by exercising an undefined status, rather than the intended real disabled-account value. Production compilation does not catch this test error.

Lint has 69 errors and one warning. The backend lacks a repository CI workflow comparable to the frontend's checks, and its starter end-to-end test does not exercise the real dealer/manager journeys.

**Required outcome:** correct fixtures, make non-mutating lint/full type checks pass, add backend CI and database-backed acceptance tests for the critical flows and newly reproduced defects. Passing unit tests must not be treated as proof of deployment readiness.

## Store, infrastructure and operational release gates

These are missing evidence or decisions, not all confirmed application defects.

| Gate | Current finding | Required evidence before release |
| --- | --- | --- |
| Permanent app identity | iOS `bundleIdentifier` absent; Android package configured but company/store ownership unverified | Exact approved identifiers and access to the corresponding company store records |
| Distribution model | Earlier documents discuss private/custom distribution; public launch intent needs alignment | Approved Apple and Google distribution routes, organizational ownership and reviewer access |
| Signed native builds | No verified signed release candidate for either platform | Installable TestFlight build and Play internal-track AAB from the intended source/configuration |
| iOS build toolchain | Earlier local native attempt was blocked by Xcode 26.3 versus SDK 57's newer requirement | Compatible local or approved cloud toolchain, then successful native build; this alone is not proof of an app-code defect |
| Reproducible release | Both repositories contain extensive pre-existing modified/untracked work; EAS requires a commit | Reviewed source/migrations committed, exact release revisions and version/build numbers recorded |
| Store declarations | Stakeholder/legal decisions remain unsigned; external privacy/deletion URLs and disclosures require release verification | Approved policy, terms, support contact, data forms, screenshots, content rating and review credentials |
| Native behavior | Expo Go cannot validate all shipped native behavior | Release-build checks for icons, splash, permissions, deep links, secure storage, backup behavior, upgrades and OTA compatibility |
| Database rollout | Schema validates; staging migrations/rollback/restore not exercised in this audit | Fresh install and upgrade migration rehearsal, verified backup restore, rollback plan and restricted production access |
| Monitoring | Health response is static application health; no demonstrated DB readiness or end-to-end alerting | DB-aware readiness, request/error/crash visibility, tested alert delivery and a named incident owner |
| Jotform background maintenance | Retry/reconciliation requires an external scheduled maintenance process | Verified scheduler, failure/retry/dead-letter handling, webhook credentials and staff review ownership |
| Privacy operations | Some staff deletions require reassignment; operator notification is best effort | Monitored queue, completion ownership, retry/escalation and retention policy |
| Scaling | Conversation listing performs multiple queries per conversation; socket adapter is process-local | Expected-volume load test; shared socket delivery if deploying multiple server processes |
| Launch content | Old training data visibly remains in the current environment | Approved current classes, benefits/rebates, resources and contacts; production verified free of demo accounts/content |

Current official references: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/), [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app), [Android 16 KB page-size compatibility](https://developer.android.com/guide/practices/page-sizes), and [Google testing requirements for affected new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en). If the Google account falls into that personal-account category, the minimum 12 testers continuously opted in for 14 days must be included in the schedule. Do not assume it applies to an organization account. Verify page-size compatibility on the produced native artifact, not just the dependency list.

## Coverage and remaining acceptance work

Source review covered these functional areas and their backend counterparts:

| Area | Reviewed | Remaining real-environment proof |
| --- | --- | --- |
| Login, invite registration, account editing, logout | Routes, state/storage, DTOs, guards, services | New invite, expiry, recovery, email change and cross-device session behavior |
| Dealer home and Getting Started | Drafts, step completion, progress, role routing | Full new-dealer journey, interrupted writes, resume after reinstall/logout |
| Already a Dealer/Jotform | Link flow, ingestion, authentication, queue, mapping/privacy | Real staging webhook, retries, duplicate handling, staff review/account linkage |
| Training | List, details, enrollment/status writes | Staff completion, reschedule, timezone/DST and historical sessions |
| Equipment/JB progress | Entry, validations, records and todo effects | Duplicate/typo correction and partial failure recovery |
| Marketing | Availability persistence and adapter | Staff receipt and completed follow-up |
| Benefits, rebates, resources | Screens, API/content paths and link handling | Business-approved claims, every production link/document and relevant accessibility |
| Manager home/prospects | Data provider, filters, lead status/notes | Assignment, new prospect arrival, accurate certification and fulfillment queue |
| Dealer and manager messaging | REST, socket auth, membership, sending, retries, reads, report/block/moderation | Two real users, two devices, background/reconnect, history/deletion and long conversations |
| Profiles, privacy, terms, account deletion | Both roles, policies, request/deletion paths | Staging erasure including imported data, manager reassignment and external retention |
| Shared mobile shell | Navigation, modals, keyboard handling, status bars, links, loading/errors | Physical-device and accessibility matrix below |
| Release/backend operations | Manifests, native plugin/build configuration, dependencies, schema/migrations, scripts and docs | Signed artifacts, deployed configuration, migrations, restore, monitoring and store acceptance |

The Hercules event calendar and LG registration destinations resolved during read-only checks. A web-tool fetch of the Jotform registration URL was inconclusive; that is not evidence the form is broken. All production link targets still need final interactive acceptance with the release environment.

Do not skip the following device matrix: current supported iOS and Android releases, oldest supported OS versions, a small phone, a large phone, Android gesture and three-button navigation, display cutouts/status bars, large system fonts, VoiceOver/TalkBack, keyboard-open forms and long manager detail sheets, reduced motion, slow/offline connections, app background/foreground, killed app and reinstall. Fixed-height controls and long modal content deserve special attention; clipping/keyboard/accessibility failures were not comprehensively reproduced here and should not be stated as confirmed.

No production database inspection, destructive deletion, customer messaging, live form submission, database-backed end-to-end suite, load test, signed-binary acceptance or physical-device matrix was completed in this audit. External account ownership and legal/business approvals cannot be established from source code. This report is comprehensive across the identified modules; it does not claim every possible runtime state has been tested.

## Suggested order for the remaining month

1. **Week 1:** fix R01–R03 and dependency advisories; resolve IDs, distribution, signing/toolchain and Google testing eligibility immediately. Agree on the staff fulfillment/onboarding contract. Start the native build pipeline now.
2. **Week 2:** finish the staff workflow and training/messaging/data fixes; correct backend checks and add targeted database-backed acceptance tests. Populate staging with realistic approved content.
3. **Week 3:** run the complete dealer-to-manager journey on signed iOS/Android candidates, execute the physical-device/accessibility matrix, rehearse migrations/restore and test operational alerts. Start any required store testing as early as eligibility allows.
4. **Week 4:** resolve acceptance failures, freeze a reviewed release candidate, finish store assets/disclosures and submit with review time remaining. Approval timing is external; do not reserve the first native build or first store submission for launch day.

Launch approval should require: no unresolved P1 findings; an explicit disposition for each P2; both signed candidates passing the core journeys; an operational owner for every customer request/deletion; and documented store, data and rollback readiness.
