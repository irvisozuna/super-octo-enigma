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
- **UI Framework**: Vuetify 3.7.5
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
├── domain/           # Business logic and entities
├── application/      # Use cases and application services
├── infrastructure/   # External integrations and data access
├── presentation/     # Vue components, stores, composables
├── shared/          # Shared utilities within module
├── tests/           # Module-specific tests
├── container.ts     # Dependency injection
├── types.ts         # Module types
├── index.ts         # Module exports
└── README.md        # Module documentation
```

#### Core Directories
- `src/@core/` - Shared core components and utilities
- `src/@layouts/` - Layout components
- `src/components/` - Global components (auto-imported)
- `src/composables/` - Vue composables (auto-imported)
- `src/stores/` - Pinia stores
- `src/plugins/` - Vue plugins and configurations
- `src/pages/` - File-based routing pages
- `src/utils/` - Utility functions (auto-imported)

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
- TypeScript type definitions
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

### Browser Support
- Modern browsers with ES2020+ support
- Vue 3 requirements apply
- Responsive design for mobile and desktop