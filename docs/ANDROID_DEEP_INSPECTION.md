# Android readiness: second inspection

Reviewed September 27, 2026. **Verdict: not ready for an approved Android release candidate.** The first pass added useful build/configuration safeguards but did not establish complete runtime readiness or preserve the entire previously supported iOS device range.

This pass reviewed current source, backend messaging behavior, native configuration/plugin output from the first pass, dependency changes relative to Git HEAD, and the release guard. It used a temporary diagnostic harness to execute the current authentication and messaging code with mocked storage/network/socket responses. Those reproductions are not physical-device or React renderer tests. No application code or dependencies were changed in this inspection.

## Fix follow-up — September 27, 2026

The findings below are retained as the historical inspection. The subsequent implementation fixes session recovery, paginated chat recovery, retry identity, focus-aware Android Back, Terms dismissal, Android light appearance, scrolling panels/side insets, and foreground read receipts. Regression tests execute the actual hooks/components with mocked native/network boundaries. See [current validation](ANDROID_ENGINEERING_VALIDATION.md).

The user chose current iOS/Android support; SDK 57 remains with minimum iOS 16.4. Reviewed SDK patches and iOS scene lifecycle support are installed. Android now uses `com.herculesindustries.honorsrewards` as a new source identifier. Existing Apple identity cannot be verified until company App Store Connect access is available. Signed native builds and device/store acceptance remain open.

## Original findings, in priority order

### 1. Android release build is still blocked by missing identity

`app.json:17`: no `android.package`. Re-running `npm run verify:production-config -- --platform android` with Node 24.19.0 fails at this requirement. This is an intentional guard, not a guard defect. A company-approved permanent identifier is required before a real candidate can be built. The iOS bundle identifier is also absent locally; any already-published identity must be recovered and preserved.

### 2. The existing SDK upgrade changes Apple OS compatibility

`package.json:8`: Git HEAD used Expo SDK 54; the working tree already used SDK 57 before the Android implementation. Expo's SDK 57 podspec (`node_modules/expo/Expo.podspec`) declares iOS 16.4. The [official SDK compatibility table](https://docs.expo.dev/versions/v57.0.0/) lists SDK 54's minimum as iOS 15.1 and SDK 57's as iOS 16.4.

Existing users running iOS 15.1–16.3 cannot receive this candidate without updating their OS, where supported. This is a compatibility change even though the prior Android patch did not edit the `ios` configuration object. Confirm the supported iPhone OS range and installed production version before accepting the SDK upgrade. A native iPhone build/regression pass is still required. Do not infer safety from a successful iOS JavaScript export.

### 3. Temporary launch failures permanently clear the saved session

`src/features/auth/AuthProvider.tsx:106`: the session-restore catch block handles every error by deleting the saved token. Offline startup, timeout or a server outage is therefore treated like an invalid credential.

Diagnostic result: mock a previously stored valid token and reject `/auth/me` with a temporary network error; the current code calls secure-token deletion once. Restoring connectivity alone cannot recover that session.

Required fix: distinguish explicit authentication rejection from transient failure; retain the credential on transient failure and offer a safe retry without granting unverified access. Verify invalid/deleted accounts still lose access on both platforms.

### 4. Chat reconnect does not recover messages missed offline

`src/features/messaging/hooks.ts:146`: the `connect` handler only rejoins the room. `conversation:joined` only updates readiness. Neither reloads message history. `useConversations` also does not refresh its list on reconnect.

The backend `MessagingGateway.joinConversation` checks membership, joins the room and emits a joined event; it does not replay missed messages. No connection-state-recovery configuration was found in the inspected frontend/backend source.

Diagnostic result: simulate disconnect/reconnect and a joined event; the history-fetch count does not increase. Messages sent during the offline interval stay missing until a later reload/reopen.

Required fix: reconcile history/list state after reconnect, account for pagination and concurrent live events, and reset readiness during disconnection. Test two real sessions across loss of connectivity.

### 5. Retrying a timed-out send can create duplicate messages

`src/features/messaging/hooks.ts:215`: each attempt generates a new `clientMessageId`. A timeout leaves the draft in the composer and tells the user to retry. If the server saved the first message but its acknowledgment was lost, retry sends a new ID. The backend deduplicates by sender plus `clientMessageId`, so it accepts that retry as another message.

Diagnostic result: force an acknowledgment timeout, resend the identical body, and inspect emitted payloads; they contain different idempotency keys.

Required fix: retain the pending message identity across retries of the same operation, reconcile late acknowledgments/live events, and avoid leaking a delayed result into a different conversation. Also handle the rejected send promise in `MessageComposer.tsx:23`; it currently has `finally` without `catch`, while the press handler discards the promise.

### 6. Android registration Back bypasses the previous form stage

`src/app/(auth)/register.tsx:124`: hardware Back always invokes `returnToLogin`, including after invitation validation when the visible UI back control invokes `resetInvite`. It therefore exits the registration workflow instead of matching the on-screen previous-stage behavior. The listener is tied to mount/unmount rather than screen focus, creating an additional risk when Terms/Privacy is pushed above registration.

Required fix: register the Android handler only while focused and match the current form stage. Verify keyboard-first dismissal, invalid/in-flight invitation requests, legal-page return and system gesture/button navigation.

## Additional runtime risks requiring validation

- `MessagingModal.tsx:131` pushes Terms without closing the native modal. The Terms screen may remain obscured by the chat dialog. Verify and dismiss the sheet before navigation when needed.
- The Android prebuild warns that `expo-system-ui` is absent; `userInterfaceStyle: light` is not fully applied by that plugin path. Generated AppTheme inherits DayNight. Check dark-system-theme launch, dialog and input surfaces before claiming fixed light appearance.
- Quick-links and notifications panels are not scrollable; their fixed widths/heights and screen offsets need testing with large fonts and short/resized windows. Main dealer/manager safe-area wrappers only include the top edge, so side cutouts during large-screen rotation remain a device-test item.
- Read receipts run on opening a conversation rather than on every incoming message; confirm intended unread behavior across an already-open thread and reconnect.

## What the passing checks do and do not establish

The first-pass 10 guard/plugin tests, 7 API-client tests, TypeScript, Android/iOS/web exports, clean locked install, EAS schema validation and isolated Android prebuild remain useful evidence. Those tests did not cover the auth restore or chat lifecycle failures above. This inspection added targeted failure reproductions rather than repeating unchanged bundle checks.

Online Expo Doctor previously passed 19/20 checks and reported eight recommended SDK patch updates. Those remain unresolved. Review/install a deliberate compatible patch set with native regression validation; do not suppress the finding or blindly upgrade.

There is no usable Java runtime or Android SDK/device toolchain at the checked local locations, so no native compilation/device testing was performed. Isolated prebuild output is not a merged, signed APK/AAB. Package ownership, remote EAS credentials/environments, production services/migrations, Play declarations, signing, 16 KB compatibility, pre-launch reports and Play-delivered installation are still unverified.

## Release decision

Resolve the confirmed runtime defects and the iOS compatibility decision, supply the permanent identity, validate the intended SDK patch set, then build and exercise signed Android/iOS candidates. Complete the [original release worklist](ANDROID_GOOGLE_PLAY_RELEASE_PLAN.md) and record device/Play evidence before calling the port release-ready.
