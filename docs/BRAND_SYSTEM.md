# BE DIFFERENT · Athlete System

The brand expresses the concept's promise: Build Your Athlete. Data becomes a clear decision for today, backed by a personal coach.

## Identity

A performance cockpit with precise charcoal surfaces, warm white text and Different Volt as the action colour. The existing selected logo stays recognizable. Seven forward leaning segments express the seven pillars of development. Score, today's training and coach guidance define the visual hierarchy.

Background #0A0C0D, surface #14181B, raised surface #1D2327, text #F4F5EF, secondary text #A5ADB3, Volt #D4FF00, border #2B3338. Green, amber and red remain semantic status colours and must be accompanied by text or values.

## Product rules

- A page answers one question before showing supporting data.
- The dashboard pairs the score with today's action. Supporting radar, activity and coach information follow.
- Volt identifies the principal action and the score. Other actions use quiet outlined controls.
- Titles are compact, sentence case and readable. Tabular numbers keep changing metrics stable.
- Cards use 18 px corners, fields 10 to 12 px corners. Space separates content before decoration does.
- Web fields have persistent labels, 16 px values, a 48 px minimum height and visible keyboard focus. Native inputs use BrandInput with persistent identity, focus and disabled states.
- Motion is brief. Cards do not bounce or move on hover. Reduced motion is respected on the web and launch screen.
- Mobile navigation uses a subtle selected surface and a Volt icon. It never competes with the principal action.
- Health data and missing values retain their existing meaning. No fabricated performance or coach media is introduced.

## Implementation

`app/brand-system.css` is the final product layer after the existing functional layout styles. It covers member screens, authentication, onboarding, library, workout tracking, charts, messaging, settings, pricing, legal pages and coach administration.

`mobile/theme.ts`, shared cards, screen surfaces, native field component and navigation define the matching app system. Individual screen type declarations were updated to make labels readable and reduce oversized titles.

The short English brand signatures are intentional. Product instructions remain localized in German and English.

## Validation

The production web build and web/native TypeScript checks pass. Browser verification covered 123 role/route/viewport combinations: PRO member screens, FREE states and coach administration at 320, 390 and 1440 px. No document overflow or browser errors remained. Login, field focus, language switching without losing a draft, daily check saving, mobile menu placement and Escape dismissal were exercised against an isolated database. Representative screenshots were inspected and refined.

The native visual declarations and field components pass TypeScript checks; physical iOS and Android device review remains part of release validation.

Self hosted Archivo and Manrope fonts are included, with their licenses. Version 1.1.0 requests Android and iOS builds through Publisher; automatic store submission is disabled for this design release.
