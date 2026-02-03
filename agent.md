# Agent Development Notes

## Recent Changes

### Shared Components (`frontend/src/app/shared/`)

#### PageHeaderComponent
- Reusable page header with title, description, and breadcrumb navigation
- Compact styling for better content space
- Responsive design with smaller fonts on mobile

#### ToolCardComponent
- Reusable card for displaying tools and categories
- Supports two color variants: `accent` (teal) and `sun` (gold)
- Hover effects with lift animation
- Consistent height with 2-line description clamp

### Tool Catalog Pages

#### `/tools` - Main Tools Landing
- Shows all tool categories as cards
- Entry point for the application

#### `/tools/language` - Language Tools
- Lists language/text processing tools
- Currently includes: Metin Analizi (Text Analysis)

#### `/tools/engineering` - Engineering Tools
- Lists engineering/calculation tools
- Currently includes: Hesap Makinesi (Calculator), Grafik Çizimi (Graph), STL Görüntüleyici (STL Viewer)

### STL Viewer (`/tools/engineering/stl-viewer`)
- 3D STL file viewer using Three.js
- Features:
  - Drag & drop or file picker upload
  - OrbitControls for rotation/zoom/pan
  - View modes: Solid / Wireframe
  - Customizable model and background colors
  - Grid and axes helpers (toggleable)
  - Auto-rotate option
  - Screenshot export
  - Model statistics: triangles, vertices, dimensions, volume, surface area

### Design System

#### Spacing (Compact)
- Page gaps: 16px
- Grid gaps: 12px (mobile: 10px)
- Card padding: 16px 20px

#### Typography
- Page title: 1.5rem (mobile: 1.25rem)
- Card title: 1rem
- Description: 0.85rem
- Breadcrumb: 0.8rem

### Routes

```text
/                    → redirects to /tools
/tools               → ToolsPageComponent
/tools/language      → LanguagePageComponent
/tools/language/text-analysis → AnalyzePageComponent
/tools/engineering   → EngineeringPageComponent
/tools/engineering/calculator → CalculatorPageComponent
/tools/engineering/graph → GraphPageComponent
/tools/engineering/stl-viewer → StlViewerComponent
```

### Build System

- **Builder**: `@angular-devkit/build-angular:application` (esbuild)
- **Configurations**:
  - `production`: optimized build with output hashing
  - `development`: source maps enabled, no optimization
- **Default**: `ng build` uses production, `ng serve` uses development
