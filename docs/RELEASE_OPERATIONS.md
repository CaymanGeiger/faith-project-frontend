# Hercules Honors Rewards release operations

For Android release prerequisites, current official guidance, device acceptance tests and Play Console setup, use the [Android and Google Play release worklist](ANDROID_GOOGLE_PLAY_RELEASE_PLAN.md), reviewed September 27, 2026.

This repository's `frontend/` directory is the only approved Expo/EAS release source. Do not run EAS build or update commands from `../hercules-honors-rewards`; it is a retired scaffold with release commands intentionally blocked.

## What is automated

GitHub Actions runs the **Quality gate** for pull requests and pushes to `main`. It installs the locked dependency set, confirms that this is the approved Expo project, runs the store-guard, Android launcher-plugin, API-client and runtime-recovery tests, typechecks the app, and exports Android, iOS and web bundles. The workflow intentionally does **not** build a binary, submit to a store, or publish an EAS update.

`eas.json` now requires a committed source tree before native builds. That avoids binaries made from untraceable local changes. It has three explicit channels:

| Profile | Audience | Distribution | EAS Update channel |
| --- | --- | --- | --- |
| `internal` | Developer use | Internal | `internal` |
| `preview` | Stakeholder/device review | Internal | `preview` |
| `production` | Store release | Store | `production` |

The `internal` and `preview` profiles use the EAS `preview` environment for Expo testing. The `production` profile uses the EAS `production` environment for store releases. Configure reachable API/socket endpoints separately in each environment. Build profiles do not create a new app or change any native identifier.

## Development-only controls

`EXPO_PUBLIC_APP_ENV` identifies the deployment environment. Demo login buttons,
demo invitation prefill, and the training control require an exact `development`
or `preview` value plus `EXPO_PUBLIC_DEV_FEATURES_ENABLED=true`. Missing, unknown,
and `production` environments always hide the controls, even when a flag is true.
Expo updates use release-mode JavaScript, so `__DEV__` and `NODE_ENV` are not used
to decide whether an Expo testing update shows these controls.

| EAS environment | `EXPO_PUBLIC_APP_ENV` | `EXPO_PUBLIC_DEV_FEATURES_ENABLED` | `EXPO_PUBLIC_DEV_TRAINING_TOGGLE` |
| --- | --- | --- | --- |
| `development` | `development` | `true` | `true` |
| `preview` | `preview` | `true` | `true` |
| `production` | `production` | `false` | `false` |

The internal/preview build profiles explicitly set the testing values, and the
production profile explicitly sets the production values. The production build
guard rejects a testing APP_ENV, enabled flags, or omitted flags. Production
Vercel exports apply the same guard. Local developers
can opt in using their ignored `.env.local`; `.env.example` keeps both flags false.

The training control additionally needs `EXPO_PUBLIC_DEV_TRAINING_TOGGLE=true`.
In hosted preview the training control is shown only for synthetic dealer
accounts under `hercules.local`, matching the API's account restriction. Local
development retains the existing disposable-database workflow.
The API independently enforces the backend testing environment, feature flags,
and database restrictions. The public client flags do not grant server access.
See the backend's verified-onboarding documentation for its deployment contract.

Expo embeds public variables at bundle time. After changing them, reload a local
app or publish a newly verified bundle with the explicit EAS environment; changing
an EAS variable alone does not modify an update already installed on a phone.

## Every pull request

```sh
cd frontend
nvm use
npm ci
npm run check
```

Fix any failure before merging. This command deliberately does not need production credentials and does not publish anything.

## Before creating a native build

These are one-time business prerequisites, not values to guess:

- Set the company-owned identifier for the requested platform in `app.json`: `android.package` for Android, `ios.bundleIdentifier` for iOS. Both are required for an all-platform build. Never replace an existing store identifier.
- Configure non-local `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` in the selected EAS environment, along with the app-environment and feature values above.
- Confirm the API is healthy and its database migrations are deployed.
- Confirm that the app is committed and the Quality gate is green.
- Confirm the destination: `preview` for stakeholder distribution, or `production` for a store candidate.

Run the production guard with the EAS production environment values available to the command:

```sh
cd frontend
npx eas-cli@latest env:exec production 'npm run release:preflight'
```

For an Android-only candidate use `npm run release:preflight:android` in the same EAS environment; use `npm run release:preflight:ios` for iOS. The EAS worker hook reads `EAS_BUILD_PLATFORM` automatically; a local guard without a platform checks both. Internal/preview builds require public endpoints from the preview environment so testers can connect from their phones.

That check intentionally stops if native identifiers are placeholders or endpoints are absent, local, or insecure. Do not bypass it.

## Build and update commands

All commands below must be run from `frontend/` after the preflight passes.

Create an installable stakeholder build:

```sh
npx eas-cli@latest build --profile preview --platform all
```

Create store artifacts only after the release checklist has been approved:

```sh
npx eas-cli@latest build --profile production --platform all
```

Publish a JavaScript-only update only when it is compatible with the installed binary's runtime version and channel. An EAS Update does not change native code, permissions, app icons, native identifiers, or SDK version.

```sh
npm run eas:update:preview -- --message "Describe the reviewed change"
```

The script validates the selected remote environment's feature values and public
endpoints, clears Metro's transform cache, then selects both `--channel preview`
and `--environment preview`. Clearing the cache prevents an export from reusing
public environment constants from a previous environment. For a
production update use `npm run eas:update:production -- --message "Describe the reviewed change"`,
which selects the production channel and environment. Do not publish a preview
bundle to the production channel. Capture the EAS build/update URL, commit SHA,
channel, environment, and reviewer in the release notes.

## Rollback

For an EAS Update regression, first stop sharing the affected update. Republish the last known-good compatible update to the same channel, then verify it on a device. For a native-binary issue, remove or pause the store release in App Store Connect/Google Play Console and create a corrected build; an over-the-air update cannot repair native changes.

## GitHub setup

No Expo token is required for the Quality gate. If the team later wants GitHub to publish EAS Updates, protect that workflow with a GitHub Environment and add a least-privilege `EXPO_TOKEN` repository/environment secret. Keep publishing manual until the release owner explicitly approves that automation.

## Android implementation and acceptance evidence

See [Android engineering validation](ANDROID_ENGINEERING_VALIDATION.md) for this change's results, remaining release blockers, and the native/device acceptance record. Node 24.19.0 is pinned for local checks, CI and Android EAS workers. Existing iOS EAS build-profile settings are preserved; shared SDK patches and iOS scene support require a fresh native iPhone build. Android internal/preview profiles explicitly produce APKs; production produces an AAB. Remote version codes and the internal-track draft submission remain enabled.

Launcher assets reuse the existing Hercules icon and transparent mark. The Android-only `withAndroidLauncherInsets.cjs` plugin gives adaptive and themed icons safe margins during every prebuild; source images and Apple artwork are unchanged. Generated native projects remain ignored.

The shared `appVersion` runtime policy is preserved. Before shipping this native configuration, compare the installed build's runtime; increment `expo.version` if that runtime has already shipped with different native configuration. Never send native/config changes as an OTA-only update. Record the old and new runtime in the release evidence. For updates, explicitly select the environment matching the reviewed channel using the scripts above.

The current source version is `1.0.4`, creating a separate app-version runtime for Expo SDK 58 / React Native 0.88. Expo Go 58 can open the SDK 58 preview; existing SDK 57 standalone builds require a new native build and cannot use this runtime. Android source identity is `com.herculesindustries.honorsrewards`; store registration is still pending. Recover the existing Apple bundle ID from the company App Store Connect account before setting `ios.bundleIdentifier`. The current SDK supports iOS 16.4 and later; older iOS 15.1–16.3 devices cannot receive this version.


See [September 28 release fixes](RELEASE_FIXES_2026-09-28.md) and [backend rollout, privacy and worker operations](../../backend/docs/release-fix-operations.md) for the additive migrations, identity review, first-manager bootstrap and current verification status.
