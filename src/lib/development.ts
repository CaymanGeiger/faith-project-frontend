// Expo testing updates use release-mode JavaScript too. Select the deployment
// environment explicitly instead of using __DEV__ to identify a testing app.
// Missing, unknown and production environments always keep these tools disabled.
export const developmentFeaturesEnabled =
  (process.env.EXPO_PUBLIC_APP_ENV === 'development' ||
    process.env.EXPO_PUBLIC_APP_ENV === 'preview') &&
  process.env.EXPO_PUBLIC_DEV_FEATURES_ENABLED === 'true';

export const developmentTrainingEnabled =
  developmentFeaturesEnabled &&
  process.env.EXPO_PUBLIC_DEV_TRAINING_TOGGLE === 'true';

export function canUseDevelopmentTraining(user: { role: string; email?: string } | null | undefined) {
  return developmentTrainingEnabled && user?.role === 'PROSPECT' &&
    (process.env.EXPO_PUBLIC_APP_ENV !== 'preview' ||
      /@(?:[^@]+\.)?hercules\.local$/i.test(user.email?.trim() ?? ''));
}

// Keep testing credentials in the same module as the inlined environment gate
// so production exports can eliminate these literals as unreachable code.
export const developmentAccounts = developmentFeaturesEnabled ? {
  dealer: { email: 'prospect@hercules.local', password: 'password123' },
  salesManager: { email: 'manager@hercules.local', password: 'password123' },
} as const : null;

export const developmentInvitationToken = developmentFeaturesEnabled
  ? 'prospect-demo-token'
  : '';
