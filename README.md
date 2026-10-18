# PostPilot

A frontend-only social media post scheduler for Facebook, Instagram, X and TikTok, built for the Flintzy frontend assignment. You can write posts, schedule them, filter the queue and retry failed posts. All data and API calls are mocked.

**Live demo:** _add the deployed URL here_

## Running it

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

### Deploying

It's a static site: build with `npm run build` and serve `dist/`. `vercel.json` (Vercel) and `public/_redirects` (Netlify) send every path to `index.html`, so refreshing `/settings` works.

### Demo switches

Add these to the URL to see the system states without changing any code:

| URL | What you get |
| --- | --- |
| `?mock=slow` | 2–3 s latency, so you can see loading skeletons and spinners |
| `?mock=empty` | No posts: the empty state |
| `?mock=error` | Loading fails: the error state with a retry button |
| `/settings` | Reset the demo data, or clear all posts |
| `/components` | The design system sheet (every component in both themes) |

The demo scenarios keep their data in memory, so they never overwrite your saved posts.

## How the brief maps to the app

| # | Requirement | Where |
| --- | --- | --- |
| Data | 30+ mock posts with `id`, `content`, `platforms`, `mediaUrl`, `scheduledAt` (UTC), `status`, `errorMessage` | `src/data/posts.json` (32 posts), loaded by `src/lib/seed.ts` |
| 1 | Queue grouped by Today, Tomorrow, then dates, with preview, platform icons, time and status | `src/lib/selectors.ts` (`groupByDay`), `src/features/queue/` |
| 2 | Filter by platform and status, search by content, kept in URL query params | `src/lib/filterParams.ts`, e.g. `/?q=diwali&platforms=instagram,x&status=failed` |
| 3 | Composer with text, several platforms, optional image URL and date and time | `src/features/composer/` |
| 4 | Live character counter per platform (X 280, Instagram 2,200, TikTok 2,200, Facebook 5,000); scheduling blocked when any is over | `src/lib/counter.ts`, `src/lib/platforms.ts` |
| 5 | Time must be in the future; stored in UTC, shown in local time | `src/features/composer/composerForm.ts`, `src/lib/dates.ts` |
| 6 | Optimistic retry with a 1 s mock call that fails 20% of the time, rolled back with an error message | `retryPost` in `src/lib/store.ts` and `src/lib/api.ts` |
| 7 | Loading, empty and error states; responsive for mobile and desktop | `src/features/queue/QueueStates.tsx`; separate layouts below and above 1024 px |

## Key decisions

- **Vite + React 19 + TypeScript, no router or state library.** The app has two screens, so routing is the History API (`src/lib/route.ts`). State lives in a small store built on React's `useSyncExternalStore` (`src/lib/createStore.ts`, `src/lib/store.ts`). That keeps the dependencies to Radix (dialogs and menus, for accessibility), Tailwind CSS, Lucide icons and the Geist font.
- **The mock API is a module behind an async interface** (`src/lib/api.ts`), not MSW or json-server. It has random latency, typed errors and persistence to `localStorage`, so your changes survive a refresh. A real HTTP client could implement the same `Api` interface without the UI changing. The demo data is a plain JSON file.
- **Demo dates move with the calendar.** `posts.json` holds real UTC timestamps around a fixed day (`anchorDay`). On first load they're shifted by whole days, so Today and Tomorrow always have posts whenever someone opens the app.
- **Optimistic updates.** Retry and delete update the UI straight away and roll back if the mock server refuses. A post being retried keeps a spinner on its status badge and stays visible even under the Failed filter until the server answers. If the post is edited or deleted while the retry is in flight, the rollback doesn't overwrite that change.
- **Filters live in the URL** and update with `replaceState`, so typing a search doesn't add a history entry for every keystroke. Unknown values in a pasted URL are ignored.
- **Time zones.** All times are stored as UTC ISO strings. The composer turns the chosen local date and time into UTC through `Intl` (no date library), and shows which time zone it's using under the inputs.
- **Accessibility and theming.** There are light and dark themes (following the system or chosen by hand) and keyboard support everywhere (including `Ctrl/⌘ K` for search). Toasts are announced by screen readers, status uses an icon and text rather than colour alone, and a test (`src/lib/contrast.test.ts`) checks the theme colours meet WCAG contrast.
- **Tests** cover the pure parts: dates and grouping, filters and URL params, counters, composer validation, the mock API and the store, including the optimistic retry and its rollback.

## Assumptions

- **Retry outcome is the brief's 20% coin flip, whatever the original failure was.** Failed posts also carry a `failure` code (`token_expired`, `rate_limited`, `media_required`). It's only used to give advice in the failed-posts banner, such as "Reconnect Instagram, then retry".
- **A retried post whose time has passed** is moved to 5 minutes from now, and the toast tells you the new time.
- **Editing a failed post** puts it back in the queue as scheduled.
- **Character counting** counts what users see as characters (so emoji count as one) and doesn't model X's rule that links count as 23 characters.
- **The image URL** must be an http(s) URL. A preview is shown when the image loads, and a neutral placeholder when it doesn't.
- **The platform filter matches any of the selected platforms**, and search also matches platform names and error messages.
- **The date-time picker** is the browser's native date and time inputs, which work well on mobile.
- **Accounts** (connected or expired) are mocked so the reconnect flow can be shown; there is no login.

## Project structure

```
src/
  app/          shell, navigation, settings, toast host
  components/   design-system components (ui/) and the theme switcher
  data/         posts.json — the mock data
  features/
    queue/      queue page, filters, day groups, post cards, states
    composer/   composer modal / mobile sheet, preview, form logic
  lib/          api, store, selectors, dates, counters, URL params (+ tests)
  styles/       Tailwind theme tokens for light and dark
```
