# V4 verification — 30 September 2026

## Build and implementation

- Production build passes semantic HTML, JavaScript syntax, anchors, local assets, image dimensions, CV consistency, structured data, and Vercel configuration checks.
- The old side index, editorial compositions, stylesheet, and index-specific JavaScript were replaced. No legacy stylesheet is loaded and no runtime framework or animation library was introduced.
- Production output contains only static site files and assets. Development tools, tests, documentation, local reports, and environment files are excluded.
- `git diff --check` passes. Runtime dependency audit reports zero vulnerabilities; there are no production package dependencies.

## Browser and interaction checks

**20 tests pass** against the generated production output in Chrome/Chromium. Additional targeted checks cover the final no-JavaScript fallback and hero layout cleanup.

Responsive widths: **375, 390, 430, 768, 1024, 1440, and 1920 px**. All major scenes pass overflow, image loading, and browser-error checks. Screenshots at each width were inspected.

Coverage includes:

- ICE/NIGHT switching, destination labels, saved preference, and storage-unavailable fallback.
- Floating navigation, mobile overlay, Escape, focus return, anchor navigation, and adaptive dock color.
- All five tab interfaces with arrow keys, Home, End, correct selection, and associated panels.
- Hero hover previews and navigation to the selected real project.
- Architecture selection, keyboard traversal, and visible explanations from identity through settlement.
- Scroll-selected Dark Agent screens, touch selection, and all 13 full-resolution originals.
- Native image dialog focus containment, Escape, and focus restoration.
- Real emulated touch swipes through the project gallery without accidentally opening an image.
- Replayable illustrated validation, live reduced-motion preference changes, and cursor removal under reduced motion.
- Current CV HTTP delivery and PDF signature, email copying, and skip navigation.
- No-JavaScript access to projects, architecture explanations, image originals, and mobile navigation without overflow.
- Automated WCAG A/AA checks in both themes, including visible-label/accessibility-name matching: **zero violations**.

## Performance

Lighthouse **12.8.2**, local production preview with minified CSS/JavaScript and HTTP compression. These are lab measurements, not field-user measurements.

| Category                 | Mobile | Desktop |
| ------------------------ | -----: | ------: |
| Performance              |     99 |     100 |
| Accessibility            |    100 |     100 |
| Best practices           |    100 |     100 |
| SEO                      |    100 |     100 |
| Largest Contentful Paint |  1.9 s |   0.4 s |
| Cumulative Layout Shift  |      0 |       0 |
| Total Blocking Time      |  50 ms |    0 ms |

The hero screenshot is about 16 KB, interaction JavaScript about 11 KB minified, and optimized display images about 1 MB in total. Below-the-fold images load lazily; originals load on demand. Fonts are self-hosted. Decorative animation pauses outside the viewport. Scroll and pointer work is scheduled through requestAnimationFrame rather than a perpetual rendering loop. No Three.js, WebGL, particle canvas, analytics, external font request, or third-party browser script is shipped.

## Content preservation

An inventory comparison found **no missing original external or asset links**. All 18 original Dark Agent and SmartInvest screenshots remain intact. Person, website, and project structured metadata is unchanged. Every CV link still uses `assets/MohamedBassam CV Improved .pdf`; the old PDF URL keeps its existing Vercel redirect.

Personal identity, Dubai location, Golden Visa, availability, experience, education, project facts, GitHub, email, WhatsApp, certificates, and notebook links remain. Dark Agent retains V1.0 Release Candidate / Azure-ready infrastructure / Azure deployment preparation wording, and no private source link is introduced. The 309 backend tests are project evidence, not portfolio test results. SmartInvest is a paper-trading product. The Red Team sequence is explicitly an illustrated workflow; decorative finance lines imply no measured financial results.

## Deployment and limits

The repository, main branch, GitHub connection, Vercel project, and `https://mohamed-bassam.vercel.app` domain remain unchanged. The existing pipeline builds `dist/` from main. Final push and live verification are reported with the release commit.

Testing used Chromium and responsive/touch emulation. Physical phones, Safari, and Firefox were not directly tested. The two original Kaggle links remain unchanged but could not be independently fetched in the earlier environment. Automated checks complement visual and keyboard review; they do not constitute accessibility certification.

Raw screenshots, audit JSON, and browser traces are local ignored artifacts under `.qa/`, `test-results/`, and `playwright-report/` and are not published.
