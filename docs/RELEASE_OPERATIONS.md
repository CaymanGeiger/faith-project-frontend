# Hercules Honors Rewards release operations

This repository's `frontend/` directory is the only approved Expo/EAS release source. Do not run EAS build or update commands from `../hercules-honors-rewards`; it is a retired scaffold with release commands intentionally blocked.

## What is automated

GitHub Actions runs the **Quality gate** for pull requests and pushes to `main`. It installs the locked dependency set, confirms that this is the approved Expo project, typechecks the app, and exports the web bundle. The workflow intentionally does **not** build a binary, submit to a store, or publish an EAS update.

`eas.json` now requires a committed source tree before native builds. That avoids binaries made from untraceable local changes. It has three explicit channels:

| Profile | Audience | Distribution | EAS Update channel |
| --- | --- | --- | --- |
| `internal` | Developer use | Internal | `internal` |
| `preview` | Stakeholder/device review | Internal | `preview` |
| `production` | Store release | Store | `production` |

The `preview` and `production` profiles use the EAS `production` environment so review builds use the same approved remote endpoints as a release build. Build profiles do not create a new app or change any native identifier.

## Every pull request

```sh
cd frontend
npm ci
npm run check
```

Fix any failure before merging. This command deliberately does not need production credentials and does not publish anything.

## Before creating a native build

These are one-time business prerequisites, not values to guess:

- Set the company-owned `ios.bundleIdentifier` and `android.package` in `app.json`.
- Configure non-local `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` in the EAS `production` environment.
- Confirm the API is healthy and its database migrations are deployed.
- Confirm that the app is committed and the Quality gate is green.
- Confirm the destination: `preview` for stakeholder distribution, or `production` for a store candidate.

Run the production guard with the EAS production environment values available to the command:

```sh
cd frontend
npx eas-cli@latest env:exec --environment production -- npm run release:preflight
```

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
npx eas-cli@latest update --channel preview --message "Describe the reviewed change"
```

Use `production` in place of `preview` only after a final device check and release approval. Capture the EAS build/update URL, commit SHA, channel, and reviewer in the release notes.

## Rollback

For an EAS Update regression, first stop sharing the affected update. Republish the last known-good compatible update to the same channel, then verify it on a device. For a native-binary issue, remove or pause the store release in App Store Connect/Google Play Console and create a corrected build; an over-the-air update cannot repair native changes.

## GitHub setup

No Expo token is required for the Quality gate. If the team later wants GitHub to publish EAS Updates, protect that workflow with a GitHub Environment and add a least-privilege `EXPO_TOKEN` repository/environment secret. Keep publishing manual until the release owner explicitly approves that automation.
