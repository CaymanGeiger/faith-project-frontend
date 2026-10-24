# Expo SDK 58 preview

The testing app targets Expo Go 58.0.0. SDK 57 updates cannot open in that client.
The SDK 58 dependency set uses React Native 0.88, React 19.3, Reanimated 4.7.1,
and Worklets 0.13.0. App version/runtime `1.0.4` separates it from the SDK 57
`1.0.3` runtime. Existing standalone binaries need a new native build before
they can receive this runtime; the preview can open in Expo Go 58.

The upgrade preserves the explicit preview/production environment contract in
[release operations](RELEASE_OPERATIONS.md). Preview demo logins and synthetic
dealer training controls remain enabled. Production, missing, and unknown
environments disable them regardless of the flag values.

SDK 58 migration changes:

- Tab resets preserve complete navigator state and its route-key sequence.
  Regression coverage exercises the installed router reducer, ordinary Back,
  tab reselection, fresh screen keys, and preloaded routes.
- Native refs use the React Native strict instance types. The lazy WebView uses
  a neutral extra-props generic to preserve prop checking with WebView 14.
- Web safe-area spacing uses browser CSS insets without adding a measuring
  provider during Router hydration; native platforms retain their provider.
- The obsolete iOS scene-support opt-in is removed; SDK 58 generates scene
  support. Generated native directories remain ignored and were absent during
  this upgrade.
- SDK 58 removed the query-string dependency, so the unused vendored decoder
  bridge and its consumer test were removed. The Xcode/ngrok UUID override and
  its integration test remain.

Expo Doctor reports 20/20 checks passing. The same-day dependency audit improved
from 14 to 11 package findings, eliminating the critical finding. Existing
upstream findings remain in node-forge, Zod 3, and the Tailwind 3 selector parser;
there is no verified compatible lock-only fix. Do not apply npm's suggested
SDK downgrades or unrelated major upgrades to silence those findings.

References: [SDK 58 release notes](https://expo.dev/changelog/sdk-58),
[versioned SDK reference](https://docs.expo.dev/versions/v58.0.0/),
[Router migration](https://docs.expo.dev/router/migrate/sdk-57-to-58/).
