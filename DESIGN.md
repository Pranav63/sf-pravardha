# Design direction

Pravardha is presented as a considered, personal advisory practice serving businesses with complex commercial decisions. The visual language combines forest green, warm ivory, and champagne accents with generous space, editorial typography, fine rules, and architectural imagery.

The architectural hero is generated with the built-in image generation tool. Its sculptural forms express structure and connection; the artwork is illustrative and does not depict a company office or completed project. The supplied company logo provides the brand anchor.

## Rebuild: motion as part of the layout

The revised experience combines continuous scroll-linked hero transforms, a pinned three-chapter service scene, a dimensional route atlas with drawing paths and traveling lights, and a floating material navigation layer. Body text is 18–20px on desktop and 16–17px on phones. The separate four-stage process section has been removed to shorten the journey to the people and contact sections.

Expertise uses a live Three.js sculpture of architectural portals in glass and champagne brass. Its center stays fixed while scrolling rotates the actual geometry around its vertical axis, revealing new faces, openings and material reflections. The renderer loads when the section approaches. The generated hero image has a gentle continuous pan and zoom, separate from its scroll transform; the headline stays steady when the visitor is not scrolling.

Motion runs by default and respects live changes to the operating system's reduced-motion preference. The floating motion toggle has been removed. Phones and tablets under 960px show all three service articles in native page flow, with one sticky 3D backdrop behind the reading layer. There are no service tabs to discover or select on mobile. Short desktop viewports and an initially reduced-motion desktop preference retain direct service selection without a long sticky track. Enabling reduced motion after scrolling begins preserves the track height to avoid moving the reader elsewhere on the page.

The introduction pairs readable “Beyond borders” text with an abstract field of fine jade-to-gold contours, distinct from the architectural expertise sculpture. The complete SVG curves flow continuously, with a traveling wave across the contours and additional shaping from scrolling. The hero drift and contour flow pause offscreen and in hidden tabs, resuming from their previous phase. Reduced motion presents a fixed, complete composition. The artwork sits beside the copy on desktop. On phones, it becomes a softly masked background flowing behind the heading, with the text above it and no separate illustration block. This shortens the section and keeps the paragraph clear, with no additional renderer or dependencies. Service counters use sans-serif tabular numerals, a consistent baseline and clearer contrast, reserving the expressive serif for headings. Buttons use clean text labels without arrows. Glass styling remains concentrated on floating navigation and controls, with directional highlights, softer depth and restrained press feedback. Navigation takes a dark green tint over the map and contact sections; opening its mobile menu adds frosting for legibility. Active selections use simple fills within the material instead of stacking glass layers, following Apple's Liquid Glass guidance. The mobile menu combines its label and icon into one compact control with comfortable touch targets. On phones, directional scrolling tucks the header away during reading and brings it back on upward movement; small reversals do not toggle it. Menus, keyboard focus and reduced motion keep it visible. The contact sheet rises from the bottom on phones and appears centrally on desktop, using the native dialog for modal focus and background isolation. Clipboard confirmation is shown only after a successful copy. Map selections use one interruptible 450ms transition for the camera, route emphasis and copy.

The opening eyebrow, introduction sub-footer and map atlas footer have been removed; the Gulf hero note stays on desktop only. A portrait-led people section uses the supplied image of Parul Gupta in place of the floating monogram tag. The contact section presents a direct invitation to email her, without a form or a backend. The desktop footer groups the practice, full office address and direct partner contact beneath the brand. On phones, it condenses to the brand, email, full address and copyright. A compact glass return-to-top control uses a gently rising arrow and native smooth scrolling; reduced motion removes both animations. The regional tagline, service captions and scroll prompts have been removed throughout. The route atlas uses a compact map beside its explanation on desktop with a dedicated column gutter, and a shorter inset map above the explanation on phones with a 20px gap. Region descriptions share a naturally sized grid area, preserving the card height when switching without clipping larger text.

## Research references

- [Apple Design Tips](https://developer.apple.com/design/tips/) and [Typography](https://developer.apple.com/design/human-interface-guidelines/typography): readable contrast, clear type hierarchy, consistent alignment and comfortable touch targets. The brand’s locally bundled fonts are retained.

- [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials) and [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/): floating controls, luminosity, layered edge highlights and readable material thickness. Adapted to CSS backdrop blur; this is not Apple's native optical renderer.
- [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout) and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility): adapt content and navigation to available space, preserve readable content, and provide comfortable touch targets.
- [Apple Motion](https://developer.apple.com/design/human-interface-guidelines/motion): responsive, interruptible transitions and reduced motion.
- [Motion scroll animations](https://motion.dev/docs/react-scroll-animations): continuous transforms driven by scroll position. `motions.dev` was inaccessible; `motion.dev` is the verified library site.
- [Componentry Scroll Choreography](https://componentry.dev/docs/components/scroll-choreography), [Scroll Split Card](https://componentry.dev/docs/components/scroll-split-card), and [Sticky Scroll Cards](https://componentry.dev/docs/components/sticky-scroll-cards): composition, depth and scenes that evolve with scrolling.
- [Componentry Liquid Glass Carousel](https://componentry.dev/docs/components/liquid-glass-carousel): refractive material reference; its WebGL carousel was not imported.
- [Kokonut Liquid Glass](https://kokonutui.com/docs/cards/liquid-glass-card): glass control highlights and press feedback.
- [Bklit Choropleth](https://bklit.com/docs/components/choropleth-chart): animated geographic focus, selection and navigation.
- [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) and [RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html): glass transmission, surface properties and studio reflections for the live architectural sculpture.

These are design references. The implementation is original React, CSS, Motion and Three.js; no component registry or full UI kit was copied.

## Assets

- `public/images/architecture.jpg`: original hero artwork retained.
- `src/components/ServiceSculpture.tsx`: procedural 3D expertise sculpture, rendered in the browser.
- `public/images/md_parul.png`: supplied portrait of Parul Gupta.
- `public/images/pravardha-logo.jpeg`: supplied brand artwork.
- Fonts are bundled locally with Fontsource.
