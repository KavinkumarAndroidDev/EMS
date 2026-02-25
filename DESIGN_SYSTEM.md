# EMS Design System

## 1. Core Rules
- Use semantic token names only (`primary`, `neutral-900`, etc.).
- Secondary blue is defined in theme but **not used by default page designs**.
- Use only spacing scale: `8, 16, 24, 32, 48, 64, 96`.
- Prefer `primary`, `primary-hover`, `neutral-900`, `white` for most UI.

## 2. Color Tokens
- `primary`: `#17B978`
- `primary-hover`: `#129B65`
- `secondary`: `#00B8D9` (defined only for future accents)
- `neutral-white`: `#FFFFFF`
- `neutral-50`: `#F5F5F5`
- `neutral-100`: `#E5E7EB`
- `neutral-400`: `#9CA3AF`
- `neutral-900`: `#111827`
- `success`: `#22C55E`
- `warning`: `#F59E0B`
- `error`: `#EF4444`

## 3. Typography
- Headings/UI emphasis: `DM Sans`
- Body/forms/content: `Inter`
- H1: `60px`, `600`
- H2: `36px`, `600`
- H3: `24px`, `500`
- Body: `16px`, `400`
- Body Large: `18px`, `400`
- Caption: `14px`, `400`

## 4. Shape + Elevation
- Radius small controls: `8px`
- Radius cards/containers: `16px`
- Radius pills/tags: full
- Card shadow: `0 4px 16px` low opacity
- Modal shadow: stronger than card (`shadow-lg`)

## 5. Buttons
- Filled buttons: 48px height, pill radius, white text, medium/semibold label.
- Primary/Secondary/Danger have hover + active tones.
- Outline buttons: transparent, 1px border, same height as filled.
- Text button: no background, no border, minimal padding, not fixed height.
- Disabled state: lower opacity, no pointer interaction.

## 6. Navigation + Footer
- Header: full width, centered inner wrapper (`container-custom`), vertical center alignment.
- Nav links are text-style buttons with medium weight.
- Search variant header: centered search field (48px), icon-left input.
- Footer: dark background, 3-column top, divider, legal + social bottom row.

## 7. Files To Use
- Tokens: `scss/_variables.scss`
- Buttons: `scss/_buttons.scss`
- Forms: `scss/_forms.scss`
- Layout (header/footer): `scss/_layout.scss`
- Type: `scss/_typography.scss`
- Utilities: `scss/_utilities.scss`

## 8. Compile
```bash
npx sass scss/main.scss css/main.css
```
