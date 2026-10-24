export function validateDeploymentEnvironment(env, environment) {
  if (!['preview', 'production'].includes(environment)) {
    throw new Error('Deployment environment must be preview or production.');
  }
  if (env.EXPO_PUBLIC_APP_ENV !== environment) {
    throw new Error(`${environment} deployments require EXPO_PUBLIC_APP_ENV=${environment}.`);
  }
  const expected = environment === 'production' ? 'false' : 'true';
  for (const name of ['EXPO_PUBLIC_DEV_FEATURES_ENABLED', 'EXPO_PUBLIC_DEV_TRAINING_TOGGLE']) {
    if (env[name] !== expected) {
      throw new Error(`${environment} deployments require ${name}=${expected}.`);
    }
  }
}
