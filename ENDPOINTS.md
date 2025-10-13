# Employee Module - API Endpoints

## Base URL
```
http://localhost/api/employees
```

## Authentication
All endpoints require authentication using Laravel Sanctum:
- Header: `Authorization: Bearer {token}`
- Header: `X-Company-Id: {company_uuid}`

## Table of Contents
1. [List & Search Endpoints](#list--search-endpoints)
2. [CRUD Operations](#crud-operations)
3. [Status Management](#status-management)
4. [Skills Management](#skills-management)
5. [Certifications Management](#certifications-management)
6. [Employment History](#employment-history)

---

## List & Search Endpoints

### 1. List All Active Employees
**GET** `/api/employees`

Returns paginated list of active employees.

**Query Parameters:**
- `per_page` (optional, default: 20) - Number of items per page

**Example Request:**
```bash
curl -X GET 'http://localhost/api/employees?per_page=20' \
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
      "employee_code": "EMP-001",
      "first_name": "Juan",
      "last_name": "Pérez",
      "full_name": "Juan Pérez",
      "email": "juan.perez@example.com",
      "primary_phone": "6621234567",
      "position": "operator",
      "department": "Operations",
      "employment_type": "full_time",
      "status": "active",
      "hire_date": "2025-01-01T00:00:00.000000Z",
      "is_active": true,
      ...
    }
  ],
  "links": {...},
  "meta": {...}
}
```

---

### 2. Search Employees
**GET** `/api/employees/search`

Search employees by multiple criteria.

**Query Parameters:**
- `first_name` (optional) - Filter by first name
- `last_name` (optional) - Filter by last name
- `position` (optional) - Filter by position (operator, helper, manager, supervisor, admin)
- `status` (optional) - Filter by status (active, inactive, suspended, terminated, vacation)
- `department` (optional) - Filter by department
- `per_page` (optional, default: 20) - Number of items per page

**Example Request:**
```bash
curl -X GET 'http://localhost/api/employees/search?position=operator&status=active' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

---

### 3. Get Employees by Position
**GET** `/api/employees/by-position/{position}`

Get all employees with a specific position.

**Path Parameters:**
- `position` - Position name (operator, helper, manager, supervisor, admin)

**Example Request:**
```bash
curl -X GET 'http://localhost/api/employees/by-position/operator' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

---

### 4. Get Operators
**GET** `/api/employees/roles/operators`

Get all employees with operator position.

**Example Request:**
```bash
curl -X GET 'http://localhost/api/employees/roles/operators' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

---

### 5. Get Helpers
**GET** `/api/employees/roles/helpers`

Get all employees with helper position.

**Example Request:**
```bash
curl -X GET 'http://localhost/api/employees/roles/helpers' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

---

## CRUD Operations

### 6. Get Single Employee
**GET** `/api/employees/{id}`

Get detailed information about a specific employee.

**Path Parameters:**
- `id` - Employee UUID

**Example Request:**
```bash
curl -X GET 'http://localhost/api/employees/{employee_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "data": {
    "id": "a017bd5c-ef51-4d38-958f-c82be455278b",
    "employee_code": "EMP-001",
    "hire_date": "2025-01-01T00:00:00.000000Z",
    "created_at": "2025-10-12T03:03:36.000000Z",
    "updated_at": "2025-10-12T03:03:36.000000Z",
    "first_name": "Juan",
    "last_name": "Pérez",
    "full_name": "Juan Pérez",
    "email": "juan.perez@test.com",
    "primary_phone": "6621234567",
    "secondary_phone": null,
    "position": "operator",
    "department": null,
    "employment_type": "full_time",
    "status": "active",
    "photo_url": null,
    "date_of_birth": null,
    "termination_date": null,
    "gender": null,
    "tax_id": null,
    "address_line_1": null,
    "address_line_2": null,
    "city": null,
    "state": null,
    "postal_code": null,
    "country": null,
    "emergency_contact_name": null,
    "emergency_contact_phone": null,
    "is_active": true,
    "age": null
  },
  "meta": {
    "resource": "EmployeeResource",
    "version": "1.0.0"
  }
}
```

---

### 7. Create Employee
**POST** `/api/employees`

Create a new employee. Automatically creates a HIRED employment history record.

**Request Body:**
```json
{
  "employee_code": "EMP-001",
  "first_name": "Juan",
  "last_name": "Pérez",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "tax_id": "JUAP900115HDFRRN01",
  "photo_url": "https://example.com/photo.jpg",
  "primary_phone": "6621234567",
  "secondary_phone": "6629876543",
  "email": "juan.perez@example.com",
  "address_line_1": "Calle Principal 123",
  "address_line_2": "Col. Centro",
  "city": "Hermosillo",
  "state": "Sonora",
  "postal_code": "83000",
  "country": "México",
  "emergency_contact_name": "María Pérez",
  "emergency_contact_phone": "6621111111",
  "hire_date": "2025-01-01",
  "position": "operator",
  "department": "Operations",
  "employment_type": "full_time",
  "salary_amount": 15000.00,
  "salary_currency": "MXN",
  "status": "active"
}
```

**Field Validations:**
- `employee_code` (required, string, max:50, unique)
- `first_name` (required, string, max:100)
- `last_name` (required, string, max:100)
- `date_of_birth` (optional, date, before:today)
- `gender` (optional, enum: male, female, other)
- `tax_id` (optional, string, max:50)
- `photo_url` (optional, url, max:500)
- `primary_phone` (optional, string, max:20)
- `secondary_phone` (optional, string, max:20)
- `email` (optional, email, max:255)
- `hire_date` (required, date)
- `termination_date` (optional, date, after:hire_date)
- `position` (required, enum: operator, helper, manager, supervisor, admin)
- `department` (optional, string, max:100)
- `employment_type` (required, enum: full_time, part_time, contractor, temporary)
- `salary_amount` (optional, numeric, min:0)
- `salary_currency` (optional, string, size:3)
- `status` (optional, enum: active, inactive, suspended, terminated, vacation)

**Example Request:**
```bash
curl -X POST 'http://localhost/api/employees' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "employee_code": "EMP-001",
    "first_name": "Juan",
    "last_name": "Pérez",
    "position": "operator",
    "employment_type": "full_time",
    "email": "juan.perez@example.com",
    "primary_phone": "6621234567",
    "hire_date": "2025-01-01"
  }'
```

---

### 8. Update Employee
**PUT** `/api/employees/{id}` or **PATCH** `/api/employees/{id}`

Update employee information. All fields are optional (partial update).

**Path Parameters:**
- `id` - Employee UUID

**Request Body:** (all fields optional)
```json
{
  "first_name": "Juan Carlos",
  "email": "juancarlos.perez@example.com",
  "position": "supervisor",
  "status": "active"
}
```

**Example Request:**
```bash
curl -X PUT 'http://localhost/api/employees/{employee_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "position": "supervisor",
    "department": "Management"
  }'
```

---

### 9. Delete Employee
**DELETE** `/api/employees/{id}`

Permanently delete an employee.

**Path Parameters:**
- `id` - Employee UUID

**Example Request:**
```bash
curl -X DELETE 'http://localhost/api/employees/{employee_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "message": "Empleado eliminado correctamente"
}
```

---

## Status Management

All status changes automatically create employment history records.

### 10. Suspend Employee
**POST** `/api/employees/{id}/suspend`

Change employee status to suspended. Creates a SUSPENSION history record.

**Path Parameters:**
- `id` - Employee UUID

**Example Request:**
```bash
curl -X POST 'http://localhost/api/employees/{employee_id}/suspend' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "data": {
    "id": "uuid",
    "employee_code": "EMP-001",
    "status": "suspended",
    "is_active": false,
    ...
  }
}
```

---

### 11. Reactivate Employee
**POST** `/api/employees/{id}/reactivate`

Change employee status to active. Creates a REACTIVATION history record.

**Path Parameters:**
- `id` - Employee UUID

**Example Request:**
```bash
curl -X POST 'http://localhost/api/employees/{employee_id}/reactivate' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

---

### 12. Terminate Employee
**POST** `/api/employees/{id}/terminate`

Terminate employee contract. Creates a TERMINATION history record and sets termination_date.

**Path Parameters:**
- `id` - Employee UUID

**Example Request:**
```bash
curl -X POST 'http://localhost/api/employees/{employee_id}/terminate' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "data": {
    "id": "uuid",
    "employee_code": "EMP-001",
    "status": "terminated",
    "termination_date": "2025-10-12T00:00:00.000000Z",
    "is_active": false,
    ...
  }
}
```

---

## Skills Management

### 13. Add Skill to Employee
**POST** `/api/employees/{id}/skills`

Add a new skill to an employee.

**Path Parameters:**
- `id` - Employee UUID

**Request Body:**
```json
{
  "skill_name": "JavaScript",
  "proficiency_level": "advanced",
  "years_of_experience": 5,
  "acquired_date": "2020-01-01",
  "notes": "Specialized in React and Node.js"
}
```

**Field Validations:**
- `skill_name` (required, string, max:255)
- `proficiency_level` (required, enum: beginner, intermediate, advanced, expert)
- `years_of_experience` (optional, integer)
- `acquired_date` (optional, date)
- `notes` (optional, text)

**Example Request:**
```bash
curl -X POST 'http://localhost/api/employees/{employee_id}/skills' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "skill_name": "Manejo de vehículos pesados",
    "proficiency_level": "expert",
    "years_of_experience": 10
  }'
```

**Example Response:**
```json
{
  "message": "Habilidad agregada correctamente",
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "skill_name": "Manejo de vehículos pesados",
    "proficiency_level": "expert",
    "years_of_experience": 10,
    ...
  }
}
```

---

### 14. Update Skill
**PUT** `/api/employees/{id}/skills/{skillId}`

Update an existing skill.

**Path Parameters:**
- `id` - Employee UUID
- `skillId` - Skill UUID

**Request Body:** (all fields optional)
```json
{
  "proficiency_level": "expert",
  "years_of_experience": 12
}
```

**Example Request:**
```bash
curl -X PUT 'http://localhost/api/employees/{employee_id}/skills/{skill_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "proficiency_level": "expert",
    "years_of_experience": 12
  }'
```

**Example Response:**
```json
{
  "message": "Habilidad actualizada correctamente",
  "data": {
    "id": "uuid",
    "proficiency_level": "expert",
    "years_of_experience": 12,
    ...
  }
}
```

---

### 15. Delete Skill
**DELETE** `/api/employees/{id}/skills/{skillId}`

Remove a skill from an employee (soft delete).

**Path Parameters:**
- `id` - Employee UUID
- `skillId` - Skill UUID

**Example Request:**
```bash
curl -X DELETE 'http://localhost/api/employees/{employee_id}/skills/{skill_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "message": "Habilidad eliminada correctamente"
}
```

---

## Certifications Management

### 16. Add Certification to Employee
**POST** `/api/employees/{id}/certifications`

Add a new certification to an employee.

**Path Parameters:**
- `id` - Employee UUID

**Request Body:**
```json
{
  "certification_name": "Licencia Federal Tipo A",
  "certification_number": "FED-2025-12345",
  "issuing_organization": "SCT",
  "issue_date": "2025-01-15",
  "expiration_date": "2030-01-15",
  "status": "active",
  "document_url": "https://example.com/cert.pdf"
}
```

**Field Validations:**
- `certification_name` (required, string, max:200)
- `certification_number` (optional, string, max:100)
- `issuing_organization` (required, string, max:200)
- `issue_date` (required, date)
- `expiration_date` (optional, date, after:issue_date)
- `status` (required, string, max:50)
- `document_url` (optional, url, max:500)

**Example Request:**
```bash
curl -X POST 'http://localhost/api/employees/{employee_id}/certifications' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "certification_name": "Licencia Federal Tipo A",
    "certification_number": "FED-2025-12345",
    "issuing_organization": "SCT",
    "issue_date": "2025-01-15",
    "expiration_date": "2030-01-15",
    "status": "active"
  }'
```

**Example Response:**
```json
{
  "message": "Certificación agregada correctamente",
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "certification_name": "Licencia Federal Tipo A",
    "certification_number": "FED-2025-12345",
    "issuing_organization": "SCT",
    "issue_date": "2025-01-15",
    "expiration_date": "2030-01-15",
    "status": "active",
    ...
  }
}
```

---

### 17. Delete Certification
**DELETE** `/api/employees/{id}/certifications/{certificationId}`

Remove a certification from an employee (soft delete).

**Path Parameters:**
- `id` - Employee UUID
- `certificationId` - Certification UUID

**Example Request:**
```bash
curl -X DELETE 'http://localhost/api/employees/{employee_id}/certifications/{cert_id}' \
  -H 'Authorization: Bearer {token}' \
  -H 'X-Company-Id: {company_id}' \
  -H 'Accept: application/json'
```

**Example Response:**
```json
{
  "message": "Certificación eliminada correctamente"
}
```

---

## Employment History

### 18. Get Employee History
**GET** `/api/employees/{id}/history`

Get complete employment history for an employee. Returns all status and position changes in reverse chronological order.

**Path Parameters:**
- `id` - Employee UUID

**Example Request:**
```bash
curl -X GET 'http://localhost/api/employees/{employee_id}/history' \
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
      "employee_id": "uuid",
      "change_type": "termination",
      "change_description": "Terminado contrato",
      "previous_position": "operator",
      "new_position": null,
      "previous_status": "active",
      "new_status": "terminated",
      "change_date": "2025-10-12",
      "reason": "Terminación de contrato",
      "notes": null,
      "changed_by": "uuid",
      "changed_by_user": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "created_at": "2025-10-12T03:04:51.000000Z",
      "updated_at": "2025-10-12T03:04:51.000000Z"
    },
    {
      "id": "uuid",
      "employee_id": "uuid",
      "change_type": "reactivation",
      "change_description": "Reactivado",
      "previous_position": "operator",
      "new_position": "operator",
      "previous_status": "suspended",
      "new_status": "active",
      "change_date": "2025-10-12",
      "reason": "Reactivación del empleado",
      "notes": null,
      "changed_by": "uuid",
      "changed_by_user": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "created_at": "2025-10-12T03:04:35.000000Z",
      "updated_at": "2025-10-12T03:04:35.000000Z"
    },
    {
      "id": "uuid",
      "employee_id": "uuid",
      "change_type": "suspension",
      "change_description": "Suspendido",
      "previous_position": "operator",
      "new_position": "operator",
      "previous_status": "active",
      "new_status": "suspended",
      "change_date": "2025-10-12",
      "reason": "Suspensión del empleado",
      "notes": null,
      "changed_by": "uuid",
      "changed_by_user": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "created_at": "2025-10-12T03:03:55.000000Z",
      "updated_at": "2025-10-12T03:03:55.000000Z"
    },
    {
      "id": "uuid",
      "employee_id": "uuid",
      "change_type": "hired",
      "change_description": "Contratado como operator",
      "previous_position": null,
      "new_position": "operator",
      "previous_status": null,
      "new_status": "active",
      "change_date": "2025-10-12",
      "reason": "Contratación inicial",
      "notes": null,
      "changed_by": "uuid",
      "changed_by_user": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "created_at": "2025-10-12T03:03:36.000000Z",
      "updated_at": "2025-10-12T03:03:36.000000Z"
    }
  ]
}
```

**History Change Types:**
- `hired` - Initial employee hiring
- `promotion` - Position upgrade
- `transfer` - Position change (lateral move)
- `status_change` - General status change
- `suspension` - Employee suspension
- `reactivation` - Employee reactivation
- `termination` - Employment termination

---

## Error Responses

### Validation Error (422)
```json
{
  "message": "The selected posición is invalid. (and 1 more error)",
  "errors": {
    "position": [
      "The selected posición is invalid."
    ],
    "employment_type": [
      "The tipo de empleo field is required."
    ]
  }
}
```

### Not Found (404)
```json
{
  "message": "Empleado no encontrado"
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

## Notes

1. **Authentication**: All endpoints require a valid Sanctum token with company_id in abilities
2. **Multi-tenancy**: X-Company-Id header is used for tenant identification
3. **Automatic History**: Status changes (suspend, reactivate, terminate) and employee creation automatically create employment history records
4. **Soft Deletes**: Skills and Certifications use soft deletes and can be restored
5. **UUID Primary Keys**: All resources use UUID primary keys
6. **Pagination**: List endpoints support pagination via `per_page` query parameter
7. **Validation**: All requests are validated with Spanish error messages
