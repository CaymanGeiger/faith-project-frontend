import { isIP } from 'node:net';
import { validateDeploymentEnvironment } from './deployment-config.mjs';

export function requestedPlatform(args, env = {}) {
  let platform;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--platform' && platform === undefined) {
      platform = args[++index];
      if (!platform) throw new Error('--platform requires android, ios, or all.');
    } else {
      throw new Error(`Unknown store-config argument: ${arg}`);
    }
  }
  const selected = platform ?? env.EAS_BUILD_PLATFORM ?? 'all';
  if (!['android', 'ios', 'all'].includes(selected)) {
    throw new Error('Store configuration platform must be android, ios, or all.');
  }
  if (platform && env.EAS_BUILD_PLATFORM && platform !== env.EAS_BUILD_PLATFORM) {
    throw new Error('Requested platform conflicts with EAS_BUILD_PLATFORM.');
  }
  return selected;
}

function validIdentifier(value, platform) {
  if (typeof value !== 'string' || value !== value.trim()) return false;
  const pattern = platform === 'android'
    ? /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/
    : /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
  return pattern.test(value) && !/(^|\.)(placeholder|example|test)(\.|$)/i.test(value);
}

export function isPublicEndpoint(value, protocols) {
  if (typeof value !== 'string' || value !== value.trim()) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    // Public release endpoints must use DNS names; this also excludes emulator,
    // loopback, private IPv4/IPv6 and link-local addresses without logging values.
    return protocols.includes(url.protocol) && !url.username && !url.password &&
      !url.search && !url.hash && host.includes('.') && !isIP(host) &&
      !host.includes(':') && !/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host) &&
      !/(^|\.)example\.(com|net|org)$/.test(host);
  } catch {
    return false;
  }
}

export function validateStoreConfig(expo, env, platform) {
  const platforms = platform === 'all' ? ['ios', 'android'] : [platform];
  const identifiers = platforms.map((name) => [
    name === 'ios' ? 'ios.bundleIdentifier' : 'android.package',
    name === 'ios' ? expo.ios?.bundleIdentifier : expo.android?.package,
    name,
  ]);
  const invalid = identifiers.filter(([, value, name]) => !validIdentifier(value, name));
  if (invalid.length) {
    throw new Error(`Store builds are blocked: set company-owned ${invalid.map(([name]) => name).join(' and ')} in app.json. Identifiers must be valid and must not be placeholders.`);
  }

  // All distributed builds must be usable on real phones. Testing builds use
  // the preview environment; store builds use the production environment.
  if (['production', 'preview', 'internal'].includes(env.EAS_BUILD_PROFILE)) {
    validateDeploymentEnvironment(env, env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'preview');
    const endpoints = [
      ['EXPO_PUBLIC_API_URL', ['https:']],
      ['EXPO_PUBLIC_WS_URL', ['https:', 'wss:']],
    ];
    const invalidEndpoints = endpoints.filter(([name, protocols]) => !isPublicEndpoint(env[name], protocols));
    if (invalidEndpoints.length) {
      throw new Error(`Release builds are blocked: configure ${invalidEndpoints.map(([name]) => name).join(' and ')} as public HTTPS/WSS DNS endpoints without credentials, query strings or fragments in the selected EAS environment.`);
    }
  }
  return identifiers.map(([name, value]) => `${name}: ${value}`).join('; ');
}
