import type { Message } from '../../lib/api/types';

type Page = { messages: Message[]; nextCursor: string | null };

export function mergeMessages(...groups: Message[][]): Message[] {
  const byId = new Map<string, Message>();
  for (const group of groups) for (const message of group) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) =>
    Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id),
  );
}

// Walk back to a previously seen message so an offline gap larger than one
// server page is recovered. Live events are merged by the caller after loading.
export async function recoverMessageHistory(
  fetchPage: (cursor?: string) => Promise<Page>,
  known: Message[],
  recoverGap: boolean,
  isCurrent: () => boolean,
): Promise<Message[]> {
  const knownIds = new Set(known.map((message) => message.id));
  const cursors = new Set<string>();
  let cursor: string | undefined;
  const messages: Message[] = [];
  do {
    const page = await fetchPage(cursor);
    if (!isCurrent()) return [];
    messages.push(...page.messages);
    if (!recoverGap || !page.nextCursor || page.messages.some((message) => knownIds.has(message.id))) break;
    if (cursors.has(page.nextCursor)) throw new Error('Unable to refresh chat history. Please retry.');
    cursors.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (isCurrent());
  return mergeMessages(messages);
}


// Re-fetch the loaded range, not just the first overlapping page. This removes
// moderated messages while retaining older pages the user has already opened.
export async function reconcileMessageHistory(fetchPage: (cursor?: string) => Promise<Page>, known: Message[], isCurrent: () => boolean): Promise<Page> {
  const oldest = known[0];
  const seen = new Set<string>();
  let cursor: string | undefined;
  let nextCursor: string | null = null;
  const messages: Message[] = [];
  do {
    const page = await fetchPage(cursor);
    if (!isCurrent()) return { messages: [], nextCursor: null };
    messages.push(...page.messages);
    nextCursor = page.nextCursor;
    const first = page.messages[0];
    if (!oldest || !nextCursor || (first && (Date.parse(first.createdAt) < Date.parse(oldest.createdAt) || (first.createdAt === oldest.createdAt && first.id <= oldest.id)))) break;
    if (seen.has(nextCursor)) throw new Error('Unable to refresh chat history. Please retry.');
    seen.add(nextCursor);
    cursor = nextCursor;
  } while (isCurrent());
  return { messages: mergeMessages(messages), nextCursor };
}
