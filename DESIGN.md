# Design direction

Pravardha is presented as a considered, personal advisory practice serving businesses with complex commercial decisions. The visual language combines forest green, warm ivory, and champagne accents with generous space, editorial typography, fine rules, and architectural imagery.

The architectural hero is generated with the built-in image generation tool. Its sculptural forms express structure and connection; the artwork is illustrative and does not depict a company office or completed project. The supplied company logo provides the brand anchor.

## Rebuild: motion as part of the layout

The revised experience combines continuous scroll-linked hero transforms, a pinned three-chapter service scene, a dimensional route atlas with drawing paths and traveling lights, and a floating material navigation layer. Body text is 18–20px on desktop and 16–17px on phones. The separate four-stage process section has been removed to shorten the journey to the people and contact sections.

Expertise uses a live Three.js sculpture of architectural portals in glass and champagne brass. Its center stays fixed while scrolling rotates the actual geometry around its vertical axis, revealing new faces, openings and material reflections. The renderer loads when the section approaches. The generated hero image remains unchanged.

A visible motion control pauses both scroll transforms and continuous effects. The initial preference respects the operating system. An explicit Play motion selection can override it. Short viewports, mobile screens and an initially reduced-motion preference use service selection without a long sticky track. Pausing after scrolling begins preserves the track height to avoid moving the reader elsewhere on the page.

## Research references

- [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials) and [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/): floating controls, luminosity, layered edge highlights and readable material thickness. Adapted to CSS backdrop blur; this is not Apple's native optical renderer.
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
- `public/images/pravardha-logo.jpeg`: supplied brand artwork.
- Fonts are bundled locally with Fontsource.
