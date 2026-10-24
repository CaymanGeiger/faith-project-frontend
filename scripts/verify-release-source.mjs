import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const loadJson = (name) =>
  JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));

const packageJson = loadJson('package.json');
const appJson = loadJson('app.json');
const easJson = loadJson('eas.json');
const expo = appJson.expo ?? {};
const projectId = 'd41a427b-e738-4eda-9da3-03722c2bbc45';
const expectedUpdatesUrl = `https://u.expo.dev/${projectId}`;
const failures = [];

if (basename(projectRoot) !== 'frontend') {
  failures.push(`run this only from the approved frontend release source, not ${projectRoot}`);
}
if (packageJson.name !== 'frontend') {
  failures.push('package.json must identify the approved frontend release source');
}
if (expo.slug !== 'hercules-honors-rewards') {
  failures.push('app.json must retain the Hercules Honors Rewards Expo slug');
}
if (expo.owner !== 'caymangeigers-team') {
  failures.push('app.json must retain the approved Expo owner');
}
if (expo.extra?.eas?.projectId !== projectId) {
  failures.push('app.json EAS projectId does not match the approved Hercules project');
}
if (expo.updates?.url !== expectedUpdatesUrl) {
  failures.push('app.json updates URL does not match the approved Hercules EAS project');
}
if (expo.runtimeVersion?.policy !== 'appVersion') {
  failures.push('app.json must use runtimeVersion policy appVersion for EAS Update compatibility');
}
if (easJson.cli?.appVersionSource !== 'remote') {
  failures.push('eas.json must use EAS remote app-version management');
}
if (easJson.cli?.requireCommit !== true) {
  failures.push('eas.json must require a committed release source before native builds');
}

const requiredProfiles = [
  ['internal', 'internal'],
  ['preview', 'preview'],
  ['production', 'production'],
];
for (const [profileName, channel] of requiredProfiles) {
  const profile = easJson.build?.[profileName];
  if (!profile) {
    failures.push(`eas.json is missing the ${profileName} build profile`);
  } else if (profile.channel !== channel) {
    failures.push(`${profileName} builds must target the ${channel} EAS Update channel`);
  }
}

if (easJson.build?.preview?.distribution !== 'internal') {
  failures.push('preview builds must remain internally distributed');
}
for (const profileName of ['internal', 'preview', 'production']) {
  const environment = profileName === 'production' ? 'production' : 'preview';
  const enabled = environment === 'production' ? 'false' : 'true';
  const profile = easJson.build?.[profileName];
  if (profile?.environment !== environment || profile.env?.EXPO_PUBLIC_APP_ENV !== environment) {
    failures.push(`${profileName} builds must select the EAS ${environment} environment and EXPO_PUBLIC_APP_ENV=${environment}`);
  }
  for (const flag of ['EXPO_PUBLIC_DEV_FEATURES_ENABLED', 'EXPO_PUBLIC_DEV_TRAINING_TOGGLE']) {
    if (profile?.env?.[flag] !== enabled) {
      failures.push(`${profileName} builds must set ${flag}=${enabled}`);
    }
  }
}
if (easJson.build?.production?.distribution !== 'store') {
  failures.push('production builds must remain store-distributed');
}

if (failures.length > 0) {
  throw new Error(`Release-source verification failed:\n- ${failures.join('\n- ')}`);
}

console.log(`Verified approved release source: ${expo.owner}/${expo.slug} (${projectId}).`);
