---
name: Obsidian Kinetic
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-code-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  space-4xl: 3rem
  gutter-canvas: 1.5rem
  sidebar-width: 17.5rem
  inspector-width: 22rem
---

## Brand & Style

The design system embodies the high-velocity, razor-sharp focus demanded by top-tier modern digital creators, video editors, and studio teams. Drawing inspiration from precision productivity tools like Linear, Vercel, Descript, and Riverside, the aesthetic leans into dark-mode minimalism paired with high-performance utility and restrained electric vibrancy.

The interface delivers an atmosphere of effortless speed, computational intelligence, and studio-grade craftsmanship. Creators spend long hours scrubbing timelines, generating AI clips, and evaluating virality scores; thus, the UI removes visual noise, suppresses eye strain, and reserves saturation strictly for high-value metrics, active playback states, and AI generation hooks.

### Core Visual Principles
- **Deep Obsidian Surfaces:** Near-black obsidian canvases (#090A0F) create infinite contrast for rich media while allowing video clips, audio waveforms, and preview canvases to pop with dynamic presence.
- **Micro-Luminescent Accents:** High-frequency Electric Indigo (#6366F1) acts as the interactive spark, balanced by a sharp Neon Emerald (#10B981) specifically reserved for virality scoring, high engagement indicators, and completed processing badges.
- **Precision Engineering:** Monoline razor strokes, tight optical bounding boxes, and meticulous typography evoke the feeling of high-end creative software built on native machine code.

## Colors

The color system is constructed around deep obsidian layers, cold slate neutrals, and high-energy luminescent accents. Contrast ratios strictly adhere to WCAG AAA standards for body readability against dark canvases.

### Surface System
- **Canvas Base:** `#090A0F` — The root viewport background. Deepest ground plane.
- **Canvas Subdued:** `#0E1117` — Sidebars, timeline tracks, and inactive utility panels.
- **Surface Level 1 (Card Default):** `#151821` — Structural cards, video clip containers, clip queues.
- **Surface Level 2 (Elevated / Hover):** `#1C202C` — Dropdowns, modals, floating action toolbars, and active card states.
- **Surface Level 3 (Active / Inset):** `#232836` — Waveform scrub containers, media canvas backdrops, input fill surfaces.

### Border & Divider Tokens
- **Border Subtle:** `#1F2432` — Internal dividers, timeline grid lines, secondary groupings.
- **Border Default:** `#262B3A` — Standard card borders, panel seams, default input outlines.
- **Border Strong:** `#32384C` — Hovered borders, active dialog frames, pinned card highlights.
- **Border Focus / Glow:** `rgba(99, 102, 241, 0.4)` — Active timeline markers, focused inputs, selection rings.

### Typography & Content Neutrals
- **Text Primary:** `#F3F4F6` — Ultra-crisp off-white for headlines, active labels, clip titles, and primary data values.
- **Text Secondary:** `#94A3B8` — Cool slate for meta-labels, timestamps, durations, and secondary navigation.
- **Text Tertiary / Muted:** `#64748B` — Inactive track hints, empty states, disabled icons, and scrubber rulers.

### Accents & Semantic Badges
- **Electric Indigo (Primary):** `#6366F1` — Interactive triggers, primary buttons, timeline playheads, and AI processing indicators.
- **Cyan Glow (Secondary):** `#06B6D4` — Active transcript selections, speaker tagging, audio frequency high-points.
- **Neon Virality Emerald (Tertiary):** `#10B981` — Virality potential scores (85+), export readiness, published statuses.
- **Amber Warning:** `#F59E0B` — Frame drops, token limits, processing queues under load.
- **Rose Destructive:** `#F43F5E` — Deletion states, audio clipping warnings, processing failures.

## Typography

Typography balances high-density utility with clinical typographic precision.

- **Geist** drives all interfaces, headings, body text, and interactions. Its high x-height, neutral aperture, and geometric discipline provide effortless legibility in dense editing workspaces.
- **JetBrains Mono** anchors timecodes, durations, framerates, virality index numbers, and audio channel gain values. The monospace tabular figures guarantee that timelines and score tickers do not jump or flicker during active playback or scrubbing.
- Strict negative letter-spacing is applied to headings (`-0.02em` to `-0.03em`) to replicate the compressed, modernist editorial feel characteristic of top developer and creative tooling.

## Layout & Spacing

The workspace operates on an explicit **application workspace model** rather than a typical editorial website grid:

### Workspace Architecture
- **Persistent Left Rail (72px collapsed or 280px expanded):** Navigation, project libraries, source media assets, template presets.
- **Central Canvas / Staging Area (Fluid Flex):** 
  - Top: 9:16 vertical video viewport preview canvas with safe margins for social platforms (TikTok, Reels, Shorts).
  - Bottom: Horizontal audio waveform timeline with scrubbing ruler, hook highlight segments, and silence removers.
- **Right Studio Inspector (352px fixed width):** AI parameters, auto-caption styling, viral score diagnostics, speaker detection filters, and one-click export toggles.

### Breakpoint Strategy
- **Desktop Studio (≥ 1280px):** Full multi-pane arrangement (Sidebar + Center Canvas + Inspector). Default target experience.
- **Tablet / Laptop (1024px – 1279px):** Inspector transforms into a dockable slide-over drawer; timeline collapses into mini-scrubber mode.
- **Mobile Handheld (< 1024px):** Single-column stacked layout. Top contains the video preview player; bottom renders tabbed segmented views (Clips Queue, Timeline, Captions).

## Elevation & Depth

Visual depth is achieved through **low-contrast monoline borders paired with deep tonal layering and subtle luminous backdrops**, avoiding traditional muddy box-shadows.

### Layer Hierarchy
1. **Root Bed (`#090A0F`):** Zero elevation. Absorbs edge reflections.
2. **Structural Panels (`#0E1117`):** Delimited by a 1px solid `#1F2432` boundary with zero shadow.
3. **Interactive Cards & Clips (`#151821`):** Inset 1px border (`#262B3A`). Hover states elevate to `#1C202C` with border `#32384C` and a diffuse ambient glow (`0 10px 30px -10px rgba(0, 0, 0, 0.6)`).
4. **Active Selection / Playhead Focus:** 1px border of `#6366F1` plus a soft violet underglow (`0 0 20px -4px rgba(99, 102, 241, 0.25)`).
5. **Floating Overlays & Popovers (`#1C202C`):** Glassmorphic backdrop blur (`backdrop-filter: blur(16px)`) with crisp border (`#32384C`) and floating shadow (`0 20px 40px -15px rgba(0, 0, 0, 0.8)`).

## Shapes

The design system employs a disciplined, slightly rounded radius rule set (`roundedness: 1` base level, tuned to modern SaaS specs):

- **Micro Controls & Badges:** `6px` radius for status chips, virality score tags, and waveform clip handles.
- **Interactive Inputs & Buttons:** `8px` radius for search fields, dropdown buttons, action triggers, and caption text boxes.
- **Cards & Video Viewport Enclosures:** `10px` to `12px` radius for clip cards, video preview containers, and modal sheets.
- **Floating Toolbars & Playback Hubs:** `9999px` full pill shapes for floating play/pause controls, zoom sliders, and audio scrubbing thumbs.

## Components

### Buttons
- **Primary Action (Generate / Export):** Background `#6366F1`, text `#FFFFFF`, font weight 500, radius 8px, height 36px. On hover: `#4F46E5` with subtle box-shadow `0 0 16px rgba(99, 102, 241, 0.35)`. Active scale: `0.98`.
- **Secondary (Tools / Presets):** Background `#151821`, border 1px solid `#262B3A`, text `#F3F4F6`. Hover: surface `#1C202C`, border `#32384C`.
- **Ghost / Icon Utility:** Background transparent, text `#94A3B8`. Hover: background `rgba(255, 255, 255, 0.05)`, text `#F3F4F6`.

### Virality & Status Chips
- **Virality Score Badge:** Container background `#0E231F`, border 1px solid `rgba(16, 185, 129, 0.3)`, text `#10B981`, font family `JetBrains Mono`, text size 11px. Prefixed with a glowing 6px pulsating dot.
- **AI Processing Tag:** Container background `rgba(99, 102, 241, 0.12)`, border 1px solid `rgba(99, 102, 241, 0.35)`, text `#A5B4FC`.

### Video Clip Card
- Encased in `#151821` with a 1px `#262B3A` border and 12px corner radius.
- Includes a 9:16 thumbnail poster with duration pill overlaid bottom-right (`JetBrains Mono`, 10px, semi-translucent black backdrop).
- Top right features the viral indicator chip (e.g., `94 VIRAL INDEX`).
- Footer area contains hook transcript preview text (`Geist`, 12px, truncated at 2 lines) and rapid export actions.

### Audio Waveform & Scrubber Track
- Background container `#090A0F`, inset border 1px `#1F2432`.
- Waveform bars: Inactive segments `#262B3A`; high-energy speech moments `#06B6D4`; AI-detected hook moments `#6366F1`.
- Playhead: 2px hairline `#F3F4F6` needle with a glowing `#6366F1` top diamond handle.

### Form Inputs & Caption Editor
- Height 36px, background `#0E1117`, border 1px solid `#262B3A`, corner radius 8px, text `#F3F4F6`, placeholder `#64748B`.
- Focused state: Border `#6366F1`, box-shadow `0 0 0 1px #6366F1`.
- Caption Word Blocks: Clickable bounding tokens with subtle rounded highlights on word-level timing edit.