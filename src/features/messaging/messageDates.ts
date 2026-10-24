import { formatShortDate } from '../../lib/format';

export function isSameMessageDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function messageDayLabel(value: string, now = new Date()) {
  const date = new Date(value);
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatShortDate(value);
}
