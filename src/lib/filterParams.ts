// Filters <-> URL query params, so a refresh or a shared link keeps them:
// ?q=diwali&platforms=instagram,x&status=failed. Unknown values are dropped.

import { PLATFORMS, type Platform } from './platforms';
import { EMPTY_FILTERS } from './selectors';
import type { Filters, StatusFilter } from './types';

const STATUSES: StatusFilter[] = ['all', 'scheduled', 'published', 'failed'];
const PLATFORM_IDS = PLATFORMS.map((p) => p.id);

export function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const status = params.get('status') as StatusFilter | null;
  const platforms = (params.get('platforms') ?? '').split(',').filter((p): p is Platform => PLATFORM_IDS.includes(p as Platform));
  return {
    search: params.get('q') ?? EMPTY_FILTERS.search,
    // Order and duplicates don't matter to the filter, so normalise them.
    platforms: PLATFORM_IDS.filter((p) => platforms.includes(p)),
    status: status && STATUSES.includes(status) ? status : EMPTY_FILTERS.status,
  };
}

/** Returns `search` with the filter params replaced, keeping any others (e.g. ?mock=). */
export function filtersToSearch(filters: Filters, search: string): string {
  const params = new URLSearchParams(search);
  const set = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
  set('q', filters.search);
  set('platforms', PLATFORM_IDS.filter((p) => filters.platforms.includes(p)).join(','));
  set('status', filters.status === 'all' ? '' : filters.status);
  // Commas are legal in a query string; leaving them unescaped keeps ?platforms=x,tiktok readable.
  const out = params.toString().replace(/%2C/gi, ',');
  return out ? `?${out}` : '';
}
