# DynamicReports Module

This module was generated using the DDD Module Generator.

## Overview

The DynamicReports module follows Domain-Driven Design principles and provides a complete, functional implementation for managing Connection, DataSource, Report, Execution entities.

## Architecture

This module is structured following DDD layers:

### Domain Layer
- **Entities**: Core business objects
- **Value Objects**: Immutable objects representing concepts
- **Repositories**: Contracts for data access
- **Events**: Domain events for business processes
- **Exceptions**: Domain-specific exceptions
- **Specifications**: Business rules and queries

### Application Layer
- **Commands**: Input DTOs for write operations
- **Queries**: Input DTOs for read operations
- **Handlers**: Business logic implementation
- **DTOs**: Data transfer objects
- **Mappers**: Data transformation logic
- **Use Cases**: Application services

### Infrastructure Layer
- **API Services**: External API communication
- **Repository Implementations**: Data access implementation
- **Transformers**: Data transformation for external APIs

### Presentation Layer
- **Views**: Vue.js page components
- **Components**: Reusable UI components
- **Stores**: Pinia state management
- **Composables**: Vue 3 composition functions
- **Validators**: Form validation schemas

## Features

- ✅ Complete CRUD operations
- ✅ Domain-driven design implementation
- ✅ TypeScript support
- ✅ Vue 3 Composition API
- ✅ Pinia state management
- ✅ Form validation with Yup
- ✅ Responsive UI components
- ✅ Error handling
- ✅ Loading states
- ✅ Pagination support
- ✅ Search and filtering
- ✅ Unit tests structure

## Usage

### Installation

```typescript
import { DynamicReportsModule } from './modules/DynamicReports'

// In your main app
app.use(DynamicReportsModule)
```

### Using the Store

```typescript
import { useConnectionStore } from './modules/DynamicReports/Connection/presentation/stores/connectionStore'

const store = useConnectionStore()
await store.fetchList()
```

### Using Components

```vue
<template>
  <ConnectionTable :items="items" @edit="handleEdit" />
</template>

<script setup>
import ConnectionTable from './modules/DynamicReports/Connection/presentation/components/organisms/ConnectionTable.vue'
</script>
```

## Configuration

The module can be configured through the `DynamicReportsConfig` object:

```typescript
import { DynamicReportsConfig } from './modules/DynamicReports'

// Modify configuration
DynamicReportsConfig.settings.defaultPageSize = 50
```

## API Endpoints

The module expects the following API endpoints:

- `GET /api/dynamic-reports/connections` - List Connections
- `POST /api/dynamic-reports/connections` - Create Connection
- `GET /api/dynamic-reports/connections/:id` - Get Connection by ID
- `PUT /api/dynamic-reports/connections/:id` - Update Connection
- `DELETE /api/dynamic-reports/connections/:id` - Delete Connection

## Contributing

When contributing to this module:

1. Follow DDD principles
2. Maintain separation of concerns
3. Add tests for new functionality
4. Update documentation
5. Follow the existing code style

## License

This module is part of the main application and follows the same license terms.
