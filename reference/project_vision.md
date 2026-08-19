# Canada Macro Trade - Project Vision & Explicit Specification

This document serves as the absolute source of truth for the Canada Macro Trade project. It formalizes the design aesthetic, component architecture, data flow, and user experience, ensuring the original vision is never lost or accidentally overwritten during future development phases.

## 1. Core Vision

The Canada Macro Trade platform is a highly interactive, 3D data visualization dashboard designed to map Canadian export dynamics across both the European (EUD) and Indo-Pacific (IPD) target markets. 

It is strictly **NOT** a standard grid-based web application or generic Tailwind dashboard. It is a full-screen, immersive visual experience.

## 2. Technical Architecture

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: SQLite (`db/unified_master.db`) containing raw trade data for 56 combined target countries across EUD and IPD regions.
- **ORM / Backend**: Direct `libsql` execution at `/api/country-metrics` to bypass Prisma build-time URL limitations, guaranteeing robust data fetching for historical trade macros (Total Value and YoY percentage).
- **Core Visualization**: `react-globe.gl` (Three.js powered 3D mapping) and `recharts` for timeline tracking.

## 3. Explicit Layout & Aesthetic Specifications

The layout is a rigid, absolute-positioned overlay system built on top of a 3D canvas.

### Global Canvas
- **Dimensions**: `100vw` by `100vh`, explicitly `overflow: hidden`.
- **Background Color**: Pure `#0B0D17` (Deep Space Blue).
- **Typography**: 
  - Headings / Titles: **Merriweather (Serif)**
  - Body / Data: **Inter (Sans-Serif)**

### Component Breakdown

#### A. GlobeComponent (The Core)
- **Assets**: Uses `earth-dark.jpg` and `earth-topology.png` textures.
- **Colors**:
  - Canada Polygon: Highlighted solid `#F03A47` (Bright Crimson).
  - Target Markets (EUD + IPD): Highlighted `rgba(0, 180, 255, 0.2)` (Neon Blue wash).
- **Interactivity**: Arcs generate dynamically from Canada to all target countries. When a user clicks a target polygon, it triggers the `CountryCard`.

#### B. Header Chart & HUD (Top Bar)
- **Positioning**: Fixed at the top, spanning `100vw`, height `60px`.
- **Visuals**: `rgba(11, 13, 23, 0.65)` background with `blur(10px)` backdrop filter.
- **Data Viz**: A sleek fill line graph (Recharts `AreaChart`) mapping monthly export variations from 2021 to 2026. The chart uses a white semi-transparent fill area with an `#F03A47` vertical reference highlight when a specific year is selected. Labels are minimal (Year underneath, total value floating to the right).

#### C. Timeline Slider
- **Positioning**: Absolute layout directly underneath the HUD Top Bar (`top: 80px`), centered (`left: 50%`, `transform: translateX(-50%)`), `width: 600px`.
- **Styling**: Frosted glass (`blur(10px)`) container. Input range uses `accentColor: #F03A47`. Scrubber interpolates between 2021 and 2026, updating the entire dashboard's state context on change.

#### D. HUD Side Panel (Global Aggregates)
- **Positioning**: Left-aligned beneath the header (`top: 80px`, `left: 20px`), `width: 380px`.
- **Content**: Tracks interpolated global macroeconomic values dynamically based on the year selected by the timeline scrubber.

#### E. The Country Card
- **Trigger**: Opens upon selecting a polygon on the Globe.
- **Positioning**: Bottom center (`bottom: 20px`, `left: 50%`), `width: 350px`.
- **Styling**: `rgba(11, 13, 23, 0.65)`, `blur(10px)`, `border: 1px solid rgba(255,255,255,0.15)`, `borderRadius: 12px`.
- **Data Integrations**: 
  - *Quantitative*: Fetches `Total Year Value` and `YoY Growth` directly from `/api/country-metrics`. Applies `#F03A47` color for negative growth and `#4CAF50` (Green) for positive growth.
  - *Qualitative*: Renders localized context (Historical Backgrounder, Top 5 Major Imports, Current Stance, Yearly Notes) from localized JSON dictionaries.

#### F. Splash Card
- **Trigger**: Renders on initial load, blocking the dashboard until dismissed.
- **Styling**: Heavy blur overlay `rgba(11, 13, 23, 0.85)` with `zIndex: 9999`. 
- **Content**: Onboards the user to scrub the timeline slider to visualize macroeconomic trade shifts globally.

---
> [!IMPORTANT]
> Any future agents, developers, or contributors working on this repository **must** abide by these layout rules. Generic grid replacements or CSS overriding without explicit approval is strictly forbidden.
