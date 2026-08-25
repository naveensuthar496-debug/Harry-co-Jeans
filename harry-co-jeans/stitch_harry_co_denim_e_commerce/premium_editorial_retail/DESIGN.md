---
name: Premium Editorial Retail
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#868381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-xl:
    fontFamily: Montserrat
    fontSize: 84px
    fontWeight: '800'
    lineHeight: 90px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 80px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered for a high-end fashion editorial experience, specifically targeting a Gen Z audience that values authenticity, boldness, and urban sophistication. The aesthetic prioritizes the product as the hero, utilizing a **Minimalist** approach with **High-Contrast** elements. 

The emotional response should be one of confidence and exclusivity. By stripping away decorative UI clutter, the system creates an environment where typography and photography dictate the brand's rhythm. The style is "Safe" yet striking—leveraging familiar geometric structures while pushing the boundaries of scale and whitespace to achieve a premium, boutique feel.

Key attributes include:
- **Urban & Raw:** Utilization of stark blacks and crisp whites to mirror city landscapes.
- **Confident Scale:** Large, unapologetic typography that commands attention.
- **Editorial Fluidity:** A layout that feels like a digital lookbook rather than a traditional database-driven store.

## Colors

The color palette is strictly curated to maintain a premium editorial feel. The primary driver is **#111111 (Black)**, used for all key structural elements, typography, and primary actions to ground the design in authority.

- **Primary:** #111111. Used for headlines, primary buttons, and heavy borders.
- **Secondary:** #FFFFFF. The canvas. Generous white space is mandatory to allow photography to breathe.
- **Accent:** #2C3E50 (Denim Ink). A sophisticated, muted blue used sparingly for interactive highlights, subtle notifications, or secondary branding moments to nod toward the product's denim heritage.
- **Supporting Neutrals:** Off-whites and light grays provide soft background shifts for product grids, while charcoal is reserved for secondary text to ensure legibility without breaking the high-contrast aesthetic.

## Typography

Typography is the cornerstone of this design system. It uses a pairing of **Montserrat** for headlines to provide a bold, geometric, and urban character, and **Inter** for body copy to ensure utilitarian clarity and a modern SaaS-inflected refinement.

- **Headlines:** Must be set with tight letter-spacing to create a "blocky" editorial look. Display sizes should be used for hero sections and category landings.
- **Body:** Inter is used for all descriptive text, ensuring high readability even at smaller sizes.
- **Labels:** Product tags and metadata use uppercase Inter with increased letter-spacing to distinguish them from narrative text.
- **Scale:** On mobile, headline sizes should aggressively scale down to maintain layout integrity while preserving the bold weight.

## Layout & Spacing

The layout follows an **8px spacing system** to ensure mathematical harmony across all components. It utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile.

- **Editorial Whitespace:** Significant vertical padding (`xxl`) is used between sections to create a sense of luxury and focus.
- **The Grid:** Content is typically center-aligned within a 1440px max-width container. 
- **Product Grids:** Use a 24px gutter to maintain a clean separation between high-resolution imagery.
- **Mobile:** Margins are reduced to 16px to maximize the visual impact of product photography on smaller screens.

## Elevation & Depth

To maintain the premium "flat" editorial aesthetic, the design system avoids heavy shadows. Depth is instead communicated through **Tonal Layering** and **Clean Outlines**.

- **Surface Tiers:** Primary content sits on the white background. Overlays (like carts or menus) use a subtle #000000 shadow with 5% opacity and a 20px blur to suggest lift without visual noise.
- **Borders:** Thin 1px borders in #111111 or light gray are used to define zones (e.g., input fields, table rows) instead of shadows.
- **Interactions:** Hover states on images may involve a slight zoom or a 2% opacity overlay rather than traditional elevation changes.

## Shapes

The shape language is disciplined and structured. By using a **Soft (1)** roundedness level, the design system balances the aggression of the "Safe" visual identity with a touch of modern approachability.

- **Standard Elements:** Buttons and input fields use a 0.25rem (4px) or 0.5rem (8px) radius to maintain a professional, architectural feel.
- **Cards:** Product cards should remain sharp or use the absolute minimum radius (4px) to ensure they feel like photographs in a gallery rather than "app" components.
- **Icons:** Should be linear, using a 1.5px or 2px stroke weight to match the clean aesthetic of the typography.

## Components

### Buttons
- **Primary:** Solid #111111 background with white Montserrat uppercase text. 8px rounded corners. Heavy and impactful.
- **Secondary:** Transparent background with a 2px #111111 border. 
- **Ghost:** No border, strictly text with a 1px underline on hover.

### Inputs & Selects
- 1px #111111 border, 8px rounded corners. Large internal padding (16px) for a premium touch. 
- Focus state: Border weight increases to 2px or shifts to the Denim Ink accent.

### Product Cards
- No borders or shadows. The image takes 100% width. 
- Typography (Product Name, Price) is left-aligned underneath the image with generous top-padding.

### Chips & Tags
- Used for sizes and stock status. 
- Rectangular with minimal 4px rounding. Backgrounds are light gray or off-white to keep them secondary to the primary "Add to Cart" actions.

### Navigation
- A minimal top bar. Desktop uses a wide-spread horizontal list; mobile uses a full-screen overlay menu with large-scale Montserrat headlines to maintain the editorial vibe.