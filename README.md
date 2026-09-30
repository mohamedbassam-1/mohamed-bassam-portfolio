# Mohamed Bassam — AI Engineer

[mohamed-bassam.vercel.app](https://mohamed-bassam.vercel.app)

A personal AI engineering portfolio built with semantic HTML, CSS, and small, dependency-free browser scripts. V4 connects real project interfaces through an atmospheric, spatial experience with a floating navigation dock.

## Experience

- A pointer-responsive intelligence sculpture connects five real project previews, led by Dark Agent.
- A large portrait and floating personal facts introduce Mohamed; a timeline preserves his experience.
- Six connected capability branches reveal technologies and project evidence. Data and automation remain available as the connective layer.
- Dark Agent combines full-width product screens, a flowing nine-stage architecture, selectable agent roles, hybrid retrieval, an illustrated Red Team validation sequence, release evidence, and engineering decisions.
- SmartInvest has its own financial atmosphere and six-stage market-data-to-paper-execution walkthrough.
- A six-project visual gallery supports keyboard selection and touch swiping.
- ICE and NIGHT themes retain the existing saved preference.

Dark Agent remains **V1.0 Release Candidate**, with **Azure-ready infrastructure / Azure deployment preparation**. Its private source repository is not linked. The 309 backend tests are documented Dark Agent evidence, separate from this portfolio's tests. SmartInvest demonstrates paper trading, not claimed live investment performance.

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:8000`. The static source can also be served directly by any ordinary HTTP server.

```sh
npm run build
npm run preview
npm test
```

The build validates HTML, JavaScript, local assets, anchors, image dimensions, metadata, and CV consistency, then produces `dist/` with minified CSS and JavaScript. Tests run against this production output. On Windows, the test configuration uses installed Chrome. On other systems, install the Playwright Chromium browser with `npx playwright install chromium`.

`PORT` changes the preview server port. `PORTFOLIO_TEST_URL` runs browser checks against an existing preview or deployment.

## Structure

| File                | Responsibility                                                          |
| ------------------- | ----------------------------------------------------------------------- |
| `index.html`        | Complete content, semantic scenes, project evidence, and metadata       |
| `styles.css`        | Theme tokens, compositions, responsive rules, and reduced motion        |
| `script.js`         | Navigation, tabs, storytelling, preview dialog, and copy email          |
| `theme.js`          | Small pre-paint preference loader with storage-error fallback           |
| `assets/optimized/` | Optimized display images; full-resolution originals remain in `assets/` |
| `assets/fonts/`     | Self-hosted Inter and IBM Plex Mono, with licenses                      |
| `tools/`            | Static build, validation, asset preparation, and local HTTP preview     |
| `tests/`            | Responsive, keyboard, dialog, gallery, theme, and accessibility checks  |
| `docs/`             | Design rationale and verification record                                |

Run `npm run assets` to regenerate optimized images and fonts. There is no frontend framework, canvas loop, external font request, third-party analytics, or animation library.

## Accessibility and interaction

Native scrolling is preserved. Desktop pinning is limited to the Dark Agent screenshot story; mobile uses normal document flow, a vertical architecture path, and touch controls. Tab interfaces and architecture inspection support arrow keys, Home, and End. A native dialog with explicit keyboard containment supports Escape and restores focus. Preview links still open the original image without JavaScript. Reduced motion removes smooth scrolling, pointer depth, and transitions. Decorative animation pauses offscreen. All interactions use the native browser cursor.

All resume links reference the single current `assets/MohamedBassam CV Improved .pdf`. The former PDF URL redirects to it, preserving existing shared links.

## Deployment

The existing repository's `main` branch remains connected to the existing Vercel project and **https://mohamed-bassam.vercel.app**. `vercel.json` runs `npm ci` and `npm run build`, serves `dist/`, and retains the existing security headers. Development files, reports, and private configuration are not part of the generated public output.

Built and designed by Mohamed Bassam. © 2026
