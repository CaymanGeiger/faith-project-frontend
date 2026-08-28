import { readFileSync } from 'node:fs';

const appConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url)));
const expo = appConfig.expo ?? {};
const identifiers = [
  ['ios.bundleIdentifier', expo.ios?.bundleIdentifier],
  ['android.package', expo.android?.package],
];

const invalidIdentifiers = identifiers.filter(
  ([, value]) =>
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value === 'com.placeholder.appid',
);

if (invalidIdentifiers.length > 0) {
  const names = invalidIdentifiers.map(([name]) => name).join(' and ');
  throw new Error(
    `Store builds are blocked: set company-owned ${names} in app.json before creating an EAS native build. ` +
      'Do not use com.placeholder.appid or a personal developer identifier.',
  );
}

if (process.env.EAS_BUILD_PROFILE === 'production') {
  const productionEndpoints = [
    ['EXPO_PUBLIC_API_URL', ['https:']],
    ['EXPO_PUBLIC_WS_URL', ['https:', 'wss:']],
  ];
  const invalidEndpoints = productionEndpoints.filter(
    ([name, protocols]) => {
      const value = process.env[name];
      if (!value) {
        return true;
      }
      try {
        const parsed = new URL(value);
        return (
          !protocols.includes(parsed.protocol) ||
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname === '::1'
        );
      } catch {
        return true;
      }
    },
  );

  if (invalidEndpoints.length > 0) {
    throw new Error(
      `Production EAS builds are blocked: configure ${invalidEndpoints
        .map(([name]) => name)
        .join(' and ')} as non-local HTTPS/WSS endpoints in the EAS production environment.`,
    );
  }
}

console.log(
  `Verified native identifiers: iOS ${expo.ios.bundleIdentifier}; Android ${expo.android.package}.`,
);
