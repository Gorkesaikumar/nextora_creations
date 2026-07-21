---
name: Lumina High-Contrast
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#464555'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4f44e2'
  primary: '#4d41df'
  on-primary: '#ffffff'
  primary-container: '#675df9'
  on-primary-container: '#fffbff'
  inverse-primary: '#c4c0ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#ac2649'
  on-tertiary: '#ffffff'
  tertiary-container: '#ce4060'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c4c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#3622ca'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bc'
  on-tertiary-fixed: '#400012'
  on-tertiary-fixed-variant: '#8f0935'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
This design system utilizes a refined **Minimalist** aesthetic with a **High-Contrast** edge to ensure a premium, editorial feel in light mode. The brand personality is professional, modern, and high-energy, targeting tech-forward audiences who value clarity and sophistication. 

The visual narrative relies on expansive white space, sharp typography, and a deliberate use of vibrant accents against a pristine #FFFFFF canvas. By stripping away unnecessary ornamentation and focusing on structural integrity, the UI evokes a sense of efficiency, luxury, and digital craftsmanship.

## Colors
The palette is anchored by a pure `#FFFFFF` background to maximize luminosity and perceived space. 

- **Primary (#6C63FF):** Used for key actions, active states, and brand identifiers. It provides a digital-native energy against the white backdrop.
- **Secondary/Neutral (#2D2D2D / #1A1A1A):** These deep grays and near-blacks provide the high-contrast foundation for typography and structural borders.
- **Accent (#FF6584):** Reserved for high-interest callouts or status indicators that require immediate visual attention.
- **Surface & Borders:** We use a very subtle `#F8F9FA` for secondary containers to maintain depth without sacrificing the "white" feel. Borders are kept crisp and thin at `#E5E7EB`.

## Typography
The typographic system pairs the sharp, contemporary geometry of **Hanken Grotesk** for headings with the systematic legibility of **Inter** for body copy. 

For technical details or secondary labels, **JetBrains Mono** is used to introduce a precise, developer-adjacent aesthetic. High contrast is maintained by using `#1A1A1A` for all primary text and `#666666` for secondary content. Headlines should utilize tight letter-spacing to feel "locked" and intentional.

## Layout & Spacing
The design system employs a **Fluid Grid** model with a maximum container width of 1280px. 

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.

Spacing follows an 8px linear scale. Large components and sections should favor generous padding (64px+) to reinforce the minimalist brand narrative and ensure the content has significant room to breathe.

## Elevation & Depth
In this light-mode system, depth is achieved through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows. 

The base layer is always `#FFFFFF`. Elevated elements like cards or modals use a 1px border of `#E5E7EB`. For interactive elements like hover states, a very soft, highly diffused ambient shadow is used: `0 4px 20px rgba(0, 0, 0, 0.05)`. This ensures the UI feels light and airy while still maintaining clear functional hierarchy.

## Shapes
This design system adopts a **Soft (1)** shape language. The subtle 0.25rem (4px) base radius ensures the UI feels modern and approachable without veering into the "playful" territory of highly rounded or pill-shaped systems. This precision reinforces the professional, premium nature of the light-mode aesthetic.

## Components
- **Buttons:** Primary buttons use the `#6C63FF` background with white text. Secondary buttons use a white background with a `#2D2D2D` 1px border and text.
- **Input Fields:** Pure white background with a `#E5E7EB` border. On focus, the border transitions to `#6C63FF` with a subtle 2px glow.
- **Cards:** Defined by a 1px border of `#E5E7EB` on a `#FFFFFF` surface. Titles should be bold and use the headline font.
- **Chips:** Small, low-contrast pills using a `#F3F4F6` background and `#4B5563` text to keep them visually subordinate to primary buttons.
- **Lists:** Separated by thin, horizontal `#F3F4F6` lines. Active items use a subtle `#6C63FF` left-edge accent (2px width).
- **Checkboxes/Radio:** Use the primary color for checked states. The unchecked state is a simple `#D1D5DB` stroke to maintain a clean, high-contrast look.