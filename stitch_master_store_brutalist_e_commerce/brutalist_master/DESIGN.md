---
name: Brutalist Master
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd9e0'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2fa'
  surface-container: '#f0ecf4'
  surface-container-high: '#eae7ee'
  surface-container-highest: '#e4e1e9'
  on-surface: '#1b1b20'
  on-surface-variant: '#424655'
  inverse-surface: '#303036'
  inverse-on-surface: '#f3eff7'
  outline: '#727786'
  outline-variant: '#c2c6d7'
  surface-tint: '#0057ce'
  primary: '#0054c8'
  on-primary: '#ffffff'
  primary-container: '#1b6cf2'
  on-primary-container: '#fdfaff'
  inverse-primary: '#b1c5ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a810'
  on-tertiary-container: '#4c3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffe174'
  tertiary-fixed-dim: '#e7c433'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#fcf8ff'
  on-background: '#1b1b20'
  surface-variant: '#e4e1e9'
typography:
  display-xl:
    fontFamily: Cairo
    fontSize: 72px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Cairo
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '900'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Cairo
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Cairo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Cairo
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px
  border-width: 3px
  shadow-offset: 4px
---

## Brand & Style

This design system is built on the principles of **Neo-Brutalism**, tailored specifically for a bold, high-impact Arabic e-commerce experience. The brand personality is unapologetic, architectural, and "raw." It rejects the softness of modern SaaS design in favor of heavy strokes, high-contrast intersections, and a visible structural grid. 

The emotional response should be one of immediate authority and "street-wise" reliability. It uses Egyptian Arabic phrasing to create a localized, approachable, yet strikingly modern persona. The interface is not just a container for products; it is a statement of intent.

**Key Visual Pillars:**
- **Intentional Friction:** Using heavy borders and hard shadows to define space rather than subtle gradients.
- **Graphic Hierarchy:** Massive typography that commands attention.
- **RTL-First:** Every structural element is mirrored to support natural Arabic reading patterns, with a focus on right-to-left optical flow.

## Colors

The palette is a high-tension mix of "Deep Space" and "Electric" tones. 

- **Primary (Electric Blue):** Used for navigation cues and primary brand elements.
- **Secondary (Gemini Purple):** Used for badges, categories, and special offers.
- **Accent (Acid Yellow):** Reserved exclusively for high-conversion CTAs and "Add to Cart" functions to provide maximum "pop" against the dark borders.
- **Neutral/Background:** A strict binary of Pure White (#FFFFFF) and Deep Space Black (#0A0A0F). 

**Interaction Principle:** Inversion. When a user interacts with a white element, it should invert to black (or the primary color) immediately with no transition easing, maintaining the "rough" aesthetic.

## Typography

The design system utilizes **Cairo** for all roles. This font was chosen for its exceptional heavy weights, which are essential for the Brutalist look.

- **Headlines:** Use weight 900 (Black). In Egyptian Arabic, these should feel loud and direct (e.g., "أقوى عروض" instead of "أفضل العروض").
- **Body Text:** Use weight 400. Ensure line-height is generous (1.5 - 1.6) to balance the density of the Arabic script against the heavy UI borders.
- **Alignment:** 100% Right-Aligned. No exceptions.
- **Impact:** Use "Display" sizes for price points and hero sections to dominate the screen real estate.

## Layout & Spacing

This design system uses a **Rigid Grid** model. The layout is built on 4px increments, but visually defined by thick black borders that act as structural wireframes.

- **Grid:** A 12-column desktop grid with 0px gutters between borders (elements share a 3px border to create a "blueprint" look).
- **RTL Flow:** Margins are always weighted to the right. On mobile, the "Master Store" branding should sit at the top-right, with the hamburger menu or search at the top-left.
- **Visible Dividers:** Use 3px solid #0A0A0F lines to separate sections. Do not use whitespace alone to create hierarchy; use a line.
- **Breakpoints:**
  - Mobile: 375px (Single column, full-width borders).
  - Tablet: 768px (2-column product cards).
  - Desktop: 1440px (4-column product grids).

## Elevation & Depth

Depth in this design system is **physical, not optical**. We do not use blurs, soft shadows, or transparency.

- **Hard Shadows:** All interactive containers (cards, buttons, inputs) feature a "Hard Offset" shadow. Specifically: `4px 4px 0px #0A0A0F`.
- **RTL Shadow Direction:** Note that shadows should offset to the **left** in a strictly mirrored RTL environment if the light source is perceived from the top-right. For this system, we keep it consistent: `4px 4px 0px #0A0A0F` (Down and Right) regardless of language, to maintain the "stamped" graphic feel.
- **Tonal Layers:** No elevation tiers. Everything exists on the same base plane (#FFFFFF) and is "raised" only by the thickness of its shadow.

## Shapes

The shape language is strictly **Geometric and Sharp**. 

- **Corner Radius:** 0px across all elements (Buttons, Cards, Modals, Inputs).
- **Icons:** Use thick-stroke (2px or 3px) linear icons. Avoid rounded icon sets. The icons should feel as industrial as the typography.
- **Containers:** All product images must be contained within a 3px black border. No "floating" images.

## Components

### Buttons
- **Primary:** Background Acid Yellow (#F4D03F), 3px Black Border, Hard Shadow.
- **Label:** Cairo 900, "اشتري دلوقت" (Buy Now).
- **Hover/Active:** Remove shadow and shift button position 4px down and 4px right to simulate a physical press. Invert colors on secondary buttons.

### Product Cards
- **Structure:** 3px black border, white background. 
- **Image:** Top-aligned, separated from info by a 3px horizontal line.
- **Price Tag:** Large Cairo 900 text in Electric Blue (#1B6CF2).

### Input Fields
- **Default:** 3px black border, white background, placeholder text in grey.
- **Focus:** Background changes to a very light tint of Electric Blue, or border thickness increases to 5px.

### Chips/Badges
- Rectangular, sharp corners. High contrast background (e.g., Gemini Purple for "New Arrivals" or "وصل حديثاً").

### Lists
- Use horizontal 3px lines between list items. Every list item should feel like a row in a ledger.