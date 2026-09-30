# Pravardha Advisors

An advisory website built with React, TypeScript, Vite, Motion and Three.js. Local artwork and fonts; no backend or environment variables.

Live website: [sf-pravardha.vercel.app](https://sf-pravardha.vercel.app).

## Local development

Use Node.js 22.12 or later and npm.

```sh
npm install
npm run dev
```

Open the address printed by Vite. For a production preview:

```sh
npm run build
npm run preview
```

## Checks

```sh
npm run check
npm run build
npm run test:e2e
```

Browser tests start their own production preview. Google Chrome must be installed. For bundled Chromium, run `npx playwright install chromium`, then `CHROME_CHANNEL=chromium npm run test:e2e`.

The tests cover visible 3D rotation and stable framing, headline spacing, scroll-driven service chapters, moving map routes, clean arrow-free controls, keyboard navigation, live OS motion preferences and mobile layouts. Screenshots go into the ignored `test-results/` folder.

## Edit content

- `src/content.ts`: main service descriptions, company information, leadership and contact copy.
- `src/App.tsx`: page composition, navigation, hero, introduction, people and contact sections.
- `src/components/Services.tsx`: scroll-driven service presentation.
- `src/components/ServiceSculpture.tsx`: live 3D glass and brass architectural sculpture.
- `src/components/Corridors.tsx`: regional descriptions and route map.
- `src/styles.css` and component CSS files: appearance and responsive layout.

Enquiry links open the visitor's email application addressed to `parulgupta@hotmail.com`. The site does not send or store enquiries itself.

## Motion

Motion runs by default and follows the visitor's operating-system reduced-motion preference, including changes during a visit. There is no separate motion toggle. Desktop services advance with scrolling and can also be selected directly. On mobile, short screens and an initially reduced-motion preference, visitors select services without a long pinned section. Enabling reduced motion after a scroll scene has started preserves the track to prevent a page jump.

[Design references](DESIGN.md) document the visual direction. The original hero is retained. The expertise sculpture is live Three.js geometry, loaded as its section approaches; scrolling rotates the object around its vertical axis while its center stays anchored. A borderless moving light ribbon accompanies the introduction. Navigation and controls use CSS glass materials with layered highlights and press feedback, plus a solid fallback for browsers without backdrop blur.

The 3D module adds approximately 144 kB compressed, deferred until expertise approaches the viewport. It renders only while its angle is changing, stops offscreen, and caps pixel density. Mobile scrolling adds a gentler turn alongside service selection. Browsers without WebGL show a simple portal outline.

## Vercel

Import `Pranav63/sf-pravardha` and select:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | Repository root |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None |
