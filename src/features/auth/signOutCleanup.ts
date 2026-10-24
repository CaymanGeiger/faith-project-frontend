// Native integrations register cleanup without coupling auth to native modules.
const handlers = new Set<() => Promise<void>>();
export function registerSignOutCleanup(handler: () => Promise<void>) {
  handlers.add(handler);
  return () => { handlers.delete(handler); };
}
export async function runSignOutCleanup() {
  await Promise.allSettled([...handlers].map(handler => handler()));
}
