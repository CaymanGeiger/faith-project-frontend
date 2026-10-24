import { readFileSync } from 'node:fs';
import { requestedPlatform, validateStoreConfig } from './store-config.mjs';

const appConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const platform = requestedPlatform(process.argv.slice(2), process.env);
const result = validateStoreConfig(appConfig.expo ?? {}, process.env, platform);
console.log(`Verified native identifiers (${platform}): ${result}.`);
