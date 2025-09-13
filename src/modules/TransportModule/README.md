# TransportModule

**Comprehensive Transport Management Module for Vue 3 + TypeScript**

This module provides complete transport management functionality following Domain-Driven Design (DDD) principles and Clean Architecture patterns.

## 🏗️ Architecture

### Domain-Driven Design (DDD) Structure

```
TransportModule/
├── 📁 Vehicle/                    # Vehicle Entity
│   ├── domain/
│   │   ├── entities/              # Business entities
│   │   ├── repositories/          # Repository contracts
│   │   └── valueObjects/          # Domain value objects
│   ├── application/
│   │   ├── useCases/              # Business use cases
│   │   ├── commands/              # Command DTOs
│   │   ├── queries/               # Query DTOs
│   │   └── handlers/              # Command/Query handlers
│   ├── infrastructure/
│   │   ├── api/                   # HTTP API services
│   │   ├── repositories/          # Repository implementations
│   │   └── transformers/          # Data transformers
│   └── presentation/
│       ├── components/            # Vue components (Atomic Design)
│       │   ├── atoms/             # Basic UI elements
│       │   ├── molecules/         # Component combinations
│       │   └── organisms/         # Complex UI sections
│       ├── stores/                # Pinia state management
│       ├── composables/           # Vue 3 composables
│       └── validators/            # Form validation
├── 📁 Concession/                 # Concession Entity
├── 📁 Driver/                     # Driver Entity
├── 📁 Fine/                       # Fine Entity
├── 📁 Payment/                    # Payment Entity
├── 📁 Insurance/                  # Insurance Entity
├── 📁 Document/                   # Document Entity
├── 📁 Transfer/                   # Transfer Entity
├── 📁 FinePhoto/                  # Fine Photo Entity
├── 📁 shared/                     # Shared utilities
│   ├── types.ts                   # TypeScript interfaces
│   ├── constants.ts               # Application constants
│   └── utils.ts                   # Utility functions
├── 📁 config/                     # Module configuration
└── 📁 locales/                    # Internationalization
```

### Atomic Design Pattern

Following the `.cursor/rules/vue-rules.mdc` guidelines:

- **Atoms**: Basic UI elements (`VehicleStatusChipAtom`, `VehicleTypeIconAtom`)
- **Molecules**: Simple component groups (`VehicleCardMolecule`)
- **Organisms**: Complex UI sections (`VehicleTableOrganism`)
- **Templates**: Page layouts
- **Pages**: Complete page implementations

## 🚀 Features

### ✅ Complete CRUD Operations
- **Vehicles**: Full vehicle lifecycle management
- **Concessions**: Concession assignment and tracking
- **Drivers**: Driver information and license management
- **Fines**: Traffic violation tracking and payment
- **Payments**: Payment processing and history
- **Insurance**: Policy management and renewal tracking
- **Documents**: File upload and document management
- **Transfers**: Concession transfer workflows

### ✅ Advanced Functionality
- **Search & Filtering**: Advanced search with multiple criteria
- **Statistics & Reports**: Comprehensive analytics dashboard
- **Real-time Validation**: Form validation with immediate feedback
- **File Management**: Document upload with validation
- **Data Export**: Excel, CSV, and PDF export capabilities
- **Multi-tenant Support**: Company-based data isolation
- **Audit Logging**: Complete change tracking
- **Soft Delete**: Reversible deletion with data retention

### ✅ Technical Features
- **TypeScript**: Full type safety throughout the module
- **Vue 3 Composition API**: Modern reactive programming
- **Pinia State Management**: Centralized state with persistence
- **Vuetify UI Components**: Material Design 3 compliance
- **Internationalization**: Multi-language support
- **Accessibility**: WCAG 2.2 AA compliance
- **Performance Optimized**: Lazy loading and code splitting
- **Error Handling**: Comprehensive error management
- **Loading States**: User feedback during operations
- **Responsive Design**: Mobile-first approach

## 📋 API Integration

### Backend Compatibility

The module is designed to work with the **SITCOM Transport Management API** with **82+ endpoints**:

```typescript
// Automatic API integration
const vehicleService = new VehicleService(repository, notificationService)

// Create vehicle
const newVehicle = await vehicleService.createVehicle({
  plate_number: 'ABC-123',
  brand: 'Toyota',
  model: 'Hiace',
  year: 2024,
  vehicle_type: 'MICROBUS',
  capacity: 15,
  status: 'ACTIVE'
})
```

### Supported Entities

| Entity | Endpoints | Features |
|--------|-----------|----------|
| **Vehicles** | 7 | CRUD, Search by Plate, Statistics, Export |
| **Concessions** | 8 | CRUD, Search, Expiring Alerts, Statistics |
| **Drivers** | 8 | CRUD, License Search, Statistics, Validation |
| **Fines** | 8 | CRUD, Payment Tracking, Pending Alerts |
| **Payments** | 7 | CRUD, Financial Reports, Reconciliation |
| **Insurance** | 8 | CRUD, Renewal Alerts, Coverage Tracking |
| **Documents** | 6 | Upload, Download, Version Control |
| **Transfers** | 7 | Approval Workflow, Status Tracking |

## 🛠️ Installation & Usage

### 1. Install the Module

```typescript
// main.ts
import { createApp } from 'vue'
import { TransportModule } from './modules/TransportModule'
import App from './App.vue'

const app = createApp(App)

// Install the Transport Module
app.use(TransportModule)

app.mount('#app')
```

### 2. Use in Components

```vue
<template>
  <div>
    <!-- Vehicle Table Organism -->
    <VehicleTableOrganism
      :vehicles="vehicles"
      :loading="loading"
      :total-items="totalVehicles"
      @create="handleCreateVehicle"
      @edit="handleEditVehicle"
      @delete="handleDeleteVehicle"
    />
    
    <!-- Vehicle Cards Grid -->
    <div class="vehicle-grid">
      <VehicleCardMolecule
        v-for="vehicle in vehicles"
        :key="vehicle.id"
        :vehicle="vehicle"
        :clickable="true"
        @click="handleVehicleClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVehicleStore } from './modules/TransportModule/Vehicle/presentation/stores/vehicleStore'
import VehicleTableOrganism from './modules/TransportModule/Vehicle/presentation/components/organisms/VehicleTableOrganism.vue'
import VehicleCardMolecule from './modules/TransportModule/Vehicle/presentation/components/molecules/VehicleCardMolecule.vue'

const vehicleStore = useVehicleStore()

// Initialize with authentication
vehicleStore.initialize(authToken, companyId)

// Load vehicles
await vehicleStore.loadVehicles()

// Reactive state
const { vehicles, loading, totalVehicles } = storeToRefs(vehicleStore)
</script>
```

### 3. Store Management

```typescript
// Use the Pinia store
const vehicleStore = useVehicleStore()

// Create vehicle
const newVehicle = await vehicleStore.createVehicle({
  plate_number: 'XYZ-789',
  brand: 'Ford',
  model: 'Transit',
  year: 2023,
  vehicle_type: 'MICROBUS',
  capacity: 12,
  status: 'ACTIVE'
})

// Search vehicles
await vehicleStore.searchVehicles({
  vehicle_type: 'MICROBUS',
  status: 'ACTIVE'
})

// Export data
const blob = await vehicleStore.exportVehicles('excel')
```

## ⚙️ Configuration

### Module Configuration

```typescript
// config/moduleConfig.ts
export const TransportModuleConfig = {
  api: {
    baseUrl: '/api/transport',
    timeout: 30000,
    retries: 3
  },
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },
  validation: {
    plateNumberMaxLength: 10,
    vinMaxLength: 17,
    maxFileSize: 5 * 1024 * 1024 // 5MB
  },
  features: {
    enableSoftDelete: true,
    enableAuditLogs: true,
    enableRealTimeUpdates: false
  }
}
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost/api/transport
VITE_COMPANY_ID=your-company-id
VITE_AUTH_TOKEN=your-auth-token
```

## 🎨 UI/UX Design System

### Atomic Design Components

Following the project's design system:

```vue
<!-- Atoms -->
<VehicleStatusChipAtom :status="vehicle.status" />
<VehicleTypeIconAtom :vehicle-type="vehicle.vehicle_type" />

<!-- Molecules -->
<VehicleCardMolecule :vehicle="vehicle" @click="handleClick" />

<!-- Organisms -->
<VehicleTableOrganism 
  :vehicles="vehicles"
  @create="handleCreate"
  @edit="handleEdit"
/>
```

### Design Tokens

```scss
// State Colors (from vue-rules.mdc)
$success-color: #16A34A;
$warning-color: #EAB308;
$error-color: #DC2626;
$info-color: #2563EB;

// Accessibility
.vehicle-card {
  min-height: 44px; // WCAG 2.2 AA compliance
  border-radius: 12px;
  transition: all 200ms ease;
}
```

## 🧪 Testing

### Unit Tests Structure

```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/VehicleEntity.test.ts
│   │   └── repositories/VehicleRepository.test.ts
│   ├── application/
│   │   └── useCases/VehicleService.test.ts
│   ├── infrastructure/
│   │   └── api/VehicleApiService.test.ts
│   └── presentation/
│       ├── stores/vehicleStore.test.ts
│       └── components/VehicleTableOrganism.test.ts
└── e2e/
    ├── vehicle-crud.cy.ts
    └── vehicle-search.cy.ts
```

### Example Test

```typescript
// tests/unit/domain/entities/VehicleEntity.test.ts
import { describe, it, expect } from 'vitest'
import { VehicleDomain } from '@/modules/TransportModule/Vehicle/domain/entities/VehicleEntity'

describe('VehicleEntity', () => {
  it('should validate vehicle data correctly', () => {
    const validData = {
      plate_number: 'ABC-123',
      brand: 'Toyota',
      model: 'Hiace',
      year: 2024,
      vehicle_type: 'MICROBUS',
      capacity: 15,
      status: 'ACTIVE'
    }

    const errors = VehicleDomain.validate(validData)
    expect(errors).toHaveLength(0)
  })

  it('should return errors for invalid data', () => {
    const invalidData = {
      plate_number: '', // Empty plate number
      brand: 'Toyota',
      model: 'Hiace',
      year: 1800, // Invalid year
      vehicle_type: 'MICROBUS',
      capacity: 0, // Invalid capacity
      status: 'ACTIVE'
    }

    const errors = VehicleDomain.validate(invalidData)
    expect(errors.length).toBeGreaterThan(0)
  })
})
```

## 🔧 Development Guidelines

### Code Style

- Follow TypeScript strict mode
- Use Composition API for all Vue components
- Implement proper error handling
- Add JSDoc comments for public methods
- Follow the project's ESLint configuration

### Component Guidelines

```vue
<!-- Component Template -->
<template>
  <VCard class="transport-component">
    <!-- Use design system components -->
    <VCardText>
      <!-- Implement proper accessibility -->
      <VBtn
        :aria-label="t('vehicle.create')"
        @click="handleCreate"
      >
        {{ t('vehicle.create') }}
      </VBtn>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
// Use proper TypeScript interfaces
interface Props {
  vehicle: VehicleEntity
  loading?: boolean
}

// Implement proper reactive patterns
const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Use i18n for all text
const { t } = useI18n()
</script>

<style scoped>
/* Follow design system guidelines */
.transport-component {
  border-radius: 12px;
  transition: all 200ms ease;
}
</style>
```

## 📈 Performance Considerations

### Optimization Strategies

- **Lazy Loading**: Components load on demand
- **Virtual Scrolling**: For large datasets
- **Debounced Search**: 300ms delay for search inputs
- **Memoization**: Computed properties for expensive calculations
- **Bundle Splitting**: Code splitting per entity
- **Image Optimization**: WebP format with fallbacks
- **Caching**: API response caching with TTL

### Bundle Size Targets

- **Module Bundle**: ≤ 200 kB per route
- **Component Bundle**: ≤ 50 kB per organism
- **Asset Optimization**: Images ≤ 100 kB

## 🌐 Internationalization

### Supported Languages

- **Spanish (es)**: Primary language
- **English (en)**: Secondary language

### Translation Keys

```json
{
  "vehicle": {
    "vehicles": "Vehículos",
    "createVehicle": "Crear Vehículo",
    "plateNumber": "Número de Placa",
    "vehicleType": "Tipo de Vehículo",
    "status": "Estado",
    "capacity": "Capacidad",
    "inspectionDue": "Inspección Vencida"
  }
}
```

## 🚨 Error Handling

### Error Management Strategy

```typescript
// Centralized error handling
try {
  const vehicle = await vehicleService.createVehicle(data)
} catch (error) {
  // Automatic notification display
  // Error logging to console
  // User-friendly error messages
  // Validation error extraction
}
```

### Error Types

- **Validation Errors**: Form field validation
- **Network Errors**: Connection issues
- **Authentication Errors**: Token expiration
- **Business Rule Errors**: Domain constraint violations
- **Server Errors**: Internal server issues

## 📝 License

This module is part of the SITCOM project and follows the same license terms.

## 🤝 Contributing

1. Follow DDD principles for new entities
2. Implement Atomic Design for UI components
3. Add comprehensive tests for all functionality
4. Update documentation for new features
5. Follow the project's coding standards

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-10  
**Compatibility**: Vue 3.5+, TypeScript 5.0+, Vuetify 3.7+