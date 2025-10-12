# Bio-Lab API Documentation

## Authentication

All API endpoints (except `/api/auth/login`) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "username": "admin",
      "role": "admin",
      "departmentId": "dept_id"
    }
  }
}
```

### Get Current User
**GET** `/api/auth/me`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "admin",
    "fullName": "Administrator",
    "role": "admin",
    "departmentId": "dept_id",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

## Lookups & Options

### Initial Lookup Data
**GET** `/api/lookups/init`

Returns all initial data needed for FE dropdowns on page load.

**Response:**
```json
{
  "success": true,
  "data": {
    "lots": [{ "id": "lot1", "code": "LOT001", "lotName": "QC Lot Jan 2025" }],
    "machines": [{ "id": "m1", "deviceCode": "BC01", "name": "Machine 1", "label": "BC01 - Machine 1" }],
    "qcLevels": [{ "id": "qc1", "name": "QC1" }],
    "analytes": [{ "id": "a1", "code": "GLU", "name": "Glucose" }]
  }
}
```

**Note:** Machines and QC levels are returned for the first lot only. Frontend will refetch when lot changes.

### Options Mode

All list endpoints (`/api/analytes`, `/api/lots`, `/api/machines`, `/api/qc-levels`) support `?options=true` to return a slim array for dropdowns (no pagination).

**Example:**
```
GET /api/analytes?options=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "a1", "code": "GLU", "name": "Glucose" },
    { "id": "a2", "code": "URE", "name": "Urea" }
  ]
}
```

**Note:** Frontend will handle sorting. Backend returns items by `id` ASC.

### Dependent Lookups

**GET** `/api/lots/:lotId/machines` - Get machines for a specific lot  
**GET** `/api/lots/:lotId/qc-levels` - Get QC levels for a specific lot

**Example Response:**
```json
{
  "success": true,
  "data": [
    { "id": "m1", "deviceCode": "BC01", "name": "Machine 1", "label": "BC01 - Machine 1" }
  ]
}
```

### Query Filters

- **Machines:** Support `?lotId=xxx` to filter machines by lot
- **QC Levels:** Support `?lotId=xxx` to filter QC levels by lot
- **Entries:** Support `?month=YYYY-MM` to filter by month

## Core Resources

### Analytes

**Base URL:** `/api/analytes`

#### List Analytes
**GET** `/api/analytes`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by code or name
- `options` (boolean): If `true`, returns slim array (no pagination)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "analyte_id",
        "code": "GLU",
        "name": "Glucose",
        "unit": "mg/dL",
        "decimals": 2,
        "qualityRequirement": 6.0,
        "note": "Fasting glucose",
        "departmentId": "dept_id",
        "createdBy": "user_id",
        "updatedBy": "user_id",
        "createdAt": "2025-01-27T10:00:00.000Z",
        "updatedAt": "2025-01-27T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

#### Create Analyte
**POST** `/api/analytes`

**Request Body:**
```json
{
  "code": "GLU",
  "name": "Glucose",
  "unit": "mg/dL",
  "decimals": 2,
  "qualityRequirement": 6.0,
  "note": "Fasting glucose"
}
```

#### Update Analyte
**PUT** `/api/analytes/:id`

#### Delete Analyte
**DELETE** `/api/analytes/:id`

### Lots

**Base URL:** `/api/lots`

Similar structure to Analytes, with additional fields:
- `lotName`: Lot name
- `status`: Status (1 = active, 0 = inactive)
- `receivedDate`: Date received
- `expiryDate`: Expiry date

### Machines

**Base URL:** `/api/machines`

Additional fields:
- `deviceCode`: Device code
- `model`: Machine model
- `serial`: Serial number
- `status`: Status (1 = active, 0 = inactive)

### QC Levels

**Base URL:** `/api/qc-levels`

Simple structure with:
- `name`: QC level name (e.g., "QC1", "QC2", "QC3")

### Limits

**Base URL:** `/api/limits`

#### List Limits
**GET** `/api/limits`

**Query Parameters:**
- `page`, `pageSize`: Pagination
- `analyteId`: Filter by analyte
- `lotId`: Filter by lot
- `qcLevelId`: Filter by QC level
- `machineId`: Filter by machine

**Response includes related data:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "limit_id",
        "analyteId": "analyte_id",
        "lotId": "lot_id",
        "qcLevelId": "qc_level_id",
        "machineId": "machine_id",
        "unit": "mg/dL",
        "decimals": 2,
        "mean": 100.0,
        "sd": 5.0,
        "cv": 5.0,
        "tea": 6.0,
        "cvRef": 4.0,
        "peerGroup": 4.5,
        "biasEqa": 2.0,
        "biasMethod": "bias_iqc",
        "qcName": "QC1",
        "exp": "2025-12-31T00:00:00.000Z",
        "method": "Enzymatic",
        "note": "Standard limits",
        "analyte": {
          "id": "analyte_id",
          "code": "GLU",
          "name": "Glucose"
        },
        "lot": {
          "id": "lot_id",
          "code": "LOT001",
          "lotName": "Glucose QC1"
        },
        "qcLevel": {
          "id": "qc_level_id",
          "name": "QC1"
        },
        "machine": {
          "id": "machine_id",
          "deviceCode": "AU680",
          "name": "AU680 Chemistry Analyzer"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### Entries

**Base URL:** `/api/entries`

#### List Entries
**GET** `/api/entries`

**Query Parameters:**
- `page`, `pageSize`: Pagination
- `analyteId`, `lotId`, `qcLevelId`, `machineId`: Context filters
- `month`: Filter by month (YYYY-MM format)
- `startDate`, `endDate`: Date range (YYYY-MM-DD format)

**Response includes related data similar to Limits.**

#### Create/Update/Delete Entries
**POST/PUT/DELETE** `/api/entries`

**Note:** These operations check for month locks. If the entry date falls in a locked month (configured in Department.lockedEntryMonths), the operation will be rejected unless the user is an admin.

### Violations

**Base URL:** `/api/violations`

#### List Violations
**GET** `/api/violations`

**Query Parameters:**
- `page`, `pageSize`: Pagination
- `analyteId`, `lotId`, `qcLevelId`, `machineId`: Context filters
- `ruleId`: Filter by Westgard rule
- `status`: Filter by status (approved, rejected, pending)

**Response includes related data for analyte, lot, qcLevel, machine, and rule.**

### Westgard Rules

**Base URL:** `/api/westgard-rules`

Fields include:
- `code`: Rule code (e.g., "wg_1_2s")
- `name`: Rule name
- `severity`: warning, error, critical
- `description`: Rule description
- `type`: Rule type
- `windowSize`, `thresholdSd`, `consecutivePoints`: Rule parameters
- `sameSide`, `oppositeSides`: Boolean flags
- `sumAbsZGt`: Sum threshold
- `expression`: Custom expression
- `customMessage`: Custom message
- `orderIndex`: Display order
- `params`: JSON string with additional parameters
- `isActive`: Whether rule is active

### Bias Methods

**Base URL:** `/api/bias-methods`

Simple structure with:
- `name`: Method name
- `note`: Description

### Departments (Admin Only)

**Base URL:** `/api/departments`

**Admin-only access required.**

Fields include:
- `code`: Department code
- `name`: Department name
- `lockedEntryMonths`: CSV of locked months (e.g., "2025-09,2025-10")

### Users (Admin Only)

**Base URL:** `/api/users`

**Admin-only access required.**

#### List Users
**GET** `/api/users`

**Query Parameters:**
- `page`, `pageSize`: Pagination
- `search`: Search by username or fullName
- `departmentId`: Filter by department

#### Create User
**POST** `/api/users`

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "fullName": "New User",
  "role": "user",
  "departmentId": "dept_id",
  "position": "Technician",
  "dob": "1990-01-01T00:00:00.000Z",
  "note": "New technician"
}
```

#### Change Password
**PUT** `/api/users/:id/change-password`

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Missing or invalid input
- `UNAUTHORIZED`: Missing or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_CODE`: Unique constraint violation
- `MONTH_LOCKED`: Entry month is locked
- `INVALID_DATE`: Invalid date format

## Sample cURL Commands

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### List Analytes
```bash
curl -X GET "http://localhost:4000/api/analytes?page=1&pageSize=10&search=glu" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Analyte
```bash
curl -X POST http://localhost:4000/api/analytes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GLU",
    "name": "Glucose",
    "unit": "mg/dL",
    "decimals": 2,
    "qualityRequirement": 6.0
  }'
```

### List Entries with Month Filter
```bash
curl -X GET "http://localhost:4000/api/entries?month=2025-01&analyteId=analyte_id" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Entry (with month lock check)
```bash
curl -X POST http://localhost:4000/api/entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analyteId": "analyte_id",
    "lotId": "lot_id",
    "qcLevelId": "qc_level_id",
    "machineId": "machine_id",
    "entryDate": "2025-01-27T10:00:00.000Z",
    "value": 95.5
  }'
```

## Department Scoping

Non-admin users can only access data from their own department. Admin users can access all data across departments.

## Month Locking

Entries can be locked by month per department. When creating/updating/deleting entries, the system checks if the entry date's month is in the department's `lockedEntryMonths` CSV. If locked, the operation is rejected unless the user is an admin.

To configure locked months:
```bash
curl -X PUT http://localhost:4000/api/departments/dept_id \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lockedEntryMonths": "2025-09,2025-10"}'
```
