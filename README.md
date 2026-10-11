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
| `css/island.css`, `css/cards.css` | The live notch and its cards |
| `css/*.css` | One file per section (hero, story, playground, details, install) |
| `js/island.js` | The notch: animation, hover activity, shortcuts |
| `js/panel.js`, `css/panel.css` | The hover panel: sessions (file changes, usage, reply, open, ✕ dismiss), the Usage / Sessions / Tools / Resume widgets, image drag-and-drop and paste, quick settings |
| `js/water.js`, `css/water.css` | The water reminder bot from Extras |
| `js/menu.js`, `css/menu.css` | The NotchGate menu from the header's ✦ icon, with live previews |
| `js/settings.js` | Shared settings behind the menu and the playground |
| `js/header.js` | Frosted header and current-section highlight |
| `js/cards.js` | Card templates (permission, edit, question, plan, done) |
| `js/story.js` | Scroll story that drives the notch (requests, sessions, widgets, images, water) |
| `js/playground.js`, `js/terminal.js` | The pretend Claude Code session |
| `js/details.js`, `js/install.js` | Interactive tiles, copy button, GitHub stars |
| `js/demo-data.js` | All dummy content |

Everything on the page is simulated; nothing connects to a real Claude session.
