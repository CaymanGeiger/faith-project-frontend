import type { User } from '../../lib/api/types';

export type OnboardingAccess = {
  state: 'TRAINING_REQUIRED' | 'TRAINING_VERIFIED' | 'EXISTING_ACCESS' | 'MANAGER';
  restricted: boolean;
  trainingVerifiedAt: string | null;
  nextAction: 'CHOOSE_TRAINING' | 'WAIT_FOR_VERIFICATION' | null;
  allowedFeatures: string[];
};

const initialFeatures = ['home', 'setup', 'training', 'support', 'messaging', 'account'];
const routeFeatures: Record<string, string> = {
  '/prospect': 'home',
  '/prospect/getting-started': 'setup',
  '/prospect/classes': 'training',
  '/prospect/resources': 'support',
  '/prospect/messages': 'messaging',
  '/prospect/account': 'account',
  '/prospect/benefits': 'benefits',
  '/prospect/rebates': 'rebates',
  '/prospect/marketing': 'marketing',
  '/prospect/already-a-dealer': 'dealer-registration',
};

export function hasRestrictedAccess(user: User | null | undefined): boolean {
  return !user || (user.role !== 'SALES_MANAGER' && user.onboarding?.restricted !== false);
}

export function canAccessFeature(user: User | null | undefined, feature: string): boolean {
  if (!user) return false;
  if (user.role === 'SALES_MANAGER') return true;
  return (user.onboarding?.allowedFeatures ?? initialFeatures).includes(feature);
}

export function canAccessProspectRoute(user: User | null | undefined, href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const feature = routeFeatures[path];
  return Boolean(feature && canAccessFeature(user, feature));
}

export function accessibleLinks<T extends { href: string }>(user: User | null | undefined, links: T[]): T[] {
  return links.filter(link => canAccessProspectRoute(user, link.href));
}
