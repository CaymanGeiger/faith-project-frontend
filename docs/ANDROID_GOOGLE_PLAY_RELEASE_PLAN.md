# Hercules Honors Rewards — Android and Google Play release worklist

Research and source review: September 27, 2026. Release source: `frontend/`.

## Engineering follow-up

See [Android engineering validation](ANDROID_ENGINEERING_VALIDATION.md) for the implemented platform-aware guard, native launcher/layout changes, cross-platform CI checks, validation results and remaining blockers. The audit below is historical context; the follow-up records the subsequent implementation.

## Release status

The shared Expo/React Native application has an Android foundation, but the current source cannot yet produce an approved store candidate. Android and iOS identifiers are absent and the native build guard rejects both. A successful Android JavaScript export and TypeScript check were observed during this conversation; neither proves native compilation, installation, or device functionality.

This document records unfinished engineering work, business decisions, and verification tasks. “Unverified” means evidence was not available locally; it does not mean the work was never completed in an external account. EAS build history, signing credentials, deployed environments, and Play Console were not authenticated or audited. No release, account configuration, or app code was changed to produce this document.

Use this document for the Android release sequence. The older root-level store documents remain useful for shared business requirements, but their SDK and migration snapshots are outdated. Recheck time-sensitive policies and Console requirements immediately before submission.

## What is already present

| Area | Evidence in this checkout | Remaining limitation |
| --- | --- | --- |
| Shared application | Expo 57.0.20 / React Native 0.86.3; Android export and typecheck passed in the preceding audit | Native build and device QA still required |
| Android configuration | `app.json`: adaptive icons, disabled backup, blocked unused permissions, predictive back opt-out | Package ID missing; generated manifest and icon appearance unverified |
| Platform handling | Safe areas, Android keyboard events, native secure storage, external URL handling | Runtime behavior not validated on Android |
| Back handling | `ModalSheet` and header modal use `onRequestClose`; registration has a `BackHandler` | Verify dismissal order, registration history, gesture and button navigation |
| Builds and submission | `eas.json`: preview/internal distributions, store production profile, Android internal-track draft submission | Accounts, signing, build artifacts, and submission access unverified |
| Safety/product features | Legal pages, deletion paths, report/block messaging functions | Live operation and complete Android flows unverified |
| CI | `.github/workflows/quality.yml`: release-source check, TypeScript, web export | No Android export or native/device validation in current workflow |

Dependency alignment was checked only against Expo's local dependency map because that check ran offline. Do not treat it as an online Expo Doctor pass. The local Node version observed was 22.9.0; select a supported Node version for the SDK before release validation. Consult the [versioned Expo SDK reference](https://docs.expo.dev/versions/v57.0.0/).

## 1. Decide who can install the app

Owner: Hercules business owner and IT. Status: unresolved in the local decision sheet.

- [ ] Confirm whether dealers use Android Enterprise managed devices/work profiles, or ordinary personal phones with consumer Google accounts.
- [ ] Choose Managed Google Play private distribution only if the intended organizations can receive and distribute it through their enterprise management setup. Record enterprise organization IDs and test with a real intended dealer.
- [ ] If dealers need ordinary Play Store installation, choose a public listing with invitation-only application access and complete the public-app requirements. Invitation-only login does not make a store listing a Managed Google Play private app.
- [ ] Record future public-distribution intent before restricting the package to organizations. Google says a restricted private app needs a different package to become publicly available.
- [ ] Confirm the actual Play developer account type and Hercules-controlled ownership, verification, administrators, recovery access, and any Console-specific onboarding requirements.

The current internal-track draft in `eas.json` is a testing/upload destination; it does not configure enterprise restrictions or establish the final distribution model. See [Google's private-app publishing instructions](https://support.google.com/googleplay/android-developer/answer/9874937) and [enterprise distribution guidance](https://support.google.com/work/android/answer/10637198).

Completion evidence: written distribution decision, account owner, target audience, organization IDs where applicable, and successful installer-access test.

## 2. Configure identity, tooling, and build credentials

Owner: engineering with Hercules IT. Status: identifier blocker confirmed; credentials unverified.

- [ ] Assign the permanent company-approved `expo.android.package` in `app.json` and use that exact value in Play Console. Do not copy an example namespace without ownership approval.
- [ ] Resolve the guard's cross-platform dependency: either supply the approved `ios.bundleIdentifier` too, or change `scripts/verify-store-config.mjs` to validate the requested EAS platform. If changed, test Android-only, iOS-only, both-platform, missing-ID, and production-endpoint rejection cases. Do not simply remove the guard.
- [ ] Use a supported Node runtime locally and in EAS; run a locked install, online Expo dependency validation, and Expo Doctor. Review actionable native compatibility findings before building.
- [ ] Review and commit the existing SDK 57 upgrade and related app changes as a traceable candidate. `requireCommit: true` is already enabled; preserve it.
- [ ] Configure the Android upload keystore and Play App Signing. Record who controls the upload key, EAS credentials, and recovery process. The upload key and Play's app-signing key serve different purposes.
- [ ] Verify remote Android version-code management works. Existing `appVersionSource: remote` and production `autoIncrement: true` should produce increasing version codes; check the artifact and Console rather than adding an unrelated local counter.
- [ ] For EAS Submit, grant the Google service account the required app access and store its key in EAS credentials, outside Git. Missing JSON in the repo does not prove credentials are absent remotely.

Signing method: [Android app signing](https://developer.android.com/studio/publish/app-signing). EAS submission prerequisites: [Expo Android submission](https://docs.expo.dev/submit/android/).

Completion evidence: passing configuration guard, selected tool versions, clean candidate commit, credential ownership record, and a signed build linked to that commit.

## 3. Verify live services and current data handling

Owner: engineering and production operations. Status: unverified remotely.

- [ ] Verify `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` in the EAS production environment. They must be reachable HTTPS/WSS endpoints from a real phone on mobile data. These client variables are public; never place secrets in them.
- [ ] Confirm the API/socket endpoints in the EAS preview environment and its dedicated test accounts/data. Internal/preview profiles now select preview with `EXPO_PUBLIC_APP_ENV=preview`; production selects production and disables both development flags.
- [ ] Run production preflight with the EAS environment loaded. Then verify the endpoints actually embedded in the signed build; a `.env` file or web deployment does not prove EAS configuration.
- [ ] Inspect database migration status and deploy all pending migrations from the chosen backend commit. The old instruction to apply only three August migrations is insufficient: this checkout also contains `20260906000000_jotform_enterprise_integration`, plus the earlier baseline/resource migrations. Use `prisma migrate deploy` through `npm run db:deploy`, not a production seed or development schema reset.
- [ ] Verify backend configuration, database TLS, backup/restore ownership, authentication, role separation, socket reconnection, rate limiting, and monitored operations alerts.
- [ ] Verify the Jotform integration's intended production mode using `backend/docs/jotform-dealer-registration.md`. If enabled, test approved form mapping, webhook authentication, retries/reconciliation, duplicate handling, and the app's resulting dealer state. If disabled, ensure the user flow does not promise automatic synchronization.
- [ ] Refresh the data inventory against current behavior, including Jotform and any operational webhooks; the August inventory predates the new integration. Confirm what leaves the app/backend, recipients, purposes, retention, and deletion.
- [ ] Test the actual customer workflows and external services. Distinguish recorded preferences/local records from completed external submissions for training, equipment, marketing, and warranties.

Completion evidence: environment verification without exposed secrets, migration status, healthy services, test accounts for both roles, and a dated end-to-end test report.

## 4. Produce and inspect the native Android candidate

Owner: engineering. Status: not validated in this audit.

- [ ] Build an installable preview APK after the identity and service prerequisites pass. Test its native behavior outside Expo Go.
- [ ] Build the store AAB from the approved source and production environment. A JavaScript export is not this native build. EAS internal distribution produces installation artifacts; the store profile should produce an AAB. See [Expo build formats](https://docs.expo.dev/build-reference/apk/).
- [ ] Inspect the generated manifest/artifact for package ID, version code, minimum/target SDK, permissions, backup behavior, exported components, supported device configurations, and signing identity.
- [ ] Confirm target API against Google's current rule. At this review, ordinary new mobile app submissions require API 36 from August 31, 2026. Google's page documents a permanently private organizational-app exception; record applicability instead of assuming every dealer app qualifies. SDK 57 is expected to target API 36, but inspect the actual binary. [Google target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878).
- [ ] Verify native libraries and packaging support 16 KB memory pages. React Native and animation libraries include native code; bundle success alone cannot establish compatibility. Check the AAB/APKs using Android's prescribed alignment tools and exercise a 16 KB emulator/device. The retrieved Android guidance currently lists February 1, 2027 as its update enforcement date; recheck the live page and Console notices before release. Treat compatibility as an engineering acceptance test regardless of the deadline. [Android page-size guidance](https://developer.android.com/guide/practices/page-sizes).
- [ ] Inspect adaptive, themed/monochrome, launcher, and splash artwork on Android. Existing asset files do not prove correct Hercules branding or cropping on devices.
- [ ] Inspect merged permissions introduced by dependencies and remove unnecessary ones through supported Expo config/plugins. Preserve required networking. Do not add camera, location, contacts, storage, or notification permissions unless the product uses them.

Use Expo configuration/config plugins for repeatable native changes. If generated native projects are introduced, explicitly decide whether to manage them in Git; do not leave essential fixes only in disposable generated files. Native dependency/configuration changes require another binary and compatible EAS Update runtime handling.

Completion evidence: build URL, commit, package/version, signed AAB, manifest/permission review, 16 KB results, and installation proof.

## 5. Android behavior and device acceptance tests

Owner: engineering and dealer/manager testers. Status: open; fix failures found by these tests.

Test at least one physical Android phone, Android 16, an older supported OS, gesture and three-button navigation, a small screen, and a large/foldable/resizable configuration if distributed to those devices. Verify the minimum supported version against the generated binary. Include 16 KB testing from section 4.

| Test | Required result | Likely code to inspect if it fails |
| --- | --- | --- |
| Launch/relaunch/update | Correct branding, no blank screen, session recovery after process death and app update | Root layout, `BrandLaunchScreen`, `AuthProvider` |
| Sign in and invitations | Both roles work; used/expired/wrong-email invites fail cleanly | Auth routes/provider and backend auth |
| Android back | Keyboard dismisses appropriately; sheet/menu closes before leaving; registration/history behave correctly | `ModalSheet`, `AppHeader`, registration `BackHandler`, router layouts |
| Keyboard/forms | Inputs, errors and submit/send controls remain reachable with keyboard and autofill | Auth layout, Getting Started, message composer |
| System bars | Header, bottom navigation, sheets and controls clear status/navigation bars | Safe-area providers/layouts, `BottomNav`, `ModalSheet` |
| Resizing/accessibility | Usable at large font sizes, TalkBack navigation, large screens, rotation where the OS permits it | Shared components and screen layouts |
| Dealer workflows | Profile, onboarding, dealer status, resources, benefits, classes, rebates and marketing match saved backend state | Prospect routes and API client |
| Manager workflows | Correct prospects, leads and role-restricted data | Manager routes and backend authorization |
| Messaging | Send/receive, read/typing, report, block/unblock and reconnect work between two real sessions | Messaging components/hooks/socket and backend |
| External links | Browser, phone, email and intended forms open; returning resumes correctly; absent handlers fail clearly | `openExternalUrl`, class/resource links |
| Network interruption | Clear recoverable errors, no indefinite loading, no duplicated writes on retry | API client, sockets and mutation handlers |
| Deletion/logout | Tokens/drafts clear; deleted user loses access; public request and manager reassignment complete | Account actions, auth/draft storage and backend scripts |
| Update/runtime | Compatible update loads; incompatible native change uses a new build/runtime; failed update recovery documented | `runtimeVersion`, app version, EAS channels |

Android 16 enforces edge-to-edge for apps targeting API 36. Do not solve overlap by relying on an obsolete opt-out. Predictive back is explicitly disabled in the current Expo configuration; retain or change it based on tested navigation behavior and inspect the generated setting. Large-screen behavior also requires testing even though the app declares portrait orientation. See [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16).

Push notifications are not implemented simply because the app has an in-app notifications menu. If background push alerts are required for launch, scope delivery, credentials, permission/channel handling, tap routing and background-device testing separately. Otherwise record them as outside the release scope.

Completion evidence: device/OS/build matrix, recorded results, resolved defects, and a small iPhone regression pass for any shared-code fixes.

## 6. Complete the applicable Play Console requirements

Owner: release lead, marketing, legal and operations. Status: external completion unverified.

- [ ] Create/confirm the app record, package ownership, signing setup, countries/device availability, and final private/public distribution settings.
- [ ] Complete the listing fields and graphics requested for the chosen distribution route, with Android screenshots of the submitted build and authorized Hercules/LG branding.
- [ ] Publish permanent public privacy, terms and deletion pages; verify signed-out access and the live deletion request flow. Approve retention wording and staff the support/moderation/deletion processes.
- [ ] Supply reliable reviewer access for dealer and manager functionality, with reusable credentials/instructions that do not require a developer tunnel or a single-use invitation already consumed by testing.
- [ ] Complete content rating, target audience, ads and all declarations surfaced in the app's Console. Use actual released behavior.
- [ ] For public distribution, complete Data Safety from the refreshed data inventory, including SDKs and third-party integrations. Google currently exempts private apps and apps exclusively on internal testing from this form; an internal-track exemption does not carry forward to a public release. [Google Data Safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469).
- [ ] Validate account-deletion obligations for the chosen app and distribution. The implemented in-app and web paths need operational proof, not only links; identify any legitimate retained data and communicate it accurately. [Google account-deletion guidance](https://support.google.com/googleplay/android-developer/answer/13327111).
- [ ] Check whether the actual developer account has a production-access testing requirement. Google's 12-testers/14-continuous-days rule applies to specified new personal accounts, not automatically to every organization account. [Google personal-account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).
- [ ] Inspect Play's pre-launch reports and bundle warnings; resolve release blockers and review crashes, ANRs and accessibility findings. Supply testing access where needed.

Completion evidence: Console status/screenshots, accessible policy URLs, reviewer-access test, declarations and any required production-access approval.

## 7. Build, upload, test through Play, then release

These commands are a future runbook, not actions performed for this document. Run from `frontend/`; use the selected supported Node runtime. Pin a validated EAS CLI version in the release process if reproducibility requires it.

```sh
npm ci
npm run verify:release-source
npx expo install --check
npx expo-doctor
npm run typecheck
npm run test:client
npx expo export --platform android --output-dir /tmp/hercules-android-release-export
npx eas-cli@latest env:exec --environment production -- npm run release:preflight
```

Resolve failures and review/commit the candidate before the build. Do not run a blind dependency upgrade to make a warning disappear.

```sh
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile production
```

After build review and credential setup, submit the specific verified build, substituting its actual ID:

```sh
npx eas-cli@latest submit --platform android --profile production --id APPROVED_BUILD_ID
```

The current submit profile creates an internal-track draft. Complete that testing release in Play Console, configure testers, and install through Play to test Play's delivered/signed artifact as well as the preview APK. Record build ID, source commit, version code, track and test outcomes.

Current [Expo submission guidance](https://docs.expo.dev/submit/android/) supports a first internal-track submission through EAS after Console/service-account setup. A manual first upload is an alternative, not a universal requirement in that guidance. Check the actual account's response if it differs.

- [ ] Promote only after acceptance tests and applicable Console requirements pass. For Managed Google Play, verify enterprise targeting and installation from an intended work profile; an internal tester install alone is insufficient.
- [ ] Choose an appropriate rollout and monitoring owner. Watch Android crashes/ANRs, authentication, messages and support requests after release.
- [ ] Record recovery steps: halt a rollout where available, ship a corrected binary with a higher version code, or republish only a known-compatible EAS update for a JavaScript-only regression.
- [ ] Add Android export to CI so future web-only checks do not miss Android bundle failures. Keep native candidate/device validation as a separate release gate.

## Completion record

| Milestone | Owner | Status / evidence / date |
| --- | --- | --- |
| Distribution and account decision | Hercules business/IT | Open |
| IDs, supported tooling and signing | Engineering/IT | Blocked: identifiers absent |
| Live services, migrations and data inventory | Engineering/operations | Unverified |
| Signed APK/AAB and compatibility | Engineering | Unverified |
| Android device tests and shared-code regression | Engineering/testers | Open |
| Console/listing/policies and review access | Release/marketing/legal | Unverified |
| Play-installed acceptance test | Release/testers | Open |
| Production rollout and monitoring handoff | Release/operations | Open |

Release is complete when an intended dealer can install through the selected Google Play route, use the approved workflows against live services, and receive future signed updates, with recorded QA and operational ownership. A build file or successful upload alone does not close this worklist.
