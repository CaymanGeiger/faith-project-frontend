# Android engineering validation — September 27, 2026

Release source: `frontend/`. **Code fixes verified; not yet approved for store release.** No store registration, signing credential, upload, production data or EAS Update was changed.

## Fixes completed

- Offline/timeouts/server failures retain saved credentials and show a retry screen; explicit 401/403 rejection clears credentials. Late recovery cannot restore a logged-out session.
- Chat resets connection readiness, refreshes the conversation list, and recovers paginated history after reconnect/foreground without losing concurrent live messages.
- Composer retries reuse the same operation identity, preventing duplicate writes after lost acknowledgments. Late results cannot overwrite another conversation; rejected sends retain the draft.
- Android registration Back is focus-aware, dismisses the keyboard first, returns to the invitation stage, and ignores stale validation responses.
- Chat closes before opening Terms. Read receipts follow incoming messages/rejoin/foreground and avoid marking background messages read.
- Android menus scroll within available space; layouts account for side/system insets. Light appearance is configured through expo-system-ui. Android launcher assets reuse existing Hercules artwork with adaptive/themed safe spacing.
- Store guard checks platform-specific identity and public HTTPS/WSS endpoints; preview/production reject unsafe or missing endpoints. Android APK/AAB profiles, CI checks, remote versions and committed-source build requirement remain enabled.
- Installed reviewed SDK 57 patches, expo-system-ui and expo-build-properties with iOS scene lifecycle support. The user chose support for current iOS/Android; minimum iOS is 16.4. Android minimum SDK is 24, target/compile SDK 36 in generated dependency defaults. Device compatibility still needs native validation.
- Source version is now 1.0.3 with the existing appVersion runtime policy, separating these native changes from 1.0.2 updates. Apple artwork and Android-specific layout conditionals preserve existing iOS presentation intent; shared native changes still require iPhone QA.

## Evidence

| Check | Result | Limit |
| --- | --- | --- |
| Final locked install | Passed in an isolated directory | Install scripts disabled; native build still required |
| Guard/launcher tests | 10 passed | Identity, endpoints, platform selection, repeatable Android-only native icon plugin |
| API client tests | 7 passed | Network/errors/authentication/timeouts |
| Runtime regression tests | 10 passed | Actual hooks/components, mocked native/storage/network/socket boundaries; not device tests |
| TypeScript and Android/iOS/web exports | Passed | JavaScript bundles, not native binaries |
| Online Expo Doctor | 20/20 passed | Dependency/configuration checks |
| Expo dependency alignment | Passed | Recommended SDK 57 versions |
| EAS production Android guard | Passed using actual remote environment | Endpoint syntax only; does not establish backend health |
| Isolated Android and iOS prebuild | Passed without warnings | Real Android source ID; temporary iOS validation ID only outside repository |
| Generated native configuration | Inspected | Android light UI, backup disabled, resize keyboard mode and launcher insets; iOS scene manifest and factory provider enabled |
| Dependency audit | 0 high/critical; 16 moderate reported | Three high findings fixed with compatible transitive updates; remaining findings include Expo build tools and Router decode-uri-component. Forced SDK downgrades were not applied. Track upstream compatible fixes. |

The full `npm run check` passed, then the added read-receipt test passed in the final 10-test runtime suite. Renderer deprecation notices do not fail tests; native behavior remains outside this harness. Node 24.19.0 was used.

## Identity and access

Android source identity is `com.herculesindustries.honorsrewards`, selected as a new namespace from the company's domain at the user's direction to proceed. This does not register or prove ownership in Google Play. The accessible Google account shows developer-account signup, not an existing app. The authenticated EAS project returned no build history. App Store Connect requires sign-in, so the existing Apple bundle ID remains unverified and was not guessed or changed.

## Remaining release gates

1. Company Google Play developer access/registration and distribution choice; recover the existing Apple bundle ID through App Store Connect and preserve it. iOS release guard intentionally remains blocked without that identity.
2. Commit/review the source, then create signed Android and iOS candidates. No usable local Java/Android SDK was available and no native compile or signed artifact was produced.
3. Verify production API/database migrations, account flows, invitation/Jotform mode, real two-session messaging and monitored operations.
4. Run device acceptance below, including newest supported iOS/Android, iPhone regression, 16 KB Android page sizes, Play-delivered install/upgrade and pre-launch reports.
5. Complete live legal/deletion URLs, reviewer credentials, Data Safety/listing/rating/audience declarations, signing ownership, rollout approval and operational owners from the [release worklist](ANDROID_GOOGLE_PLAY_RELEASE_PLAN.md).

### Native artifact checks

With the approved AAB and Android tooling, use `bundletool dump manifest --bundle=APP.aab --module=base` to inspect the final manifest. Inspect `bundletool dump config --bundle=APP.aab` for page alignment. For a delivered APK use `apksigner verify --print-certs APP.apk` and `zipalign -c -P 16 -v 4 APP.apk`; also check every shipped native ELF library with Android's alignment script and run the actual app on a 16 KB device. ZIP alignment alone does not establish ELF compatibility. Follow the current [Android 16 KB verification instructions](https://developer.android.com/guide/practices/page-sizes).

Record package ID, version code, signing certificate fingerprint, min/target SDK, exported components, merged permissions, backup settings, APK/AAB SHA-256, source commit, EAS build URL and results. The temporary iOS identifier used for generation is not a release identity and must never ship.

### Device acceptance record (all pending)

For each device record model, OS/API, page size, build/version, navigation mode, font scale, tester/date, result and evidence. Test both roles and two messaging sessions.

- Cold launch, relaunch, process death, signed upgrade and token recovery.
- Sign-in and valid/expired/used/wrong-email invitations.
- Keyboard/autofill and Back order: dismiss keyboard, then sheet/menu, then registration/navigation.
- Header, tabs, sheets and composer clear system bars in both navigation modes and device themes.
- Large font/TalkBack, small display, large/foldable resizing and permitted rotation.
- Dealer onboarding/profile/resources/classes/benefits/rebates/marketing; manager prospects/leads and role boundaries.
- Messages, typing/read state, report, block/unblock, connection loss and reconnection.
- HTTPS, phone/email links, missing handlers and return to app.
- Offline/timeout errors and retry without duplicate writes.
- Logout and deletion clear access/drafts; signed-out deletion requests and manager reassignment complete operationally.
- Compatible update/recovery and incompatible-runtime rejection. Keep existing `appVersion` policy; bump the app version before shipping changed native configuration if that runtime already has installed binaries.
- iPhone: launch/login, onboarding, sheets/keyboard, messages, links, logout/deletion.

Push notifications are not implemented by this change. Product owner must explicitly confirm whether background alerts are outside launch scope.

## Native launch attempt — September 27, 2026

Requested a real Android/iOS launch after source validation. Neither platform reached an app launch; the prior passing bundle/prebuild checks are not runtime acceptance.

- iOS: used an isolated copy with validation-only bundle ID and the iPhone 17 simulator (iOS 26.3). CocoaPods installed 117 pods. Xcode 26.3 compilation failed (exit 65) in expo-modules-jsi `RuntimeScheduler.h` at lines 53/61: `SWIFT_RETURNS_RETAINED` constructors rejected by the compiler. SDK 57's official minimum is Xcode 26.4. Update Xcode to a supported version and repeat the native build before changing dependency source to work around the older compiler.
- Android: initial launch failed with missing SDK path and `spawn adb ENOENT`. Installed Android command-line tools and downloaded a portable Java 17 runtime. SDK/emulator packages are not yet installed; acceptance of Google's SDK license was requested and remains pending. No Android binary or emulator launch was completed.
- Setup capacity: approximately 7.6 GB remained after the iOS build attempt. Check available space before installing another Xcode/runtime and Android emulator/build dependencies.
- Logs: `/tmp/hercules-ios-launch.log` and `/tmp/hercules-android-launch.log`. Build took place outside release source. Production identifiers and app code were not changed during this attempt.

Reference: https://docs.expo.dev/versions/v57.0.0/ (SDK/toolchain compatibility table).

## Successful runtime launch follow-up — September 27, 2026

Both platforms now run the current app in **Expo Go 57.0.9**. This supersedes the earlier “neither platform launched” status for development-runtime checks only; the separate standalone iOS compile failure remains unresolved.

- iPhone 16 / iOS 18.1: visually verified existing-session restoration, dealer home, training, conversation list, message history, and Review Terms navigation after closing the chat sheet. Returned to home successfully. Did not accept legal terms or send messages.
- Android 16 / API 36: installed a dedicated ARM64 Android emulator and matching Expo Go; verified the app renders its sign-in form. Initial Expo Go developer-menu onboarding remains visible. No ReactNativeJS or AndroidRuntime error was recorded in the post-launch check. Android sign-in and Back/keyboard interactions remain unverified pending authorization to use ADB input because the desktop UI controller cannot attach to the emulator executable.
- Fixed local testing connectivity by using Expo's LAN listener: localhost-only mode bound to IPv6 while the simulator attempted IPv4. Android reaches Metro through an ADB reverse mapping for port 8081. No production app code change was required.
- Reclaimed only temporary install copies, temporary generated native projects, and derived build output created during this task. Replaced the oversized Google APIs image with an AOSP Android 16 image. Personal files were not removed.
- Requested approval for an isolated, simulator-only build on the existing Expo project to use its supported Xcode toolchain. Automatic approval review rejected the source upload pending explicit user authorization. No cloud build was submitted and no source was uploaded.

Evidence: [iPhone home screenshot](validation/ios-runtime.png), [Android sign-in screenshot](validation/android-runtime.png). Both development sessions were left running. This proves the observed runtime screens only, not full feature parity, production signing, store readiness, custom native plugin behavior, or latest-OS compatibility.

## Phone-shaped Android preview

Configured the existing Android 16 emulator with Google's official Pixel 7 skin from Android Studio's `artwork/resources/device-art-resources/pixel_7` source archive. The running emulator uses `-skin pixel_7` and the persisted skin path under `~/.android/skins/pixel_7`. Enabled the system's hole-camera cutout overlay, gesture-navigation overlay, and battery-percentage setting. Kept the 1080×2400 Pixel 7 display at 420 dpi and preserved existing emulator app data.

The app restored its Android dealer session and rendered Home after restart. Expo Go's developer onboarding panel remains over the app; Continue dismisses that panel for an unobstructed preview. The outer frame/mask belongs to the desktop emulator and is not included in ADB device-only screenshots. These are preview-device settings only: no iOS or Android application source was changed.
