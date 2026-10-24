type NavigationTree = {
  key?: string;
  type?: string;
  index?: number;
  routeNames?: readonly string[];
  routes: readonly { name: string; state?: NavigationTree }[];
};

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
  if (!stack?.key || !stack.routeNames?.includes(name)) return null;
  return { type: 'RESET' as const, target: stack.key, payload: { index: 0, routes: [{ name }] } };
}
