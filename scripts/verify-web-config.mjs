import { validateDeploymentEnvironment } from './deployment-config.mjs';

if (!process.env.VERCEL) {
  console.log('Skipping deployed-web endpoint validation outside Vercel.');
  process.exit(0);
}

if (process.env.VERCEL_ENV === 'production') {
  validateDeploymentEnvironment(process.env, 'production');
}

const endpoints = [
  ['EXPO_PUBLIC_API_URL', ['https:']],
  ['EXPO_PUBLIC_WS_URL', ['https:', 'wss:']],
];
const invalidEndpoints = endpoints.filter(([name, protocols]) => {
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
});

if (invalidEndpoints.length > 0) {
  throw new Error(
    `Vercel deployment is blocked: configure ${invalidEndpoints
      .map(([name]) => name)
      .join(' and ')} as non-local HTTPS/WSS project environment variables.`,
  );
}

console.log('Verified deployed-web API and messaging endpoints.');
