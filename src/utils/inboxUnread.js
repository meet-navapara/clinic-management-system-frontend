/** Sync inbox unread count across Inbox page, Sidebar, and AppHeader. */
const EVENT = 'clinic:inbox-unread';

export function publishInboxUnread(count) {
  const n = Math.max(0, Number(count) || 0);
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: n }));
}

export function subscribeInboxUnread(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (e) => handler(e.detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
