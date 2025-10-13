# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally (port 5050)
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Lint code with ESLint and auto-fix issues

### Testing
- `npm test` or `npm run test` - Run tests in watch mode (Vitest)
- `npm run test:unit` - Run unit tests once
- `npm run test:e2e` - Run end-to-end tests (Cypress)
- `npm run test:coverage` - Run tests with coverage report

### Module Generation
- `npm run generate:module` - Interactive DDD module generator
- `npm run generate:module:list` - List existing modules
- `npm run generate:module:test` - Test module generation

### Build Tools
- `npm run build:icons` - Build iconify icons
- `npm run postinstall` - Runs after npm install (builds icons + MSW init)

## Architecture Overview

### Tech Stack
- **Frontend Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **UI Framework**: Vuetify 3.10+
- **State Management**: Pinia
- **TypeScript**: Full TypeScript support with vue-tsc
- **Testing**: Vitest (unit) + Cypress (e2e)
- **Internationalization**: Vue I18n
- **Form Validation**: VeeValidate + Zod/Yup
- **Charts**: ApexCharts, Chart.js
- **Rich Text**: TipTap editor

### Project Structure

#### Modular DDD Architecture
The project follows Domain-Driven Design (DDD) principles with modules in `src/modules/`:

```
src/modules/<ModuleName>/
├── domain/              # Business logic and entities
├── application/         # Use cases and application services
├── infrastructure/      # External integrations and data access
├── presentation/        # Vue components, stores, composables
├── views/               # Module-specific view components
├── components/          # Module-specific reusable components
├── stores/              # Module-specific Pinia stores
├── composables/         # Module-specific composables
├── locales/             # Module-specific i18n translations
├── shared/              # Shared utilities within module
├── tests/               # Module-specific tests
├── container.ts         # Dependency injection
├── types.ts             # Module types
├── routes.ts            # Module route definitions
├── menu.ts              # Module menu configuration
├── module.config.ts     # Module configuration
├── indexedDbConfig.ts   # IndexedDB configuration (optional)
├── index.ts             # Module exports
└── README.md            # Module documentation
```

**Note**: Some complex modules may contain sub-modules (e.g., `DynamicReports` has `Connection`, `DataSource`, `Report` sub-modules), each following a similar structure.

#### Core Directories
- `src/@core/` - Shared core components and utilities
- `src/@layouts/` - Layout components
- `src/components/` - Global components (auto-imported)
- `src/composables/` - Vue composables (auto-imported)
- `src/stores/` - Global Pinia stores
- `src/plugins/` - Vue plugins and configurations
- `src/pages/` - File-based routing pages
- `src/views/` - View components
- `src/utils/` - Utility functions (auto-imported)
- `src/navigation/` - Navigation menus and breadcrumbs
- `src/layouts/` - Page layout templates
- `src/services/` - API services and business logic
- `src/validations/` - Shared validation schemas
- `src/types/` - Global TypeScript type definitions
- `src/config/` - Application configuration files

### Design System

#### Atomic Design Pattern
The project follows Atomic Design principles defined in `.cursor/rules/vue-rules.mdc`:

- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Simple component groups (header bars, form fields)
- **Organisms**: Complex UI sections (forms, tables, dialogs)
- **Templates**: Page layouts
- **Pages**: Complete page implementations

#### Component Naming Convention
- `ComponentNameAtom.vue` - Basic elements
- `ComponentNameMolecule.vue` - Simple combinations
- `ComponentNameOrganism.vue` - Complex sections
- `ComponentNameTemplate.vue` - Layout templates
- `ComponentNamePage.vue` - Full pages

#### UI Standards
- **Accessibility**: WCAG 2.2 AA compliance required
- **Performance**: Bundle size ≤ 200 kB/route
- **Colors**: Use design tokens, no hard-coded values
- **Internationalization**: All text through `t()` helpers
- **State Colors**: Success `#16A34A`, Warning `#EAB308`, Error `#DC2626`, Info `#2563EB`

### Module Generation

#### Creating New Modules
Use the interactive generator for consistent DDD module structure:

```bash
npm run generate:module
```

This creates a complete module with:
- Domain entities and repositories
- Application use cases and DTOs
- Infrastructure API services
- Presentation components and stores
- Module-specific routes and menu configuration
- Module-specific views and components
- Module-specific locales (i18n)
- TypeScript type definitions
- IndexedDB configuration (for offline support)
- Basic test structure

#### Module Features
Generated modules include:
- Complete CRUD operations
- Form validation with Yup/Zod
- Pinia state management
- Vue 3 Composition API
- Responsive UI components
- Error handling and loading states
- Pagination and filtering
- Unit test scaffolding

### Key Technologies & Patterns

#### Auto-imports
- Vue 3 composables
- VueUse utilities
- Vue Router
- Pinia stores
- i18n functions
- Custom composables from `src/composables/`
- Utilities from `src/utils/`

#### Component Auto-registration
Components from these directories are auto-imported:
- `src/@core/components`
- `src/views/demos`
- `src/components`

#### Styling
- **SCSS**: Vuetify variables in `src/assets/styles/variables/_vuetify.scss`
- **Theme**: Configured in `themeConfig.ts`
- **Icons**: Iconify icons with Tabler and Material Design sets

#### Form Handling
- **VeeValidate**: Form validation library
- **Zod/Yup**: Schema validation
- **Real-time validation**: Validate on input & blur
- **Error messages**: Max 80 characters

### Development Guidelines

#### Code Quality
- Run `npm run lint` before committing
- Run `npm run typecheck` to verify TypeScript
- Follow existing patterns in similar modules
- Use design system components from `.cursor/rules/vue-rules.mdc`

#### Testing Strategy
- Unit tests with Vitest for business logic
- Component tests with Vue Test Utils
- E2E tests with Cypress for critical user flows
- Run `npm run test:coverage` for coverage reports

#### Module Development
1. Use `npm run generate:module` for new features
2. Follow DDD layering in generated structure
3. Implement domain logic first, then infrastructure
4. Create presentation components following Atomic Design
5. Add comprehensive tests for each layer

### Configuration Files

#### Key Config Files
- `vite.config.ts` - Vite build configuration with plugins
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `themeConfig.ts` - UI theme configuration
- `.cursor/rules/vue-rules.mdc` - UI/UX design system rules

#### Path Aliases
- `@/` → `src/`
- `@core/` → `src/@core/`
- `@layouts/` → `src/@layouts/`
- `@images/` → `src/assets/images/`
- `@styles/` → `src/assets/styles/`
- `@themeConfig` → `themeConfig.ts`
- `@validators` → `src/@core/utils/validators`
- `@db/` → `src/plugins/fake-api/handlers/`
- `@api-utils/` → `src/plugins/fake-api/utils/`

### Browser Support
- Modern browsers with ES2020+ support
- Vue 3 requirements apply
- Responsive design for mobile and desktop

### Additional Integrations

#### MSW (Mock Service Worker)
- **MSW Integration**: Mock Service Worker configured for API mocking during development
- **Initialization**: `npm run msw:init` - Initialize MSW for browser mocking
- **Location**: Service worker files in `public/` directory
- **Auto-setup**: MSW initializes automatically on `npm install` via postinstall

#### Maps Integration
- **Mapbox GL**: Integrated for mapping functionality (v3.5.2)
- **Google Maps**: Available via Google Maps API loader and services
- **Configuration**: Map configuration in `src/config/mapbox.ts`
- **Components**: Map components available in `src/components/`

#### Real-time Features
- **Laravel Echo**: WebSocket client for real-time communication (v1.17.1)
- **Pusher**: WebSocket service integration (v8.4.0-rc2)
- **Configuration**: Real-time plugins configured in `src/plugins/`

#### Database & Storage
- **Dexie**: IndexedDB wrapper for client-side storage (v4.0.10)
- **Offline Support**: Client-side data persistence and caching capabilities

#### Development Tools
- **MSW**: Mock Service Worker for API mocking during development
- **Video.js**: Video player integration for media content
- **Shepherd.js**: User tour and onboarding guides
- **Flag Icons**: Country flag icon library integration