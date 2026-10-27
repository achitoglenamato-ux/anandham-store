import { useSyncExternalStore } from 'react';

/**
 * Hash-based routing: addresses look like  https://name.github.io/repo/#/admin
 *
 * GitHub Pages is a plain file host, so a refresh on /admin or /login would show a 404 page.
 * Everything after the # never reaches the host, so refreshing and sharing links always work.
 * Optional query text lives inside the hash too:  #/login?next=/admin
 */

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function parts(): { path: string; search: string } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const queryAt = raw.indexOf('?');
  const path = queryAt === -1 ? raw : raw.slice(0, queryAt);
  const search = queryAt === -1 ? '' : raw.slice(queryAt + 1);
  return { path: '/' + path, search };
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  const target = '#' + (to.startsWith('/') ? to : '/' + to);
  const oldURL = window.location.href;
  const url = new URL(oldURL);
  url.hash = target;
  window.history[options.replace ? 'replaceState' : 'pushState'](null, '', url.href);
  window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: url.href }));
}

export const useHashLocation = (): [string, typeof navigate] => [
  useSyncExternalStore(subscribe, () => parts().path, () => '/'),
  navigate,
];
useHashLocation.hrefs = (href: string) => '#' + href;

/** The "?next=..." part of the current address, without the question mark. */
export const useHashSearch = (): string => useSyncExternalStore(subscribe, () => parts().search, () => '');
