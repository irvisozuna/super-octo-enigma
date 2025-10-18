# 📄 Documents Module

Enterprise-level document management module with polymorphic associations, allowing any module in the system to manage documents with flexible metadata.

## 🎯 Purpose

Provides centralized document management that can be used by any module through polymorphic relationships. Documents can be associated with any entity (employees, projects, reports, etc.) with context-specific metadata.

## 🏗️ Architecture

This module follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture**:

```
DocumentsModule/
├── domain/                          # Business logic & rules
│   ├── entities/
│   │   └── DocumentEntity.ts        # Core business entity
│   ├── repositories/
│   │   └── DocumentRepository.ts    # Repository interface
│   └── value-objects/
│       └── DocumentMetadata.ts      # Metadata value object
│
├── application/                     # Use cases & orchestration
│   ├── dtos/
│   │   └── DocumentDtos.ts          # Data Transfer Objects
│   ├── mappers/
│   │   └── DocumentMapper.ts        # Entity-DTO mappers
│   └── services/
│       └── DocumentApplicationService.ts # Application service
│
├── infrastructure/                  # External implementations
│   ├── api/
│   │   └── services/
│   │       └── DocumentApiService.ts # HTTP API client
│   └── persistence/
│       └── repositories/
│           └── DocumentRepositoryImpl.ts # Repository implementation
│
├── presentation/                    # UI layer
│   ├── views/
│   │   ├── DocumentList.vue        # Document list view
│   │   ├── DocumentCreate.vue      # Document creation view
│   │   ├── DocumentEdit.vue        # Document editing view
│   │   └── DocumentDetail.vue      # Document detail view
│   ├── stores/
│   │   └── documentStore.ts        # Pinia store
│   └── components/
│       └── organisms/              # Vue components
│
├── config/                          # Module configuration
│   ├── routes.ts                   # Route definitions
│   ├── menu.ts                     # Menu configuration
│   ├── permissions.ts              # Permission definitions
│   └── container.ts                # Dependency injection
│
├── shared/                          # Shared utilities
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── contracts/
│       └── INotificationService.ts # Service contracts
│
├── locales/                         # Internationalization
│   ├── es.json                     # Spanish translations
│   └── en.json                     # English translations
│
├── index.ts                         # Main entry point
├── installer.ts                     # Module installer
└── README.md                        # This file
```

## 📊 Key Features

### Core Functionality
- ✅ **CRUD Operations** - Create, Read, Update, Delete documents
- ✅ **File Upload** - Secure file upload with validation
- ✅ **Version Control** - Document versioning and history
- ✅ **Share Links** - Public and private document sharing
- ✅ **Metadata Management** - Flexible metadata with templates
- ✅ **Access Control** - Role-based permissions
- ✅ **Search & Filter** - Advanced search capabilities
- ✅ **Bulk Operations** - Bulk upload, update, delete
- ✅ **Export/Import** - Multiple format support
- ✅ **Audit Trail** - Complete access logging

### Document Types
- **Contracts** - Legal agreements and contracts
- **Invoices** - Financial invoices and billing
- **Reports** - Technical and business reports
- **Images** - Photos and visual content
- **Certificates** - Professional certifications
- **Permits** - Legal permits and licenses
- **Blueprints** - Technical drawings and plans
- **Spreadsheets** - Data and calculation files
- **Presentations** - Slides and presentations
- **Legal** - Legal documents and IDs
- **Financial** - Financial reports and statements
- **Technical** - Technical documentation
- **Other** - Any other file type

### Categories
- **Legal** - Legal documents and contracts
- **Financial** - Financial reports and invoices
- **Technical** - Technical documentation
- **Administrative** - General administrative docs
- **Operational** - Operational procedures
- **Compliance** - Compliance documents
- **HR** - Human resources documents
- **Marketing** - Marketing materials
- **Confidential** - Confidential documents
- **General** - General documents

## 🔌 API Endpoints

Base URL: `/api/document-management`

### Document Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Upload document |
| GET | `/` | List documents by resource |
| GET | `/{id}` | Get document details |
| GET | `/{id}/download` | Download document |
| PUT | `/{id}` | Update document |
| DELETE | `/{id}` | Delete document |

### Share Links (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/{documentId}/share-links` | Create share link |
| GET | `/{documentId}/share-links` | List share links |
| PUT | `/{documentId}/share-links/{shareLinkId}` | Update share link |
| DELETE | `/{documentId}/share-links/{shareLinkId}` | Revoke share link |

### Public Share Access (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shared/documents/{token}/check` | Check access requirements |
| GET | `/api/shared/documents/{token}` | View document info |
| GET | `/api/shared/documents/{token}/download` | Download document |

### Metadata Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metadata-templates` | Get all available templates |
| GET | `/metadata-templates/{resourceType}/{subtype?}` | Get specific template |

## 🚀 Usage

### Installation

```typescript
import { installDocumentsModule } from '@/modules/DocumentsModule/installer'

// Install the module
installDocumentsModule(app)
```

### Basic Usage

```typescript
import { useDocumentStore } from '@/modules/DocumentsModule'

// Use the store
const documentStore = useDocumentStore()

// Fetch documents
await documentStore.fetchDocuments()

// Create document
const document = await documentStore.createDocument({
  title: 'My Document',
  resource_type: 'employee',
  resource_id: '123',
  document_type: 'contract',
  category: 'legal',
  file: fileObject
})
```

### Using in Components

```vue
<template>
  <div>
    <VBtn @click="uploadDocument">
      Upload Document
    </VBtn>
    
    <VDataTable
      :items="documentStore.items"
      :loading="documentStore.isLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { useDocumentStore } from '@/modules/DocumentsModule'

const documentStore = useDocumentStore()

const uploadDocument = async () => {
  // Upload logic here
}
</script>
```

## 🔒 Security Features

### Core Security Measures
- ✅ **File Upload Security** - File size, type, and content validation
- ✅ **Access Control** - Role-based permissions and restrictions
- ✅ **Rate Limiting** - IP and token-based rate limiting
- ✅ **Attack Prevention** - SQL injection, XSS, and CSRF protection
- ✅ **Audit & Monitoring** - Complete security event logging
- ✅ **Share Link Security** - Secure tokens and password protection

### Security Configuration

```typescript
// Rate limiting configuration
const securityConfig = {
  rate_limiting: {
    max_attempts_per_ip: 10,
    max_attempts_per_token: 5,
    window_minutes: 60,
  },
  file_validation: {
    max_size_mb: 100,
    scan_for_malware: true,
    validate_mime_types: true,
  }
}
```

## 📋 Metadata Structure

The module supports flexible metadata structures for different document types:

### Identification Documents
```json
{
  "id_type": "driver_license",
  "id_number": "A1234567",
  "issue_date": "2023-01-15",
  "expiry_date": "2028-01-15",
  "issuing_authority": "DMV California"
}
```

### Contract Documents
```json
{
  "contract_number": "CTR-2024-001",
  "contract_type": "service",
  "contract_value": 150000.00,
  "currency": "USD",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

### Drilling Report Documents
```json
{
  "report_date": "2024-01-15",
  "report_number": "DR-2024-001",
  "well_name": "Well-A1",
  "well_depth_start": 1500,
  "well_depth_end": 1545,
  "shift": "day",
  "crew_chief": "John Smith"
}
```

## 🧪 Testing

The module includes comprehensive testing:

```bash
# Run all tests
npm test DocumentsModule

# Run specific test suites
npm test DocumentsModule/domain
npm test DocumentsModule/application
npm test DocumentsModule/infrastructure
npm test DocumentsModule/presentation
```

## 📝 Examples

### Upload Document with Metadata

```typescript
const document = await documentStore.createDocument({
  title: 'Employee ID Card',
  description: 'Driver license for John Doe',
  resource_type: 'employee',
  resource_id: 'emp-123',
  resource_subtype: 'identification',
  document_type: 'legal',
  category: 'hr',
  tags: ['identification', 'employee-docs'],
  metadata: {
    id_type: 'driver_license',
    id_number: 'A1234567',
    issue_date: '2023-01-15',
    expiry_date: '2028-01-15',
    issuing_authority: 'DMV California'
  },
  file: fileObject
})
```

### Create Share Link

```typescript
const shareLink = await documentStore.createShareLink(documentId, {
  password: 'securePassword123',
  expires_at: '2024-12-31 23:59:59',
  max_downloads: 5,
  permissions: ['view', 'download'],
  allowed_emails: ['auditor@company.com']
})
```

### Search Documents

```typescript
const results = await documentStore.searchDocuments({
  title: 'contract',
  document_type: 'contract',
  category: 'legal',
  date_from: '2024-01-01',
  date_to: '2024-12-31'
})
```

## 🔗 Integration with Other Modules

### From Employee Module
```typescript
// Upload employee identification document
const idDocument = await documentStore.createDocument({
  title: 'Employee ID',
  resource_type: 'employee',
  resource_id: employeeId,
  resource_subtype: 'identification',
  document_type: 'legal',
  category: 'hr',
  metadata: {
    id_type: 'passport',
    id_number: 'P123456789',
    issue_date: '2023-01-15',
    expiry_date: '2033-01-15'
  },
  file: passportFile
})
```

### From Project Module
```typescript
// Upload project contract
const contract = await documentStore.createDocument({
  title: 'Service Contract',
  resource_type: 'project',
  resource_id: projectId,
  resource_subtype: 'contract',
  document_type: 'contract',
  category: 'legal',
  metadata: {
    contract_number: 'CTR-2024-001',
    contract_type: 'service',
    contract_value: 150000.00,
    currency: 'USD'
  },
  file: contractFile
})
```

## 🆘 Support

For issues or questions about this module:

1. Check this README
2. Review the implementation files
3. Check the test files for usage examples
4. Contact the development team

## 📄 License

This module is part of the enterprise application and follows the same licensing terms.
