import type { NavigationState } from 'expo-router';

type NavigationTree = NavigationState | NonNullable<NavigationState['routes'][number]['state']>;

/** The signed-in page stack, excluding authentication and other root history. */
export function getActivePageStack(root: NavigationTree | undefined): NavigationTree | undefined {
  let state = root;
  while (state) {
    const route = state.routes[state.index ?? 0];
    if (state.type === 'stack' && /^(prospect|manager)\//.test(route?.name ?? '')) return state;
    state = route?.state;
  }
}

export function canGoBackWithinTab(root: NavigationTree | undefined) {
  return (getActivePageStack(root)?.index ?? 0) > 0;
}

export function getTabResetAction(root: NavigationTree | undefined, href: string) {
  const stack = getActivePageStack(root);
  const path = href.replace(/^\//, '').replace(/\/$/, '');
  const name = path.includes('/') ? path : `${path}/index`;
  if (stack?.stale !== false || !stack.routeNames.includes(name)) return null;
  return {
    type: 'RESET' as const,
    target: stack.key,
    // SDK 58 requires complete state and preserves the sequence used to mint new route keys.
    payload: { ...stack, index: 0, routes: [{ name }] },
  };
}
