# Once Human · Warband Roster Tracker

A **manual / local-data** warband roster and stats tracker for [Once Human](https://www.oncehuman.game/).

There is **no public personal-stats API** for Once Human, so this app does **not** pull live game data. You (or your officers) maintain the roster by hand. Data lives in the browser (`localStorage`) and can be shared via JSON export/import.

## Live demo (GitHub Pages)

- **https://blog.nano11bravo.com/once-human-warband/** (user Pages custom domain)
- Also via: **https://nano11b.github.io/once-human-warband/** (redirects to the custom domain)

Source: `main` branch, site root (`/`).

## Features (v1)

- Track warband members: **name**, **role** (Leader / Officer / Member or custom), **level**, **status** (Active / Inactive / Away), **class/archetype**, **gear notes**, **last updated**, optional **notes**
- Add / edit / delete members
- Search + filter by status and role; sort by name, level, role, or last updated
- Summary cards: total members, active count, average level
- Persist in `localStorage`
- **Export / Import JSON** so the warband can share one roster file
- Dark, post-apocalyptic / sci-fi UI (pollution greens, dark slate, amber)
- Mobile-friendly (card layout on small screens)
- Sample roster on first visit (clearly labeled; one-click clear to start fresh)

## Quick start (local)

Open `index.html` in a browser, or serve the folder:

```bash
# Python
python3 -m http.server 8080

# or Node
npx --yes serve .
```

Then visit `http://localhost:8080`.

## Sharing a roster

1. Click **Export** to download a JSON file.
2. Share that file with officers / members.
3. Recipients click **Import** and select the file (replaces local roster).

Exported shape (v1):

```json
{
  "format": "once-human-warband-roster",
  "version": 1,
  "exportedAt": "2026-09-30T16:00:00.000Z",
  "note": "Manual roster data for Once Human. Not connected to any live game API.",
  "members": [ /* ... */ ]
}
```

A bare JSON array of members is also accepted on import.

## Repo layout

| File | Purpose |
|------|---------|
| `index.html` | App shell |
| `styles.css` | Theme & layout |
| `app.js` | Roster logic, localStorage, import/export |
| `README.md` | This file |

## Honest scope

- Stats are **manually maintained** — update levels, status, and gear notes yourselves.
- No account login, no server, no Once Human API integration.
- Clearing browser storage (or using another device/profile) starts empty unless you import a JSON backup.

## License

MIT — use and fork freely for your warband.
