# Backend Filters Summary

## Tổng quan các filters đã implement

### ✅ Analytes
- `search` - Search by code or name
- `departmentId` - Filter by department
- `options` - Return slim array for dropdowns

### ✅ Lots  
- `search` - Search by code or lotName
- `departmentId` - Filter by department
- `status` - Filter by status (active/inactive)
- `receivedDateFrom` - Filter from received date
- `receivedDateTo` - Filter to received date
- `options` - Return slim array for dropdowns

### ✅ Machines
- `search` - Search by deviceCode or name
- `departmentId` - Filter by department
- `lotId` - Filter machines by lot (via MachineLot junction)
- `options` - Return slim array for dropdowns

### ✅ QC Levels
- `search` - Search by name
- `departmentId` - Filter by department
- `lotId` - Filter QC levels by lot (via LotQcLevel junction)
- `options` - Return slim array for dropdowns

### ✅ Limits
- `analyteId` - Filter by analyte
- `lotId` - Filter by lot
- `qcLevelId` - Filter by QC level
- `machineId` - Filter by machine
- `departmentId` - Filter by department

### ✅ Entries
- `analyteId` - Filter by analyte
- `lotId` - Filter by lot
- `qcLevelId` - Filter by QC level
- `machineId` - Filter by machine
- `month` - Filter by month (YYYY-MM)
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `departmentId` - Filter by department

### ✅ Violations
- `analyteId` - Filter by analyte
- `lotId` - Filter by lot
- `qcLevelId` - Filter by QC level
- `machineId` - Filter by machine
- `ruleId` - Filter by Westgard rule
- `severity` - Filter by severity (warning/error)
- `startDate` - Filter from date
- `endDate` - Filter to date
- `departmentId` - Filter by department

### ✅ Westgard Rules
- `search` - Search by name or code
- `isActive` - Filter by active status
- `type` - Filter by rule type
- `departmentId` - Filter by department

### ✅ Bias Methods
- `search` - Search by name or code
- `departmentId` - Filter by department
- `options` - Return slim array for dropdowns

### ✅ Departments
- `search` - Search by name or code
- `options` - Return slim array for dropdowns

### ✅ Users
- `search` - Search by username or fullName
- `departmentId` - Filter by department
- `role` - Filter by role
- `isActive` - Filter by active status

## Common Patterns

### Pagination
Tất cả list endpoints hỗ trợ:
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)

### Search
- Sử dụng Prisma `contains` (case-sensitive by default)
- Search multiple fields với `OR` condition

### Date Range Filtering
- Sử dụng `gte` (greater than or equal) và `lte` (less than or equal)
- Support cả month filter và date range

### Options Mode
- `options=true` returns slim array without pagination
- Useful for dropdown selections
- Frontend handles sorting

## Frontend Query Examples

### Analytes
```typescript
// Search
GET /api/analytes?search=glucose&page=1&pageSize=20

// Options mode
GET /api/analytes?options=true
```

### Lots
```typescript
// Filter by status and date range
GET /api/lots?status=active&receivedDateFrom=2025-01-01&receivedDateTo=2025-12-31

// Search with pagination
GET /api/lots?search=LOT001&page=1&pageSize=20
```

### Machines
```typescript
// Filter by lot
GET /api/machines?lotId=lot123&options=true

// Search
GET /api/machines?search=BC01
```

### Entries
```typescript
// Filter by month
GET /api/entries?lotId=lot1&qcLevelId=qc1&machineId=m1&month=2025-10

// Filter by date range
GET /api/entries?startDate=2025-10-01&endDate=2025-10-31&analyteId=a1

// Multiple filters
GET /api/entries?lotId=lot1&qcLevelId=qc1&machineId=m1&analyteId=a1&page=1
```

### Limits
```typescript
// Get limits for specific context
GET /api/limits?lotId=lot1&qcLevelId=qc1&machineId=m1&analyteId=a1
```

### Violations
```typescript
// Filter by severity and date
GET /api/violations?severity=error&startDate=2025-10-01&endDate=2025-10-31

// Filter by rule
GET /api/violations?ruleId=rule1&analyteId=a1
```

## Notes

- Tất cả filters đều optional
- Filters có thể combine với nhau
- Department filter tự động apply qua `scopeByDepartment` middleware (trừ admin)
- Pagination defaults: page=1, pageSize=20
- Max pageSize: 100







