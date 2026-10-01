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

The tests cover visible 3D rotation and stable framing, headline spacing, scroll-driven service chapters, moving map routes, clean arrow-free controls, keyboard navigation, live OS motion preferences, native mobile service reading, compact menu touch targets and the supplied portrait. Screenshots go into the ignored `test-results/` folder.

## Edit content

- `src/content.ts`: main service descriptions, company information, leadership and contact copy.
- `src/App.tsx`: page composition, navigation, hero and introduction.
- `src/components/People.tsx` and `Contact.tsx`: portrait, leadership presentation and conversation invitation.
- `src/components/Services.tsx`: scroll-driven service presentation.
- `src/components/ServiceSculpture.tsx`: live 3D glass and brass architectural sculpture.
- `src/components/Corridors.tsx`: regional descriptions and route map.
- `src/styles.css` and component CSS files: appearance and responsive layout.

The people section uses the supplied `public/images/md_parul.png` portrait. The mobile menu keeps its label and icon together in one touch target. The header slides away after downward scrolling and returns on upward scrolling; it stays visible for an open menu, keyboard navigation or reduced motion. “Let’s talk” opens a native contact dialog with email and clipboard actions, focus restoration and a manual-copy fallback if clipboard access is denied.

The map camera, region title, description and route emphasis share a 450ms transition.

Enquiry links open the visitor's email application addressed to `Pravardha.Advisors@gmail.com`. The site does not send or store enquiries itself.

## Motion

Motion runs by default and follows the visitor's operating-system reduced-motion preference, including changes during a visit. There is no separate motion toggle. Desktop services advance with scrolling and can also be selected directly. On phones and tablets under 960px, all three services appear in ordinary page flow, with one sticky 3D sculpture behind the text; scrolling reveals each service and turns the sculpture without taps. Short desktop screens and an initially reduced-motion desktop preference keep direct service selection without a long pinned section. Enabling reduced motion after a scroll scene has started preserves the track to prevent a page jump.

[Design references](DESIGN.md) document the visual direction. The original hero artwork has a gentle continuous camera drift. The expertise sculpture is live Three.js geometry, loaded as its section approaches; scrolling rotates the object around its vertical axis while its center stays anchored. A field of fine jade-to-gold contours accompanies the introduction. Its curves flow continuously while visible, with scrolling adding another change in shape. Both ambient animations pause offscreen and in hidden tabs, and respect reduced motion. This gives the introduction a distinct visual identity from the architectural expertise sculpture. On phones, the animated contours sit behind the heading with a directional fade, keeping the text and artwork in one compact composition. “Beyond borders” remains clearly readable. Service counters use aligned sans-serif numerals, and the map has a dedicated gutter beside its text card. The mobile footer condenses to the brand, email, full address and copyright. Navigation and controls use CSS glass materials with layered highlights and press feedback, plus a solid fallback for browsers without backdrop blur.

The 3D module adds approximately 144 kB compressed, deferred until expertise approaches the viewport. It renders only while its angle is changing, stops offscreen, and caps pixel density. Mobile scrolling turns the sculpture continuously behind the three service articles. Reduced motion keeps the sculpture still while every article remains available. Browsers without WebGL show a simple portal outline.

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

## Web Analytics

Vercel Web Analytics is enabled for `sf-pravardha`. The official `@vercel/analytics/react` component is mounted once in `src/main.tsx` and records page views on Vercel. View traffic in the [project Analytics dashboard](https://vercel.com/pranav63s-projects/sf-pravardha/analytics).

The setup uses the project's free allowance, with no paid add-ons or custom events. Development mode does not collect visits. The local browser tests stub Vercel's hosted script; production collection is verified after deployment. A local production preview does not provide Vercel's analytics endpoint.
