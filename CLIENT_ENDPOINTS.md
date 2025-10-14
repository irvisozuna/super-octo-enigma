# Client Module - API Endpoints

## Base URL
```
http://localhost/api/clients
```

## Authentication
All endpoints require authentication using Laravel Sanctum:
- Header: `Authorization: Bearer {token}`
- Header: `X-Company-Id: {company_uuid}`

## Table of Contents
1. [List & Search Endpoints](#list--search-endpoints)
2. [CRUD Operations](#crud-operations)
3. [Status Management](#status-management)
4. [Contact Management](#contact-management)
5. [Credit Limit Management](#credit-limit-management)
6. [Export Functionality](#export-functionality)

---

## List & Search Endpoints

### 1. List All Clients
**GET** `/api/clients`

Returns paginated list of all clients.

**Query Parameters:**
- `per_page` (optional, default: 20) - Number of items per page

**Example Request:**
```bash
curl -X GET 'http://localhost/api/clients?per_page=20' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "client_code": "CLI-2025-001",
      "business_info": {
        "business_name": "Empresa Ejemplo S.A. de C.V.",
        "trade_name": "Ejemplo Corp",
        "tax_id": "EMP850101ABC",
        "business_type": "company",
        "industry": "Construcción",
        "website": "https://ejemplo.com",
        "logo_url": "https://ejemplo.com/logo.png"
      },
      "contact_info": {
        "primary_phone": "6621234567",
        "secondary_phone": "6629876543",
        "primary_email": "contacto@ejemplo.com",
        "secondary_email": "ventas@ejemplo.com",
        "address": {
          "address_line_1": "Calle Principal 123",
          "address_line_2": "Col. Centro",
          "city": "Hermosillo",
          "state": "Sonora",
          "postal_code": "83000",
          "country": "México"
        }
      },
      "billing_info": {
        "billing_address": null,
        "payment_terms": "net_30",
        "payment_methods": ["bank_transfer", "check"],
        "credit_limit_amount": 50000.00,
        "credit_limit_currency": "MXN",
        "tax_regime": "601",
        "cfdi_use": "G03"
      },
      "status": "active",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-01-01T00:00:00.000000Z"
    }
  ],
  "links": {...},
  "meta": {...}
}
```

---

### 2. Search Clients
**GET** `/api/clients/search`

Search clients by multiple criteria.

**Query Parameters:**
- `business_name` (optional) - Filter by business name (partial match)
- `tax_id` (optional) - Filter by tax ID (partial match)
- `status` (optional) - Filter by status (active, inactive, suspended, blacklisted)
- `business_type` (optional) - Filter by business type (individual, company, government, ngo)
- `per_page` (optional, default: 20) - Number of items per page

**Example Request:**
```bash
curl -X GET 'http://localhost/api/clients/search?business_type=company&status=active' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

---

### 3. Get Clients by Business Type
**GET** `/api/clients/by-business-type/{businessType}`

Get all clients with a specific business type.

**Path Parameters:**
- `businessType` - Business type (individual, company, government, ngo)

**Example Request:**
```bash
curl -X GET 'http://localhost/api/clients/by-business-type/company' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

---

## CRUD Operations

### 4. Get Single Client
**GET** `/api/clients/{id}`

Get detailed information about a specific client.

**Path Parameters:**
- `id` - Client UUID

**Example Request:**
```bash
curl -X GET 'http://localhost/api/clients/{client_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "id": "uuid",
  "client_code": "CLI-2025-001",
  "business_info": {
    "business_name": "Empresa Ejemplo S.A. de C.V.",
    "trade_name": "Ejemplo Corp",
    "tax_id": "EMP850101ABC",
    "business_type": "company",
    "industry": "Construcción",
    "website": "https://ejemplo.com",
    "logo_url": "https://ejemplo.com/logo.png"
  },
  "contact_info": {
    "primary_phone": "6621234567",
    "secondary_phone": "6629876543",
    "primary_email": "contacto@ejemplo.com",
    "secondary_email": "ventas@ejemplo.com",
    "address": {
      "address_line_1": "Calle Principal 123",
      "address_line_2": "Col. Centro",
      "city": "Hermosillo",
      "state": "Sonora",
      "postal_code": "83000",
      "country": "México"
    }
  },
  "billing_info": {
    "billing_address": {
      "address_line_1": "Av. Facturación 456",
      "address_line_2": "Piso 3",
      "city": "Hermosillo",
      "state": "Sonora",
      "postal_code": "83100",
      "country": "México"
    },
    "payment_terms": "net_30",
    "payment_methods": ["bank_transfer", "check"],
    "credit_limit_amount": 50000.00,
    "credit_limit_currency": "MXN",
    "tax_regime": "601",
    "cfdi_use": "G03"
  },
  "status": "active",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00.000000Z",
  "updated_at": "2025-01-01T00:00:00.000000Z"
}
```

---

### 5. Create Client
**POST** `/api/clients`

Create a new client. Client code is automatically generated.

**Request Body:**
```json
{
  "business_name": "Empresa Ejemplo S.A. de C.V.",
  "trade_name": "Ejemplo Corp",
  "tax_id": "EMP850101ABC",
  "business_type": "company",
  "industry": "Construcción",
  "website": "https://ejemplo.com",
  "logo_url": "https://ejemplo.com/logo.png",
  "primary_phone": "6621234567",
  "secondary_phone": "6629876543",
  "primary_email": "contacto@ejemplo.com",
  "secondary_email": "ventas@ejemplo.com",
  "address_line_1": "Calle Principal 123",
  "address_line_2": "Col. Centro",
  "city": "Hermosillo",
  "state": "Sonora",
  "postal_code": "83000",
  "country": "México",
  "billing_address_line_1": "Av. Facturación 456",
  "billing_address_line_2": "Piso 3",
  "billing_city": "Hermosillo",
  "billing_state": "Sonora",
  "billing_postal_code": "83100",
  "billing_country": "México",
  "payment_terms": "net_30",
  "payment_methods": ["bank_transfer", "check"],
  "credit_limit": 50000.00,
  "credit_limit_currency": "MXN",
  "tax_regime": "601",
  "cfdi_use": "G03"
}
```

**Field Validations:**
- `business_name` (required, string, max:255) - Business legal name
- `trade_name` (optional, string, max:255) - Commercial/trade name
- `tax_id` (required, string, max:20) - RFC/NIT/Tax ID
- `business_type` (required, enum: individual, company, government, ngo)
- `industry` (required, string, max:100) - Industry sector
- `website` (optional, url, max:255)
- `logo_url` (optional, url, max:500)
- `primary_phone` (required, string, max:20)
- `secondary_phone` (optional, string, max:20)
- `primary_email` (required, email, max:255)
- `secondary_email` (optional, email, max:255)
- `address_line_1` (required, string, max:255)
- `address_line_2` (optional, string, max:255)
- `city` (required, string, max:100)
- `state` (required, string, max:100)
- `postal_code` (required, string, max:20)
- `country` (optional, string, max:100, defaults to "México")
- `billing_address_line_1` (optional, string, max:255)
- `billing_address_line_2` (optional, string, max:255)
- `billing_city` (optional, string, max:100)
- `billing_state` (optional, string, max:100)
- `billing_postal_code` (optional, string, max:20)
- `billing_country` (optional, string, max:100)
- `payment_terms` (optional, enum: immediate, net_15, net_30, net_60, custom, defaults to "immediate")
- `payment_methods` (optional, array, min:1, defaults to ["cash"])
- `payment_methods.*` (enum: cash, check, bank_transfer, credit_card, financing)
- `credit_limit` (optional, numeric, min:0)
- `credit_limit_currency` (optional, string, size:3)
- `tax_regime` (required, string, max:100) - Tax regime code
- `cfdi_use` (required, string, max:100) - CFDI use code

**Example Request:**
```bash
curl -X POST 'http://localhost/api/clients' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "business_name": "Empresa Ejemplo S.A. de C.V.",
    "tax_id": "EMP850101ABC",
    "business_type": "company",
    "industry": "Construcción",
    "primary_phone": "6621234567",
    "primary_email": "contacto@ejemplo.com",
    "address_line_1": "Calle Principal 123",
    "city": "Hermosillo",
    "state": "Sonora",
    "postal_code": "83000",
    "tax_regime": "601",
    "cfdi_use": "G03"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Cliente registrado exitosamente",
  "data": {
    "id": "uuid",
    "client_code": "CLI-2025-001",
    ...
  },
  "metadata": {
    "generated_code": "CLI-2025-001"
  }
}
```

---

### 6. Update Client
**PUT** `/api/clients/{id}` or **PATCH** `/api/clients/{id}`

Update client information. All fields are required for PUT, optional for PATCH.

**Path Parameters:**
- `id` - Client UUID

**Request Body:** (example for partial update)
```json
{
  "business_name": "Empresa Ejemplo Actualizada S.A. de C.V.",
  "primary_email": "nuevo@ejemplo.com",
  "payment_terms": "net_60",
  "credit_limit_amount": 75000.00
}
```

**Example Request:**
```bash
curl -X PUT 'http://localhost/api/clients/{client_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "business_name": "Empresa Ejemplo Actualizada S.A. de C.V.",
    "trade_name": "Ejemplo Corp",
    "business_type": "company",
    "industry": "Construcción",
    "primary_phone": "6621234567",
    "primary_email": "nuevo@ejemplo.com",
    "address_line_1": "Calle Principal 123",
    "city": "Hermosillo",
    "state": "Sonora",
    "postal_code": "83000",
    "country": "México",
    "payment_terms": "net_60",
    "payment_methods": ["bank_transfer"],
    "tax_regime": "601",
    "cfdi_use": "G03"
  }'
```

---

### 7. Delete Client
**DELETE** `/api/clients/{id}`

Permanently delete a client.

**Path Parameters:**
- `id` - Client UUID

**Example Request:**
```bash
curl -X DELETE 'http://localhost/api/clients/{client_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "message": "Cliente eliminado correctamente"
}
```

---

## Status Management

All status changes automatically create status history records.

### 8. Deactivate Client
**POST** `/api/clients/{id}/deactivate`

Change client status to inactive.

**Path Parameters:**
- `id` - Client UUID

**Example Request:**
```bash
curl -X POST 'http://localhost/api/clients/{client_id}/deactivate' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "id": "uuid",
  "client_code": "CLI-2025-001",
  "status": "inactive",
  "is_active": false,
  ...
}
```

---

### 9. Suspend Client
**POST** `/api/clients/{id}/suspend`

Change client status to suspended. Requires a reason.

**Path Parameters:**
- `id` - Client UUID

**Request Body:**
```json
{
  "reason": "Pagos atrasados por más de 60 días. Cliente notificado y sin respuesta."
}
```

**Field Validations:**
- `reason` (required, string, min:10) - Reason for suspension

**Example Request:**
```bash
curl -X POST 'http://localhost/api/clients/{client_id}/suspend' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "reason": "Pagos atrasados por más de 60 días. Cliente notificado y sin respuesta."
  }'
```

**Example Response:**
```json
{
  "id": "uuid",
  "client_code": "CLI-2025-001",
  "status": "suspended",
  "is_active": false,
  ...
}
```

---

### 10. Blacklist Client
**POST** `/api/clients/{id}/blacklist`

Change client status to blacklisted. Requires a reason.

**Path Parameters:**
- `id` - Client UUID

**Request Body:**
```json
{
  "reason": "Fraude confirmado. Cheques sin fondos repetidos y documentación falsa presentada."
}
```

**Field Validations:**
- `reason` (required, string, min:10) - Reason for blacklisting

**Example Request:**
```bash
curl -X POST 'http://localhost/api/clients/{client_id}/blacklist' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "reason": "Fraude confirmado. Cheques sin fondos repetidos y documentación falsa presentada."
  }'
```

**Example Response:**
```json
{
  "id": "uuid",
  "client_code": "CLI-2025-001",
  "status": "blacklisted",
  "is_active": false,
  ...
}
```

---

## Contact Management

### 11. Get Client Contacts
**GET** `/api/clients/{id}/contacts`

Get all contacts for a specific client.

**Path Parameters:**
- `id` - Client UUID

**Example Request:**
```bash
curl -X GET 'http://localhost/api/clients/{client_id}/contacts' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "full_name": "Juan Pérez García",
      "position": "Director General",
      "department": "Administración",
      "primary_phone": "6621234567",
      "secondary_phone": "6629876543",
      "email": "jperez@ejemplo.com",
      "is_primary": true,
      "can_approve_projects": true,
      "can_sign_documents": true,
      "notes": "Contacto principal para aprobación de proyectos mayores a $100k",
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-01-01T00:00:00.000000Z"
    }
  ]
}
```

---

### 12. Add Contact to Client
**POST** `/api/clients/{id}/contacts`

Add a new contact to a client.

**Path Parameters:**
- `id` - Client UUID

**Request Body:**
```json
{
  "full_name": "María López Sánchez",
  "position": "Gerente de Compras",
  "department": "Adquisiciones",
  "primary_phone": "6621234567",
  "secondary_phone": "6629876543",
  "email": "mlopez@ejemplo.com",
  "is_primary": false,
  "can_approve_projects": true,
  "can_sign_documents": false,
  "notes": "Contacto para cotizaciones y órdenes de compra"
}
```

**Field Validations:**
- `full_name` (required, string, min:3, max:200)
- `position` (required, string, min:2, max:100)
- `department` (optional, string, max:100)
- `primary_phone` (required, string, max:20)
- `secondary_phone` (optional, string, max:20)
- `email` (required, email, max:255)
- `is_primary` (optional, boolean, defaults to false)
- `can_approve_projects` (optional, boolean, defaults to false)
- `can_sign_documents` (optional, boolean, defaults to false)
- `notes` (optional, string, max:500)

**Example Request:**
```bash
curl -X POST 'http://localhost/api/clients/{client_id}/contacts' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "full_name": "María López Sánchez",
    "position": "Gerente de Compras",
    "primary_phone": "6621234567",
    "email": "mlopez@ejemplo.com",
    "is_primary": false,
    "can_approve_projects": true
  }'
```

**Example Response:**
```json
{
  "message": "Contacto agregado correctamente",
  "data": {
    "id": "uuid",
    "client_id": "uuid",
    "full_name": "María López Sánchez",
    "position": "Gerente de Compras",
    ...
  }
}
```

---

### 13. Update Contact
**PUT** `/api/clients/{id}/contacts/{contactId}`

Update an existing contact.

**Path Parameters:**
- `id` - Client UUID
- `contactId` - Contact UUID

**Request Body:**
```json
{
  "full_name": "María López Sánchez",
  "position": "Directora de Compras",
  "department": "Adquisiciones",
  "primary_phone": "6621234567",
  "email": "mlopez@ejemplo.com"
}
```

**Example Request:**
```bash
curl -X PUT 'http://localhost/api/clients/{client_id}/contacts/{contact_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "full_name": "María López Sánchez",
    "position": "Directora de Compras",
    "department": "Adquisiciones",
    "primary_phone": "6621234567",
    "email": "mlopez@ejemplo.com"
  }'
```

**Example Response:**
```json
{
  "message": "Contacto actualizado correctamente",
  "data": {
    "id": "uuid",
    "full_name": "María López Sánchez",
    "position": "Directora de Compras",
    ...
  }
}
```

---

### 14. Delete Contact
**DELETE** `/api/clients/{id}/contacts/{contactId}`

Remove a contact from a client.

**Path Parameters:**
- `id` - Client UUID
- `contactId` - Contact UUID

**Example Request:**
```bash
curl -X DELETE 'http://localhost/api/clients/{client_id}/contacts/{contact_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "message": "Contacto eliminado correctamente"
}
```

---

## Credit Limit Management

### 15. Update Credit Limit
**PATCH** `/api/clients/{id}/credit-limit`

Update client's credit limit.

**Path Parameters:**
- `id` - Client UUID

**Request Body:**
```json
{
  "credit_limit_amount": 100000.00,
  "credit_limit_currency": "MXN"
}
```

**Field Validations:**
- `credit_limit_amount` (optional, numeric, min:0)
- `credit_limit_currency` (optional, string, size:3)

**Example Request:**
```bash
curl -X PATCH 'http://localhost/api/clients/{client_id}/credit-limit' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "credit_limit_amount": 100000.00,
    "credit_limit_currency": "MXN"
  }'
```

**Example Response:**
```json
{
  "message": "Límite de crédito actualizado correctamente",
  "data": {
    "id": "uuid",
    "client_code": "CLI-2025-001",
    "billing_info": {
      "credit_limit_amount": 100000.00,
      "credit_limit_currency": "MXN",
      ...
    },
    ...
  }
}
```

---

## Export Functionality

### 16. Export Clients
**GET** `/api/clients/export`

Export clients data to Excel, CSV, or PDF format with optional filters.

**Query Parameters:**
- `format` (optional, enum: excel, csv, pdf, default: excel) - Export format
- `filename` (optional, string, default: "clients_export") - Base filename
- `search` (optional, string) - General search term
- `business_name` (optional, string) - Filter by business name
- `tax_id` (optional, string) - Filter by tax ID
- `status` (optional, string) - Filter by status
- `business_type` (optional, string) - Filter by business type
- `industry` (optional, string) - Filter by industry
- `created_from` (optional, date) - Filter by creation date from
- `created_to` (optional, date) - Filter by creation date to
- `sort_by` (optional, string, default: "created_at") - Sort field
- `sort_order` (optional, enum: asc, desc, default: desc) - Sort order

**Example Request (Excel):**
```bash
curl -X GET 'http://localhost/api/clients/export?format=excel&status=active&business_type=company' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  --output clients_export.xlsx
```

**Example Request (CSV):**
```bash
curl -X GET 'http://localhost/api/clients/export?format=csv&filename=clientes_activos&status=active' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  --output clientes_activos.csv
```

**Example Request (PDF):**
```bash
curl -X GET 'http://localhost/api/clients/export?format=pdf&created_from=2025-01-01&created_to=2025-12-31' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  --output clients_report.pdf
```

**Response:**
- Returns a downloadable file in the requested format
- Filename format: `{filename}_{YmdHis}.{extension}`
- Example: `clients_export_20251014_153045.xlsx`

---

## Error Responses

### Validation Error (422)
```json
{
  "message": "The razón social field is required. (and 2 more errors)",
  "errors": {
    "business_name": [
      "The razón social field is required."
    ],
    "tax_id": [
      "The RFC/NIT field is required."
    ],
    "business_type": [
      "The tipo de negocio field is required."
    ]
  }
}
```

### Duplicate Error (409)
```json
{
  "success": false,
  "message": "Ya existe un cliente con este RFC/NIT",
  "error_code": "DUPLICATE_TAX_ID",
  "metadata": {
    "field": "tax_id",
    "value": "EMP850101ABC"
  }
}
```

### Not Found (404)
```json
{
  "message": "Cliente no encontrado"
}
```

### Unauthorized (401)
```json
{
  "message": "Usuario no autenticado"
}
```

### Tenant Not Found (404)
```json
{
  "message": "Tenant no encontrado"
}
```

---

## Business Type Values

Accepted values for `business_type` field:
- `individual` - Persona física / Individual
- `company` - Empresa / Company
- `government` - Gobierno / Government entity
- `ngo` - ONG / Non-governmental organization

---

## Status Values

Possible values for client status:
- `active` - Active client
- `inactive` - Inactive client
- `suspended` - Suspended (requires reason)
- `blacklisted` - Blacklisted (requires reason)

---

## Payment Terms Values

Accepted values for `payment_terms` field:
- `immediate` - Immediate payment
- `net_15` - Net 15 days
- `net_30` - Net 30 days
- `net_60` - Net 60 days
- `custom` - Custom terms

---

## Payment Methods Values

Accepted values for `payment_methods` array:
- `cash` - Cash payment
- `check` - Check payment
- `bank_transfer` - Bank transfer
- `credit_card` - Credit card
- `financing` - Financing

---

## Notes

1. **Authentication**: All endpoints require a valid Sanctum token with company_id in abilities
2. **Multi-tenancy**: X-Company-Id header is used for tenant identification
3. **Automatic Code Generation**: Client code is automatically generated with pattern "CLI-{YEAR}-{SEQUENCE}"
4. **Status History**: Status changes (deactivate, suspend, blacklist) automatically create history records
5. **Result Pattern**: The store endpoint uses Result Pattern for clean error handling
6. **Billing Address**: If not provided, the main address is used for billing purposes
7. **Contact Permissions**: Contacts can have granular permissions (approve projects, sign documents)
8. **UUID Primary Keys**: All resources use UUID primary keys
9. **Pagination**: List endpoints support pagination via `per_page` query parameter
10. **Validation**: All requests are validated with Spanish error messages
11. **Export Features**: Supports Excel, CSV, and PDF exports with advanced filtering
12. **Tax Information**: Supports Mexican tax requirements (tax_regime, cfdi_use)

