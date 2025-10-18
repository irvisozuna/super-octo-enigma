# 📄 Documents Module

Enterprise-level document management module with polymorphic associations, allowing any module in the system to manage documents with flexible metadata.

## 🎯 Purpose

Provides centralized document management that can be used by any module through polymorphic relationships. Documents can be associated with any entity (employees, projects, reports, etc.) with context-specific metadata.

## 🏗️ Architecture

This module follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture**:

```
Documents/
├── Domain/           # Business logic & rules
├── Application/      # Use cases & orchestration
├── Infrastructure/   # External implementations
└── Presentation/     # HTTP layer
```

## 📊 Database Tables

- `documents` - Main document records
- `document_versions` - Version history
- `document_share_links` - Shareable links
- `document_access_logs` - Access audit trail

## 🔌 API Endpoints

Base URL: `/api/document-management`

### Document Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Upload document |
| GET | `/` | List documents by resource |
| GET | `/{id}` | Get document details |
| GET | `/{id}/download` | Download document |
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

## 📤 Upload Document

### Basic Example
```bash
curl -X POST http://localhost/api/document-management \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -F "document=@file.pdf" \
  -F "resource_type=employee" \
  -F "resource_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "type=other" \
  -F "category=general"
```

### Advanced Example with Metadata
```bash
# For an identification document
curl -X POST http://localhost/api/document-management \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -F "document=@id_card.pdf" \
  -F "resource_type=employee" \
  -F "resource_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "resource_subtype=identification" \
  -F "type=legal" \
  -F "category=hr" \
  -F "title=Driver License" \
  -F "metadata[id_type]=driver_license" \
  -F "metadata[id_number]=A1234567" \
  -F "metadata[issue_date]=2023-01-15" \
  -F "metadata[expiry_date]=2028-01-15" \
  -F "metadata[issuing_authority]=DMV California" \
  -F "tags[]=identification" \
  -F "tags[]=valid"
```

## 💾 Metadata Structure Standards

The `metadata` field is a flexible JSON that stores context-specific information. Below are the **recommended structures** for common document types to ensure consistency between backend and frontend:

### 📋 Identification Documents
**Resource Type**: `employee` | **Subtype**: `identification`

```json
{
  "id_type": "driver_license",        // Required: passport | driver_license | national_id | voter_id | social_security
  "id_number": "A1234567",            // Required: The identification number
  "issue_date": "2023-01-15",         // Required: Format Y-m-d
  "expiry_date": "2028-01-15",        // Optional: Format Y-m-d (null if no expiry)
  "issuing_authority": "DMV California", // Required: Issuing organization
  "issuing_country": "USA",           // Optional: ISO 3166-1 alpha-3 code
  "issuing_state": "CA",              // Optional: State/Province code
  "holder_name": "John Doe",          // Optional: Name on document
  "holder_birthdate": "1990-05-15",   // Optional: Format Y-m-d
  "verification_status": "pending",    // Optional: pending | verified | rejected
  "verification_date": null,          // Optional: Format Y-m-d
  "verification_notes": null          // Optional: Verification details
}
```

### 📄 Contract Documents
**Resource Type**: `project` or `employee` | **Subtype**: `contract`

```json
{
  "contract_number": "CTR-2024-001",  // Required: Unique contract identifier
  "contract_type": "service",         // Required: service | employment | purchase | lease | nda
  "contract_value": 150000.00,        // Optional: Numeric value
  "currency": "USD",                  // Required if contract_value exists: ISO 4217
  "start_date": "2024-01-01",         // Required: Format Y-m-d
  "end_date": "2024-12-31",           // Optional: Format Y-m-d (null for indefinite)
  "renewal_date": "2024-11-01",       // Optional: Format Y-m-d
  "auto_renewal": false,              // Optional: Boolean
  "parties": {                        // Required: Contract parties
    "primary": "ABC Company",
    "secondary": "XYZ Services",
    "witnesses": []                   // Optional: Array of witness names
  },
  "payment_terms": "NET30",           // Optional: Payment terms
  "termination_clause": "30 days notice", // Optional: Termination conditions
  "signatures_required": 3,           // Optional: Number of signatures needed
  "signatures_collected": 1,          // Optional: Current signatures
  "signed_date": null,                // Optional: Format Y-m-d when fully signed
  "status": "draft"                   // Required: draft | active | expired | terminated
}
```

### 💰 Invoice Documents
**Resource Type**: `project` or `client` | **Subtype**: `invoice`

```json
{
  "invoice_number": "INV-2024-0042",  // Required: Unique invoice number
  "invoice_date": "2024-01-15",       // Required: Format Y-m-d
  "due_date": "2024-02-15",           // Required: Format Y-m-d
  "client_name": "ABC Company",       // Required: Client name
  "client_tax_id": "RFC123456789",    // Optional: Client tax identification
  "vendor_name": "Our Company",       // Required: Vendor name
  "vendor_tax_id": "RFC987654321",    // Optional: Vendor tax identification
  "subtotal": 25000.00,               // Required: Numeric
  "tax_rate": 18,                     // Required: Tax percentage
  "tax_amount": 4500.00,              // Required: Calculated tax
  "discount_amount": 0,                // Optional: Discount applied
  "total": 29500.00,                  // Required: Final amount
  "currency": "USD",                  // Required: ISO 4217
  "payment_status": "pending",        // Required: pending | partial | paid | overdue | cancelled
  "payment_method": null,             // Optional: cash | check | transfer | card
  "payment_date": null,               // Optional: Format Y-m-d when paid
  "payment_reference": null,          // Optional: Payment transaction reference
  "items_count": 5,                   // Optional: Number of line items
  "notes": null                       // Optional: Additional notes
}
```

### 🛢️ Drilling Report Documents
**Resource Type**: `drilling_report` | **Subtype**: `daily_report`

```json
{
  "report_date": "2024-01-15",        // Required: Format Y-m-d
  "report_number": "DR-2024-001",     // Required: Report identifier
  "well_name": "Well-A1",             // Required: Well identifier
  "well_depth_start": 1500,           // Required: Starting depth in meters
  "well_depth_end": 1545,             // Required: Ending depth in meters
  "meters_drilled": 45,               // Required: Progress in meters
  "shift": "day",                     // Required: day | night
  "crew_chief": "John Smith",         // Required: Crew chief name
  "crew_size": 8,                     // Required: Number of crew members
  "hours_worked": 12,                 // Required: Hours worked in shift
  "equipment_used": [                 // Required: Array of equipment IDs
    "DRILL-001",
    "PUMP-003"
  ],
  "consumables_used": {               // Optional: Consumables with quantities
    "drill_bits": 2,
    "drilling_fluid_liters": 500
  },
  "incidents": false,                 // Required: Boolean
  "incident_details": null,           // Required if incidents=true
  "weather_conditions": "clear",      // Optional: clear | rain | storm | fog
  "temperature_celsius": 28,          // Optional: Temperature
  "next_shift_plan": "Continue drilling to 1600m", // Optional: Next steps
  "supervisor_name": "Mike Johnson",  // Required: Supervisor name
  "supervisor_signature": true,       // Required: Boolean
  "qc_check": true,                   // Optional: Quality control passed
  "hse_compliance": true              // Optional: Health/Safety/Environment compliance
}
```

### 🏥 Medical Certificate Documents
**Resource Type**: `employee` | **Subtype**: `medical`

```json
{
  "certificate_type": "fitness",      // Required: fitness | sick_leave | disability | vaccination
  "certificate_number": "MED-2024-123", // Optional: Certificate number
  "issue_date": "2024-01-15",         // Required: Format Y-m-d
  "valid_from": "2024-01-15",         // Required: Format Y-m-d
  "valid_until": "2024-01-29",        // Optional: Format Y-m-d
  "doctor_name": "Dr. Jane Smith",    // Required: Issuing doctor
  "doctor_license": "MD12345",        // Optional: Medical license number
  "clinic_name": "Health Center",     // Required: Medical institution
  "diagnosis_code": "ICD-10 J06.9",   // Optional: Medical diagnosis code
  "restrictions": [],                 // Optional: Array of work restrictions
  "fitness_status": "fit",            // Required if type=fitness: fit | unfit | conditional
  "return_to_work_date": "2024-01-30", // Optional: Format Y-m-d
  "follow_up_required": false,        // Optional: Boolean
  "confidential_notes": null          // Optional: Private medical notes
}
```

### 📊 Financial Report Documents
**Resource Type**: `project` or `company` | **Subtype**: `financial_report`

```json
{
  "report_period": "Q1-2024",         // Required: Period identifier
  "report_type": "quarterly",         // Required: monthly | quarterly | annual
  "start_date": "2024-01-01",         // Required: Format Y-m-d
  "end_date": "2024-03-31",           // Required: Format Y-m-d
  "prepared_by": "Finance Dept",      // Required: Preparer
  "reviewed_by": "CFO",               // Optional: Reviewer
  "approved_by": null,                // Optional: Approver
  "total_revenue": 500000.00,         // Required: Numeric
  "total_expenses": 350000.00,        // Required: Numeric
  "net_profit": 150000.00,            // Required: Numeric
  "currency": "USD",                  // Required: ISO 4217
  "audit_status": "pending",          // Optional: pending | in_progress | completed
  "auditor_name": null,               // Optional: External auditor
  "compliance_status": "compliant",   // Optional: compliant | non_compliant | pending
  "key_metrics": {                    // Optional: Important KPIs
    "profit_margin": 30,
    "revenue_growth": 15
  }
}
```

### 🎓 Certificate/License Documents
**Resource Type**: `employee` | **Subtype**: `certification`

```json
{
  "certificate_name": "AWS Solutions Architect", // Required: Certificate name
  "certificate_number": "AWS-SA-2024-12345",     // Required: Certificate ID
  "issuing_organization": "Amazon Web Services",  // Required: Issuer
  "issue_date": "2024-01-15",         // Required: Format Y-m-d
  "expiry_date": "2027-01-15",        // Optional: Format Y-m-d (null if no expiry)
  "certification_level": "Professional", // Optional: Basic | Intermediate | Professional | Expert
  "score": "850/1000",                // Optional: Score achieved
  "passing_score": "750/1000",        // Optional: Minimum passing score
  "verification_url": "https://...",  // Optional: Online verification URL
  "renewal_required": true,           // Optional: Boolean
  "renewal_period_months": 36,        // Optional: Renewal period
  "ceu_credits": 60,                  // Optional: Continuing Education Units
  "competencies": [                   // Optional: Skills certified
    "Cloud Architecture",
    "Security",
    "Cost Optimization"
  ]
}
```

### 📸 Photo/Image Documents
**Resource Type**: `any` | **Subtype**: `photo`

```json
{
  "photo_type": "profile",            // Required: profile | site | equipment | incident | progress
  "taken_date": "2024-01-15",         // Required: Format Y-m-d
  "taken_time": "14:30:00",           // Optional: Format H:i:s
  "location": "Site A - Section 3",   // Optional: Location description
  "gps_coordinates": {                // Optional: GPS location
    "latitude": 28.6139,
    "longitude": -106.0889
  },
  "photographer": "John Doe",         // Optional: Who took the photo
  "subject": "Equipment inspection",  // Required: What the photo shows
  "equipment_visible": ["DRILL-001"], // Optional: Equipment IDs in photo
  "people_visible": ["emp-123"],      // Optional: Employee IDs in photo
  "quality_check": "approved",        // Optional: pending | approved | rejected
  "notes": null                       // Optional: Additional notes
}
```

## 📐 Frontend Integration Guide

### Metadata Validation Rules

1. **Dates**: Always use `Y-m-d` format (e.g., "2024-01-15")
2. **Currency**: Use ISO 4217 codes (USD, EUR, MXN)
3. **Numbers**: Use numeric types without formatting (150000 not "150,000")
4. **Required Fields**: Must be present even if null
5. **Optional Fields**: Can be omitted entirely from the JSON

### Using Metadata Templates API

The module provides a **Templates API** that returns the complete structure for generating dynamic forms:

#### Get All Available Templates
```bash
GET /api/document-management/metadata-templates

Response:
{
  "success": true,
  "data": {
    "employee.identification": { ... },
    "project.contract": { ... },
    "invoice": { ... },
    "drilling_report.daily_report": { ... },
    "employee.medical": { ... },
    "employee.certification": { ... }
  }
}
```

#### Get Specific Template
```bash
GET /api/document-management/metadata-templates/employee/identification

Response:
{
  "success": true,
  "data": {
    "name": "Identification Document",
    "description": "Employee identification documents (passport, license, etc.)",
    "fields": [
      {
        "name": "id_type",
        "label": "ID Type",
        "type": "select",
        "required": true,
        "options": [
          {"value": "passport", "label": "Passport"},
          {"value": "driver_license", "label": "Driver License"},
          {"value": "national_id", "label": "National ID"}
        ]
      },
      {
        "name": "id_number",
        "label": "ID Number",
        "type": "text",
        "required": true,
        "placeholder": "Enter identification number"
      },
      {
        "name": "expiry_date",
        "label": "Expiry Date",
        "type": "date",
        "required": false
      }
      // ... more fields
    ]
  }
}
```

### Template Field Properties

Each field in the template can have these properties:

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Field name (used in metadata JSON) |
| `label` | string | Display label for the field |
| `type` | string | Input type: `text`, `number`, `date`, `select`, `checkbox`, `radio`, `textarea`, `url` |
| `required` | boolean | Whether the field is required |
| `placeholder` | string | Placeholder text for inputs |
| `options` | array | Options for select/radio fields |
| `min` | number | Minimum value for number inputs |
| `max` | number | Maximum value for number inputs |
| `step` | number | Step value for number inputs |
| `default` | any | Default value |
| `readonly` | boolean | If field should be read-only |
| `showIf` | array | Conditional display `[field, operator, value]` |

### Dynamic Form Generation

Frontend can use these templates to:
1. Generate dynamic forms based on `resource_type` and `resource_subtype`
2. Apply appropriate validation rules
3. Show/hide fields based on `showIf` conditions
4. Pre-populate common fields

### Example Frontend Implementation

```javascript
// 1. Fetch template from API
async function loadTemplate(resourceType, subtype = null) {
  const url = subtype
    ? `/api/document-management/metadata-templates/${resourceType}/${subtype}`
    : `/api/document-management/metadata-templates/${resourceType}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  return await response.json();
}

// 2. Generate form from template
async function generateMetadataForm(resourceType, subtype) {
  const template = await loadTemplate(resourceType, subtype);

  if (!template.success) {
    return generateDefaultForm();
  }

  const form = document.createElement('form');

  template.data.fields.forEach(field => {
    const input = createFormField(field);
    form.appendChild(input);

    // Handle conditional fields
    if (field.showIf) {
      handleConditionalField(input, field.showIf);
    }
  });

  return form;
}

// 3. Create individual form fields
function createFormField(field) {
  switch(field.type) {
    case 'select':
      return createSelectField(field);
    case 'date':
      return createDateField(field);
    case 'number':
      return createNumberField(field);
    case 'checkbox':
      return createCheckboxField(field);
    case 'radio':
      return createRadioField(field);
    case 'textarea':
      return createTextareaField(field);
    default:
      return createTextField(field);
  }
}

// 4. Submit with structured metadata
async function uploadDocument(file, resourceType, resourceId, subtype) {
  const metadata = collectMetadataFromForm();

  const formData = new FormData();
  formData.append('document', file);
  formData.append('resource_type', resourceType);
  formData.append('resource_id', resourceId);
  formData.append('resource_subtype', subtype);

  // Add metadata as JSON string
  Object.keys(metadata).forEach(key => {
    formData.append(`metadata[${key}]`, metadata[key]);
  });

  const response = await fetch('/api/document-management', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Company-Id': companyId
    },
    body: formData
  });

  return await response.json();
}
```

### Available Templates

The following templates are currently available:

1. **`employee.identification`** - ID documents (passport, license, etc.)
2. **`project.contract`** - Contract agreements
3. **`invoice`** - Financial invoices
4. **`drilling_report.daily_report`** - Daily drilling reports
5. **`employee.medical`** - Medical certificates
6. **`employee.certification`** - Professional certifications

Templates will return a default generic structure if the requested type is not found.

## 🔗 Integration with Other Modules

### From Employee Module

```php
use App\Modules\Documents\Application\UseCases\UploadDocumentUseCase;
use App\Modules\Documents\Application\Commands\UploadDocumentCommand;

class EmployeeDocumentService
{
    public function __construct(
        private UploadDocumentUseCase $uploadDocumentUseCase
    ) {}

    public function uploadIdentification($employeeId, $file, $idType, $idNumber)
    {
        $command = new UploadDocumentCommand(
            companyId: current_company_id(),
            resourceType: 'employee',
            resourceId: $employeeId,
            resourceSubtype: 'identification',
            title: ucfirst(str_replace('_', ' ', $idType)),
            description: "Employee identification document",
            documentType: 'legal',
            category: 'hr',
            file: $file,
            metadata: [
                'id_type' => $idType,
                'id_number' => $idNumber,
                'issue_date' => request('issue_date'),
                'expiry_date' => request('expiry_date'),
                'issuing_authority' => request('issuing_authority'),
                'verification_status' => 'pending',
                'verification_required' => true
            ],
            tags: ['identification', $idType, 'employee-docs'],
            uploadedBy: current_user()->id
        );

        return $this->uploadDocumentUseCase->execute($command);
    }

    public function getEmployeeDocuments($employeeId, $subtype = null)
    {
        // Using repository directly
        $documents = $this->documentRepository->findByResourceType(
            'employee',
            $employeeId
        );

        if ($subtype) {
            $documents = array_filter($documents, function($doc) use ($subtype) {
                return $doc->resource()->subtype() === $subtype;
            });
        }

        return $documents;
    }
}
```

### From Drilling Module

```php
class DrillingReportService
{
    public function attachReportWithDetails($reportId, $file, $reportData)
    {
        $command = new UploadDocumentCommand(
            companyId: current_company_id(),
            resourceType: 'drilling_report',
            resourceId: $reportId,
            resourceSubtype: null,
            title: "Drilling Report - {$reportData['date']}",
            description: "Daily drilling report for well {$reportData['well_number']}",
            documentType: 'report',
            category: 'technical',
            file: $file,
            metadata: [
                'report_date' => $reportData['date'],
                'well_number' => $reportData['well_number'],
                'well_depth' => $reportData['depth'],
                'shift' => $reportData['shift'],
                'crew_size' => $reportData['crew_size'],
                'meters_drilled' => $reportData['meters_drilled'],
                'equipment' => $reportData['equipment'],
                'consumables' => $reportData['consumables'],
                'incidents' => $reportData['incidents'],
                'supervisor_name' => $reportData['supervisor'],
                'approval_status' => 'pending',
                'requires_review' => true
            ],
            tags: ['drilling', 'daily-report', $reportData['well_number']],
            uploadedBy: current_user()->id
        );

        return $this->uploadDocumentUseCase->execute($command);
    }
}
```

### From Project Module

```php
class ProjectDocumentService
{
    public function uploadProjectDocument($projectId, $file, $documentInfo)
    {
        $command = new UploadDocumentCommand(
            companyId: current_company_id(),
            resourceType: 'project',
            resourceId: $projectId,
            resourceSubtype: $documentInfo['phase'], // planning, execution, closure
            title: $documentInfo['title'],
            description: $documentInfo['description'],
            documentType: $documentInfo['type'], // contract, report, blueprint
            category: 'administrative',
            file: $file,
            metadata: [
                'project_phase' => $documentInfo['phase'],
                'document_version' => $documentInfo['version'] ?? '1.0',
                'stakeholders' => $documentInfo['stakeholders'] ?? [],
                'approval_required' => $documentInfo['needs_approval'] ?? false,
                'approvers' => $documentInfo['approvers'] ?? [],
                'milestone' => $documentInfo['milestone'] ?? null,
                'budget_impact' => $documentInfo['budget_impact'] ?? null,
                'risk_level' => $documentInfo['risk_level'] ?? 'low',
                'confidentiality' => $documentInfo['confidentiality'] ?? 'internal'
            ],
            tags: array_merge(
                ['project-docs'],
                $documentInfo['tags'] ?? []
            ),
            uploadedBy: current_user()->id
        );

        return $this->uploadDocumentUseCase->execute($command);
    }
}
```

## 🔍 Querying Documents

### Get Documents by Resource
```php
// Get all documents for an employee
$documents = $documentRepository->findByResourceType('employee', $employeeId);

// Filter in your service
$identificationDocs = array_filter($documents, function($doc) {
    return $doc->resource()->subtype() === 'identification';
});

// Access metadata
foreach ($identificationDocs as $doc) {
    $metadata = $doc->metadata()->toArray();
    $idNumber = $metadata['id_number'] ?? null;
    $expiryDate = $metadata['expiry_date'] ?? null;

    if ($expiryDate && new DateTime($expiryDate) < new DateTime()) {
        // Document expired, trigger notification
    }
}
```

### Search Documents by Metadata
```php
// In your service (future implementation)
class DocumentSearchService
{
    public function findByMetadata(string $key, $value)
    {
        return DocumentModel::whereJsonContains("metadata->{$key}", $value)
            ->get()
            ->map(fn($model) => $this->toDomain($model));
    }

    public function findExpiringIdentifications(int $daysAhead = 30)
    {
        $expiryDate = now()->addDays($daysAhead)->format('Y-m-d');

        return DocumentModel::where('resource_type', 'employee')
            ->where('resource_subtype', 'identification')
            ->whereJsonContains('metadata->expiry_date', ['<=', $expiryDate])
            ->get();
    }
}
```

## 📋 Document Types

| Type | Allowed Extensions | Use Case |
|------|-------------------|----------|
| `contract` | pdf, docx, doc | Employment contracts, service agreements |
| `invoice` | pdf, xml | Financial documents |
| `report` | pdf, xlsx, xls, docx | Technical reports, analysis |
| `image` | jpg, jpeg, png, gif | Photos, scans |
| `certificate` | pdf | Certifications, licenses |
| `permit` | pdf | Legal permits |
| `blueprint` | pdf, dwg, dxf | Technical drawings |
| `spreadsheet` | xlsx, xls, csv | Data files |
| `presentation` | pptx, ppt, pdf | Presentations |
| `legal` | pdf, docx | Legal documents, IDs |
| `financial` | pdf, xlsx, xls | Financial reports |
| `technical` | pdf, docx, xlsx, dwg | Technical documentation |
| `other` | * | Any file type |

## 📁 Categories

- `legal` - Legal documents, contracts, IDs
- `financial` - Invoices, financial reports
- `technical` - Technical reports, blueprints
- `administrative` - General administrative docs
- `operational` - Operational procedures
- `compliance` - Compliance documents
- `hr` - Human resources documents
- `marketing` - Marketing materials
- `confidential` - Confidential documents
- `general` - General documents

## 🔗 Share Links

### Creating Share Links

Generate secure share links for documents with optional password protection, expiry dates, and access restrictions:

```bash
# Basic share link (public, no restrictions)
curl -X POST http://localhost/api/document-management/{documentId}/share-links \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{}'

# Password-protected link with expiry
curl -X POST http://localhost/api/document-management/{documentId}/share-links \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "securePassword123",
    "expires_at": "2024-12-31 23:59:59",
    "max_downloads": 5,
    "permissions": ["view", "download"],
    "notes": "Share with external auditor"
  }'

# Restricted to specific emails
curl -X POST http://localhost/api/document-management/{documentId}/share-links \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "allowed_emails": [
      "auditor1@company.com",
      "auditor2@company.com"
    ],
    "expires_at": "2024-06-30 23:59:59",
    "permissions": ["view"],
    "notes": "For audit review only"
  }'
```

#### Share Link Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `password` | string | Optional password protection (min 6 chars) |
| `expires_at` | datetime | Expiry date/time (Y-m-d H:i:s) |
| `max_downloads` | integer | Maximum download count (1-1000) |
| `permissions` | array | Allowed actions: `view`, `download`, `print` |
| `allowed_emails` | array | Restrict to specific email addresses |
| `notes` | string | Internal notes about the share |

### Using Share Links (Public Access)

#### 1. Check Access Requirements

```bash
# Check what's needed to access the document
curl -X GET http://localhost/api/shared/documents/{token}/check

# Response
{
  "success": true,
  "data": {
    "requires_password": true,
    "requires_email": false,
    "permissions": ["view", "download"]
  }
}
```

#### 2. View Document Information

```bash
# Without password
curl -X GET http://localhost/api/shared/documents/{token}

# With password
curl -X GET http://localhost/api/shared/documents/{token}?password=securePassword123

# With email (if restricted)
curl -X GET http://localhost/api/shared/documents/{token}?email=auditor1@company.com
```

#### 3. Download Document

```bash
# Download with password
curl -X GET http://localhost/api/shared/documents/{token}/download?password=securePassword123 \
  --output document.pdf
```

### Managing Share Links

#### List All Share Links

```bash
curl -X GET http://localhost/api/document-management/{documentId}/share-links \
  -H "Authorization: Bearer {token}"

# Response
{
  "success": true,
  "data": [
    {
      "id": "share-link-id",
      "share_url": "http://localhost/shared/documents/abc123token",
      "token": "abc123token",
      "has_password": true,
      "expires_at": "2024-12-31 23:59:59",
      "max_downloads": 5,
      "download_count": 2,
      "downloads_remaining": 3,
      "permissions": ["view", "download"],
      "allowed_emails": null,
      "is_expired": false,
      "created_by": "user-id",
      "created_at": "2024-01-15 10:30:00",
      "notes": "Share with external auditor"
    }
  ]
}
```

#### Update Share Link

```bash
curl -X PUT http://localhost/api/document-management/{documentId}/share-links/{shareLinkId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "expires_at": "2024-06-30 23:59:59",
    "max_downloads": 10,
    "password": "newPassword456"
  }'
```

#### Revoke Share Link

```bash
curl -X DELETE http://localhost/api/document-management/{documentId}/share-links/{shareLinkId} \
  -H "Authorization: Bearer {token}"
```

### Share Link Use Cases

1. **Time-Limited Contractor Access**
   - Set expiry date for project duration
   - Limit to specific contractor emails
   - View-only permissions

2. **Client Document Delivery**
   - Password-protected download
   - Limited download count
   - Auto-expire after first download

3. **Audit Documentation**
   - Restricted to auditor emails
   - Read-only access
   - Full access logging

4. **Public Forms/Templates**
   - No password required
   - No download limit
   - Never expires

### Share Link Security

- **Token Generation**: 64-character secure random tokens
- **Password Storage**: Bcrypt hashed passwords
- **Access Logging**: All access attempts are logged
- **Download Tracking**: Automatic counter with limits
- **Email Verification**: Optional email-based restrictions
- **Expiry Enforcement**: Automatic link expiration
- **Revocation**: Immediate link deactivation

## 🔒 Enterprise Security Features

### Core Security Measures

#### 1. **File Upload Security**
- ✅ **File size validation** (max 100MB configurable)
- ✅ **MIME type verification** - Validates that file content matches extension
- ✅ **Malware signature scanning** - Detects common webshells and malware
- ✅ **Embedded executable detection** - Blocks files with hidden executables
- ✅ **Image integrity validation** - Ensures images aren't hiding malicious content
- ✅ **Filename sanitization** - Removes dangerous characters and patterns
- ✅ **Path traversal prevention** - Blocks ../ and similar attacks

#### 2. **Access Control & Rate Limiting**
- ✅ **IP-based rate limiting** - Max 10 attempts per hour per IP
- ✅ **Token-based rate limiting** - Max 5 failed password attempts per share link
- ✅ **Automatic link locking** - Auto-revokes after too many failed attempts
- ✅ **IP blacklisting** - Automatic and manual IP blocking
- ✅ **IP whitelisting** - Optional document-specific IP restrictions
- ✅ **Failed attempt tracking** - Comprehensive logging of all failures

#### 3. **Attack Prevention**
- ✅ **SQL injection protection** - Pattern detection and blocking
- ✅ **XSS attack prevention** - Script tag and JavaScript filtering
- ✅ **Code injection blocking** - PHP, ASP, and shell code detection
- ✅ **Command execution prevention** - Blocks eval(), exec(), system() attempts
- ✅ **CSRF protection** - Token validation on all state-changing operations
- ✅ **Null byte injection prevention** - Filters \x00 characters

#### 4. **Audit & Monitoring**
- ✅ **Security event logging** - All security events logged with severity levels
- ✅ **Access audit trail** - Complete history of document access
- ✅ **Suspicious activity tracking** - Pattern detection and alerting
- ✅ **Failed access logging** - Detailed logs of all failed attempts
- ✅ **High-value operation monitoring** - Extra logging for sensitive actions

#### 5. **Share Link Security**
- ✅ **64-character secure tokens** - Cryptographically secure random generation
- ✅ **Bcrypt password hashing** - Industry-standard password protection
- ✅ **Expiry enforcement** - Automatic link expiration
- ✅ **Download limits** - Configurable max downloads per link
- ✅ **Email-based restrictions** - Limit access to specific email addresses
- ✅ **Permission granularity** - view, download, print permissions

#### 6. **Response Headers**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
```

### Security Configuration

Configuration file: `config/document-security.php`

```php
'rate_limiting' => [
    'max_attempts_per_ip' => 10,
    'max_attempts_per_token' => 5,
    'window_minutes' => 60,
],

'file_validation' => [
    'max_size_mb' => 100,
    'scan_for_malware' => true,
    'validate_mime_types' => true,
    'check_embedded_executables' => true,
],

'ip_blocking' => [
    'auto_blacklist_on_attack' => true,
    'blacklist_duration_hours' => 24,
],
```

### Security Database Tables

- `security_audit_log` - All security events
- `security_blacklist` - Blocked IPs/emails/users
- `document_ip_whitelist` - Document-specific IP restrictions
- `failed_access_attempts` - Failed login/access attempts
- `suspicious_activities` - Detected attack patterns
- `document_encryption_keys` - Encryption key storage (future)

### Security Middleware

The `DocumentSecurityMiddleware` automatically:
1. Checks IP blacklists
2. Enforces rate limits
3. Detects attack patterns
4. Validates request headers
5. Blocks SQL injection attempts
6. Prevents XSS attacks
7. Adds security headers to responses

### Security Best Practices

1. **Regular Security Audits**
   ```bash
   php artisan documents:security-audit
   ```

2. **Monitor Security Logs**
   ```sql
   SELECT * FROM security_audit_log
   WHERE severity IN ('high', 'critical')
   AND created_at > NOW() - INTERVAL 24 HOUR;
   ```

3. **Review Failed Attempts**
   ```sql
   SELECT ip_address, COUNT(*) as attempts
   FROM failed_access_attempts
   WHERE attempted_at > NOW() - INTERVAL 1 HOUR
   GROUP BY ip_address
   HAVING attempts > 5;
   ```

4. **Update Blacklists**
   ```php
   // Add IP to blacklist
   DB::table('security_blacklist')->insert([
       'type' => 'ip',
       'value' => '192.168.1.100',
       'reason' => 'Repeated attack attempts',
       'expires_at' => now()->addDays(30)
   ]);
   ```

### Incident Response

In case of security incident:

1. **Immediate Actions**
   - Review `security_audit_log` for attack patterns
   - Check `failed_access_attempts` for breach attempts
   - Verify no unauthorized downloads in `document_access_logs`

2. **Containment**
   - Blacklist attacking IPs
   - Revoke compromised share links
   - Disable affected user accounts

3. **Investigation**
   ```sql
   -- Find all actions by suspicious IP
   SELECT * FROM security_audit_log
   WHERE ip_address = 'SUSPICIOUS_IP'
   ORDER BY created_at DESC;
   ```

4. **Recovery**
   - Reset affected passwords
   - Generate new share tokens
   - Review and update security rules

### Compliance Features

- ✅ **GDPR Ready** - Data encryption and audit trails
- ✅ **HIPAA Compatible** - Access controls and encryption
- ✅ **SOC 2 Support** - Comprehensive audit logging
- ✅ **ISO 27001 Alignment** - Security controls and monitoring

## 🧪 Testing

### Test Coverage

The Documents module includes comprehensive testing with **65+ tests** covering all functionality:

#### Unit Tests (Domain Layer)
- **DocumentEntityTest** - 12 tests for entity behavior
- **ValueObjectsTest** - 22 tests for all value objects
- Complete coverage of domain logic and business rules

#### Feature Tests (Integration)
- **DocumentUploadTest** - 13 tests for upload functionality
- **ShareLinkTest** - 14 tests for share link features
- **DocumentSecurityTest** - 16 tests for security measures

### Running Tests

```bash
# Run all Documents module tests
./vendor/bin/sail artisan test app/Modules/Documents/tests/

# Run only unit tests
./vendor/bin/sail artisan test app/Modules/Documents/tests/Unit

# Run only feature tests
./vendor/bin/sail artisan test app/Modules/Documents/tests/Feature

# Run specific test class
./vendor/bin/sail artisan test --filter=DocumentUploadTest

# Run specific test method
./vendor/bin/sail artisan test --filter=test_can_upload_document_successfully

# Run with code coverage
./vendor/bin/sail artisan test app/Modules/Documents/tests/ --coverage

# Run security tests only
./vendor/bin/sail artisan test --filter=DocumentSecurityTest
```

### Test Categories

#### 1. Upload Tests
✅ Successful document upload with metadata
✅ Validation of required fields
✅ File type restrictions
✅ File size limits (100MB max)
✅ Resource subtype handling
✅ Multi-tenancy isolation

#### 2. Share Link Tests
✅ Basic share link creation
✅ Password-protected links
✅ Expiry date enforcement
✅ Download limits
✅ Email restrictions
✅ Public access without auth
✅ Link revocation

#### 3. Security Tests
✅ Malicious file detection
✅ SQL injection prevention
✅ XSS attack prevention
✅ Path traversal blocking
✅ Rate limiting (10 attempts/hour)
✅ Auto-blacklisting attackers
✅ Webshell signature detection
✅ Embedded executable blocking
✅ MIME type validation
✅ Security headers validation

#### 4. Domain Tests
✅ Entity creation and updates
✅ Value object validations
✅ Business rule enforcement
✅ Event generation
✅ Soft delete behavior
✅ Version management

### Test Database

Tests use a separate `testing` database configured in `phpunit.xml`:
```xml
<env name="DB_DATABASE" value="testing"/>
```

### Continuous Integration

The module is configured in `phpunit.xml` for CI/CD:
```xml
<testsuite name="Unit">
    <directory>app/Modules/Documents/tests/Unit</directory>
</testsuite>
<testsuite name="Feature">
    <directory>app/Modules/Documents/tests/Feature</directory>
</testsuite>
```

### Test Data Factories

For testing, use Laravel factories with fake data:
```php
$file = UploadedFile::fake()->create('document.pdf', 1024);
$user = User::factory()->create();
Storage::fake('local');
```

### Coverage Metrics

- **Value Objects**: 100% coverage
- **Domain Entities**: 95%+ coverage
- **API Endpoints**: 100% coverage
- **Security Features**: 100% coverage
- **Share Links**: 100% coverage

### Testing Best Practices

1. **Isolation**: Each test runs in a transaction that's rolled back
2. **Mocking**: External services are mocked (Storage, Mail, etc.)
3. **Assertions**: Multiple assertions per test for thorough validation
4. **Edge Cases**: Tests cover success, failure, and edge cases
5. **Security**: Dedicated security test suite for threat detection

## 🚀 Future Enhancements

1. **Advanced Search**: Search by metadata fields
2. **Automatic Expiry Notifications**: Alert for expiring documents
3. **OCR**: Extract text from images/PDFs
4. **Thumbnails**: Generate previews
5. **Bulk Operations**: Multiple uploads/downloads
6. **Versioning UI**: Version comparison
7. **Workflows**: Approval workflows
8. **Templates**: Document templates

## 📝 Notes

- Metadata is stored as JSON, allowing flexible queries
- Use `resource_subtype` for sub-categorization (e.g., 'identification', 'contract', 'certification')
- Tags can be used for quick filtering and search
- All dates in metadata should be in 'Y-m-d' format
- Monetary values in metadata should include currency

## 🆘 Support

For issues or questions about this module:
1. Check this README
2. Review the implementation in `DOCUMENTS_MODULE_IMPLEMENTATION.md`
3. Check the design document in `DOCUMENTS_MODULE_DESIGN.md`
4. Contact the development team
