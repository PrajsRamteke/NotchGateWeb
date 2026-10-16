# NotchGate website

The landing page and live playground for [NotchGate](https://github.com/PrajsRamteke/NotchGate).
Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
cd notchgateweb && python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy

Any static host works: upload the `notchgateweb/` folder as-is
(Netlify, Vercel, Cloudflare Pages, or GitHub Pages via an Actions workflow).

## What's inside

| Path | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `css/tokens.css` | Colors, type and motion tokens for light and dark themes |
| `css/island.css`, `css/cards.css` | The live notch (Live pill, music wings) and its cards |
| `css/*.css` | One file per section (hero, story, showcase, playground, details, install) |
| `js/util.js` | Helpers, including `NG.morph`, which updates the notch in place so animations and typing survive re-renders |
| `js/island.js` | The notch: animation, hover activity, shortcuts, the closed-notch artwork and equalizer |
| `js/panel.js`, `css/panel.css` | The hover panel: sessions (file changes, usage, reply with conversation history and kept drafts, ↗ open, ✕ dismiss), widget tabs (one widget at a time), image drag-and-drop and paste, quick settings |
| `js/music.js`, `js/insights.js`, `css/widgets.css` | The Now Playing and Insights widgets |
| `js/buddies.js`, `css/buddies.css` | The water buddies (robot, Spidey, Batman), drawn in SVG, with every mood |
| `js/water.js`, `css/water.css` | The water reminder: drops a buddy from the notch, Drank it / Snooze, preview |
| `js/menu.js`, `css/menu.css` | The NotchGate menu from the header's ✦ icon: update banner, icon-tile sections, ⓘ tips, ▶ previews |
| `js/infotip.js` | The ⓘ bubbles used by the menu and the notch |
| `js/sounds.js` | macOS's alert sounds, sketched with Web Audio (no audio files) |
| `js/updates.js` | The pretend updater shared by the menu, the notch's Update pill and the details tile |
| `js/settings.js` | Shared settings behind the menu, the panel and the playground |
| `js/header.js` | Frosted header and current-section highlight |
| `js/cards.js` | Card templates (permission, edit, question, plan, done, attention alert) |
| `js/story.js` | Scroll story that drives the notch (requests, sessions, blocked-Claude alert, reply, images) |
| `js/tour.js` | The widgets tour: scroll through it and the notch shows one widget at a time |
| `js/buddies-section.js` | The water buddies section: picker, mood gallery, glasses today |
| `js/whatsnew.js` | The What's new rail; each card demos its feature on the page |
| `js/playground.js`, `js/terminal.js` | The pretend Claude Code session |
| `js/details.js`, `js/install.js` | Interactive tiles (risk checker, keycaps, sounds, updater), copy button, GitHub stars |
| `js/demo-data.js` | All dummy content |

Everything on the page is simulated; nothing connects to a real Claude session,
and nothing plays real audio except the alert-sound previews.
