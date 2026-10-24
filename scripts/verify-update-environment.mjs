import { validateDeploymentEnvironment } from './deployment-config.mjs';
import { isPublicEndpoint } from './store-config.mjs';

const [environment, ...extraArgs] = process.argv.slice(2);
if (extraArgs.length) throw new Error('Expected one deployment environment.');
validateDeploymentEnvironment(process.env, environment);
for (const [name, protocols] of [
  ['EXPO_PUBLIC_API_URL', ['https:']],
  ['EXPO_PUBLIC_WS_URL', ['https:', 'wss:']],
]) {
  if (!isPublicEndpoint(process.env[name], protocols)) {
    throw new Error(`${environment} updates require a public HTTPS/WSS endpoint for ${name}.`);
  }
}
console.log(`Verified ${environment} update environment and endpoints.`);
