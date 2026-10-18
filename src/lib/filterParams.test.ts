import { describe, expect, it } from 'vitest';
import { filtersFromSearch, filtersToSearch } from './filterParams';
import { EMPTY_FILTERS } from './selectors';

describe('filtersFromSearch', () => {
  it('reads search, platforms and status', () => {
    expect(filtersFromSearch('?q=diwali%20sale&platforms=x,instagram&status=failed')).toEqual({
      search: 'diwali sale',
      platforms: ['instagram', 'x'],
      status: 'failed',
    });
  });

  it('drops unknown values and falls back to no filters', () => {
    expect(filtersFromSearch('?platforms=myspace,x,x&status=deleted')).toEqual({ ...EMPTY_FILTERS, platforms: ['x'] });
    expect(filtersFromSearch('')).toEqual(EMPTY_FILTERS);
  });
});

describe('filtersToSearch', () => {
  it('writes only active filters and keeps other params', () => {
    expect(filtersToSearch({ search: 'holi', platforms: ['tiktok', 'facebook'], status: 'all' }, '?mock=slow')).toBe(
      '?mock=slow&q=holi&platforms=facebook,tiktok',
    );
  });

  it('clears the filter params when filters are cleared', () => {
    expect(filtersToSearch(EMPTY_FILTERS, '?q=holi&status=failed')).toBe('');
  });

  it('round-trips', () => {
    const filters = { search: 'flat 40%', platforms: ['facebook' as const, 'x' as const], status: 'scheduled' as const };
    expect(filtersFromSearch(filtersToSearch(filters, ''))).toEqual(filters);
  });
});
