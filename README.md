# Cerebella VR (hosted build, v38)

© Dr. Alexander Riccardi / Bala North, all rights reserved. Use is subject to the Terms of use shown in the app.

Upload the **contents** of this folder (not the folder itself) to the root of the site or repository.

| File | Purpose |
|---|---|
| `index.html` | The app |
| `sw.js` | Offline support and updates. Raise `VERSION` with every release. |
| `manifest.webmanifest`, `icons/` | Install to home screen / app icon |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |
| `_headers` | Netlify only: makes sure updates are never held in a stale cache |

## Updating later
Replace `index.html`, change `VERSION` in `sw.js` (e.g. `cerebella-v39`), upload both. Open devices show "A new version of Cerebella is ready · tap to update".

## Notes
- VR (WebXR) needs the hosted HTTPS address; it will not run from a file on disk.
- All patient data stays on each device. Updating the app does not erase it.
