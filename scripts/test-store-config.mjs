import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestedPlatform, validateStoreConfig } from './store-config.mjs';

const ios = { bundleIdentifier: 'com.hercules.rewards' };
const android = { package: 'com.hercules.rewards' };
const env = {
  EAS_BUILD_PROFILE: 'production',
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_DEV_FEATURES_ENABLED: 'false',
  EXPO_PUBLIC_DEV_TRAINING_TOGGLE: 'false',
  EXPO_PUBLIC_API_URL: 'https://api.herculesrewards.com',
  EXPO_PUBLIC_WS_URL: 'wss://api.herculesrewards.com/messaging',
};
const previewEnv = { ...env, EXPO_PUBLIC_APP_ENV: 'preview', EXPO_PUBLIC_DEV_FEATURES_ENABLED: 'true', EXPO_PUBLIC_DEV_TRAINING_TOGGLE: 'true' };

test('Android-only builds do not require an iOS identifier', () => {
  assert.match(validateStoreConfig({ android }, env, 'android'), /android.package/);
});
test('iOS-only builds do not require an Android identifier', () => {
  assert.match(validateStoreConfig({ ios }, env, 'ios'), /ios.bundleIdentifier/);
});
test('all-platform builds require both identifiers', () => {
  assert.doesNotThrow(() => validateStoreConfig({ ios, android }, env, 'all'));
  assert.throws(() => validateStoreConfig({ ios }, env, 'all'), /android.package/);
  assert.throws(() => validateStoreConfig({ android }, env, 'all'), /ios.bundleIdentifier/);
});
test('missing, malformed and placeholder identifiers fail', () => {
  for (const value of [undefined, '', ' com.hercules.rewards', 'com.placeholder.appid', 'com.example.app', 'app', 'com.123app', 'com.bad-id.app']) {
    assert.throws(() => validateStoreConfig({ android: { package: value } }, env, 'android'), /android.package/);
  }
  assert.throws(() => validateStoreConfig({ ios: { bundleIdentifier: 'com.bad_id.app' } }, env, 'ios'), /ios.bundleIdentifier/);
  assert.doesNotThrow(() => validateStoreConfig({ ios: { bundleIdentifier: 'com.hercules.rewards-app' } }, env, 'ios'));
});
test('explicit platform, EAS worker platform, and safe default', () => {
  assert.equal(requestedPlatform([], {}), 'all');
  assert.equal(requestedPlatform([], { EAS_BUILD_PLATFORM: 'android' }), 'android');
  assert.equal(requestedPlatform(['--platform', 'ios']), 'ios');
  for (const args of [['--platform'], ['--platform', 'web'], ['--platfrm', 'android'], ['--platform', 'android', '--platform', 'ios']]) {
    assert.throws(() => requestedPlatform(args));
  }
  assert.throws(() => requestedPlatform([], { EAS_BUILD_PLATFORM: 'web' }));
  assert.throws(() => requestedPlatform(['--platform', 'android'], { EAS_BUILD_PLATFORM: 'ios' }));
});
test('distributed testing and production builds reject unusable endpoints for either platform', () => {
  for (const profile of ['production', 'preview', 'internal']) {
    for (const platform of ['android', 'ios', 'all']) {
      for (const name of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WS_URL']) {
        for (const value of [undefined, '', 'http://api.herculesrewards.com', 'https://localhost', 'https://localhost.', 'https://127.0.0.1', 'https://10.0.2.2', 'https://192.168.1.2', 'https://[::1]', 'https://[::ffff:127.0.0.1]', 'https://api.local', 'https://api.example.com', 'https://api.test', 'https://user:secret@api.herculesrewards.com', 'https://api.herculesrewards.com?token=secret', 'https://api.herculesrewards.com#fragment']) {
          assert.throws(() => validateStoreConfig({ ios, android }, { ...(profile === 'production' ? env : previewEnv), EAS_BUILD_PROFILE: profile, [name]: value }, platform), new RegExp(name));
        }
      }
    }
  }
});
test('API requires HTTPS; socket accepts HTTPS or WSS and namespace path', () => {
  assert.throws(() => validateStoreConfig({ android }, { ...env, EXPO_PUBLIC_API_URL: 'wss://api.herculesrewards.com' }, 'android'));
  assert.doesNotThrow(() => validateStoreConfig({ android }, { ...env, EXPO_PUBLIC_WS_URL: 'https://api.herculesrewards.com/messaging' }, 'android'));
});
test('internal testing builds require reachable endpoints and retain their app identity', () => {
  assert.doesNotThrow(() => validateStoreConfig({ android }, { ...previewEnv, EAS_BUILD_PROFILE: 'internal' }, 'android'));
  assert.throws(() => validateStoreConfig({ android }, { ...previewEnv, EAS_BUILD_PROFILE: 'internal', EXPO_PUBLIC_API_URL: undefined }, 'android'), /EXPO_PUBLIC_API_URL/);
  assert.throws(() => validateStoreConfig({}, { EAS_BUILD_PROFILE: 'internal' }, 'android'));
});
test('testing profiles reject production environment selection or disabled testing controls', () => {
  for (const profile of ['preview', 'internal']) {
    assert.throws(() => validateStoreConfig({ android }, { ...env, EAS_BUILD_PROFILE: profile }, 'android'), /EXPO_PUBLIC_APP_ENV/);
    for (const name of ['EXPO_PUBLIC_DEV_FEATURES_ENABLED', 'EXPO_PUBLIC_DEV_TRAINING_TOGGLE']) {
      assert.throws(() => validateStoreConfig({ android }, { ...previewEnv, EAS_BUILD_PROFILE: profile, [name]: 'false' }, 'android'), new RegExp(name));
    }
  }
});
test('production rejects testing environment selection and any non-false development flag', () => {
  for (const value of [undefined, '', 'development', 'preview', 'PRODUCTION']) {
    assert.throws(() => validateStoreConfig({ android }, { ...env, EXPO_PUBLIC_APP_ENV: value }, 'android'), /EXPO_PUBLIC_APP_ENV/);
  }
  for (const name of ['EXPO_PUBLIC_DEV_FEATURES_ENABLED', 'EXPO_PUBLIC_DEV_TRAINING_TOGGLE']) {
    for (const value of [undefined, '', 'true', 'FALSE', '0']) {
      assert.throws(() => validateStoreConfig({ android }, { ...env, [name]: value }, 'android'), new RegExp(name));
    }
  }
});
test('failure messages never echo endpoint credentials', () => {
  assert.throws(() => validateStoreConfig({ android }, { ...env, EXPO_PUBLIC_API_URL: 'https://private-secret@api.herculesrewards.com' }, 'android'), (error) => !error.message.includes('private-secret'));
});
