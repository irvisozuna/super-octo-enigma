# 🔧 Tool Management Module

Enterprise-level drilling tool management module for tracking, monitoring, and maintaining drilling tools throughout their lifecycle with automatic retirement based on usage and wear.

## 🎯 Purpose

Provides comprehensive management of drilling tools used in well operations. Tracks tool usage, wear levels, assignments to projects, maintenance schedules, and automatic retirement when tools reach capacity or critical wear thresholds.

## 🏗️ Architecture

This module follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture**:

```
ToolManagement/
├── Domain/                # Business logic & rules
│   ├── Entities/         # Tool aggregate root
│   ├── ValueObjects/     # ToolType, ToolStatus, WearLevel, etc.
│   ├── Events/           # Domain events
│   ├── Contracts/        # Repository interfaces
│   └── Exceptions/       # Domain exceptions
├── Application/           # Use cases & orchestration
│   ├── Commands/         # Command DTOs
│   ├── DTOs/             # Data Transfer Objects
│   ├── UseCases/         # Business use case implementations
│   └── Services/         # Application services
├── Infrastructure/        # External implementations
│   ├── Controllers/      # HTTP controllers
│   ├── Models/           # Eloquent models
│   └── Repositories/     # Repository implementations
└── Presentation/          # HTTP layer
    ├── Requests/         # Form request validations
    └── Resources/        # API resources/transformers
```

## 📊 Database Tables

- `tool_management_tools` - Main tool records with lifecycle tracking
- `tool_management_usage_history` - Historical usage records per tool
- `tool_management_maintenance_records` - Maintenance history and schedules

## 🔌 API Endpoints

Base URL: `/api/tool-management`

### Tool CRUD Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tools` | List all tools for company |
| POST | `/tools` | Create new tool |
| GET | `/tools/{id}` | Get tool details |

### Tool Lifecycle Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tools/{id}/record-usage` | Record meters used and wear level |
| POST | `/tools/{id}/assign` | Assign tool to project |
| POST | `/tools/{id}/return` | Return tool from project |
| POST | `/tools/{id}/retire` | Manually retire tool |
| POST | `/tools/{id}/send-to-maintenance` | Send tool to maintenance |
| POST | `/tools/{id}/complete-maintenance` | Mark maintenance as complete |

### Tool Queries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tools/status/available` | List available tools |
| GET | `/tools/status/in-use` | List tools currently in use |
| GET | `/tools/status/nearing-retirement` | List tools close to retirement |
| GET | `/tools/project/{projectId}` | List tools assigned to project |

## 🛠️ Tool Types

The module supports various drilling tool types:

### Drill Bits
- `drill_bit_pdc` - Polycrystalline Diamond Compact bit
- `drill_bit_tricone` - Tricone roller bit
- `drill_bit_diamond` - Natural diamond bit

### Drilling Tools
- `casing` - Casing pipes
- `drill_pipe` - Drill pipe sections
- `stabilizer` - Drill string stabilizers
- `reamer` - Hole reaming tools
- `jar` - Drilling jars
- `motor` - Downhole motors
- `sub` - Tool subs and connectors

## 📋 Tool Status

Tools transition through various states during their lifecycle:

| Status | Description | Can Record Usage | Can Assign |
|--------|-------------|------------------|------------|
| `available` | Ready for assignment | ✅ | ✅ |
| `in_use` | Assigned to project | ✅ | ❌ |
| `maintenance` | Under maintenance | ❌ | ❌ |
| `retired` | End of lifecycle | ❌ | ❌ |
| `lost` | Tool lost/missing | ❌ | ❌ |
| `damaged` | Damaged beyond repair | ❌ | ❌ |

## 🔴 Wear Levels

Tools have wear levels that increase with usage:

| Level | Numeric Value | Description | Auto-Retire |
|-------|---------------|-------------|-------------|
| `new` | 0 | Brand new tool | ❌ |
| `light` | 25 | Light wear, normal use | ❌ |
| `moderate` | 50 | Moderate wear | ❌ |
| `severe` | 75 | Severe wear, monitor closely | ✅ |
| `critical` | 90 | Critical wear, immediate retirement | ✅ |

**Note:** Tools are automatically retired when:
- Wear level reaches `severe` or `critical`
- Usage reaches 95% of total capacity

## 📤 Create Tool

### Basic Example
```bash
curl -X POST http://localhost/api/tool-management/tools \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "drill_bit_pdc",
    "serial_number": "PDC-2024-001",
    "capacity_meters": 1500.00,
    "acquired_at": "2024-01-15"
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "9c8e7d6f-5b4a-3c2d-1e0f-9a8b7c6d5e4f",
    "company_id": "a021709d-a3f3-47df-ad9c-fb36a490c7bb",
    "type": "drill_bit_pdc",
    "serial_number": "PDC-2024-001",
    "capacity_meters": 1500.00,
    "used_meters": 0.00,
    "remaining_meters": 1500.00,
    "usage_percentage": 0.00,
    "remaining_capacity_percentage": 100.00,
    "wear_level": "new",
    "status": "available",
    "acquired_at": "2024-01-15",
    "retired_at": null,
    "retirement_reason": null,
    "current_project_id": null,
    "assigned_at": null,
    "is_available_for_use": true,
    "is_assigned_to_project": false
  }
}
```

## 📊 Record Tool Usage

Track meters drilled and wear level after each use:

```bash
curl -X POST http://localhost/api/tool-management/tools/{toolId}/record-usage \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "meters_used": 45.5,
    "wear_level": "light",
    "project_id": "project-uuid",
    "report_id": "report-uuid"
  }'
```

### Usage Tracking Features
- ✅ Automatic capacity validation (prevents exceeding capacity)
- ✅ Wear level combination (takes highest wear observed)
- ✅ Remaining capacity calculation
- ✅ Auto-retirement at 95% capacity or critical wear
- ✅ Domain events for usage tracking
- ✅ Usage history recording

## 🎯 Assign Tool to Project

```bash
curl -X POST http://localhost/api/tool-management/tools/{toolId}/assign \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "9c8e7d6f-5b4a-3c2d-1e0f-9a8b7c6d5e4f",
    "notes": "Assigned for Well A-1 drilling"
  }'
```

**Validation:**
- Tool must be in `available` status
- Cannot assign already assigned tools
- Cannot assign retired/damaged/lost tools

## 🔄 Return Tool from Project

```bash
curl -X POST http://localhost/api/tool-management/tools/{toolId}/return \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "condition": "good",
    "notes": "Tool returned in good condition"
  }'
```

**Effect:**
- Status changes from `in_use` to `available`
- `current_project_id` set to null
- `assigned_at` cleared
- Tool becomes available for reassignment

## 🔧 Maintenance Operations

### Send to Maintenance
```bash
curl -X POST http://localhost/api/tool-management/tools/{toolId}/send-to-maintenance \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Scheduled preventive maintenance",
    "scheduled_date": "2024-02-01",
    "estimated_completion": "2024-02-05"
  }'
```

### Complete Maintenance
```bash
curl -X POST http://localhost/api/tool-management/tools/{toolId}/complete-maintenance \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "maintenance_notes": "Replaced worn components, tool ready for use",
    "cost": 1500.00,
    "performed_by": "Maintenance Team A"
  }'
```

## ⚠️ Retire Tool

### Manual Retirement
```bash
curl -X POST http://localhost/api/tool-management/tools/{toolId}/retire \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Tool damaged beyond repair"
  }'
```

### Automatic Retirement

Tools are **automatically retired** when:

1. **Capacity threshold reached** - 95% of total meters used
   ```
   Example: Tool with 1500m capacity automatically retires at 1425m
   ```

2. **Critical wear detected** - Wear level is `severe` or `critical`
   ```
   When recording usage, if wear_level is "severe" or "critical",
   tool is immediately retired
   ```

**Retirement Effects:**
- Status set to `retired`
- `retired_at` timestamp recorded
- Cannot be used again
- Removed from available tools
- Historical data preserved

## 🔍 Query Tools

### List Available Tools
```bash
curl -X GET "http://localhost/api/tool-management/tools/status/available" \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}"
```

### List Tools In Use
```bash
curl -X GET "http://localhost/api/tool-management/tools/status/in-use" \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}"
```

### List Tools Nearing Retirement
```bash
curl -X GET "http://localhost/api/tool-management/tools/status/nearing-retirement" \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}"
```

Returns tools with:
- Usage > 80% of capacity
- Wear level >= `moderate`

### Get Tools by Project
```bash
curl -X GET "http://localhost/api/tool-management/tools/project/{projectId}" \
  -H "Authorization: Bearer {token}" \
  -H "X-Company-Id: {company_id}"
```

## 🔗 Integration with Other Modules

### From Drilling Module

```php
use App\Modules\ToolManagement\Application\UseCases\RecordToolUsageUseCase;
use App\Modules\ToolManagement\Application\Commands\RecordToolUsageCommand;

class DrillingReportService
{
    public function __construct(
        private RecordToolUsageUseCase $recordToolUsage
    ) {}

    public function completeShift($reportId, $toolsUsed)
    {
        foreach ($toolsUsed as $toolData) {
            $command = new RecordToolUsageCommand(
                toolId: $toolData['tool_id'],
                metersUsed: $toolData['meters_drilled'],
                wearLevel: $this->assessWearLevel($toolData),
                projectId: $reportData['project_id'],
                reportId: $reportId
            );

            $result = $this->recordToolUsage->execute($command);

            if (!$result->isSuccess()) {
                // Handle error (tool might be retired automatically)
            }
        }
    }

    private function assessWearLevel($toolData): string
    {
        // Logic to determine wear based on drilling conditions
        if ($toolData['hard_formation'] && $toolData['high_rpm']) {
            return 'severe';
        }

        return 'light';
    }
}
```

### From Project Module

```php
class ProjectToolAllocationService
{
    public function assignToolsToProject($projectId, $toolIds)
    {
        $results = [];

        foreach ($toolIds as $toolId) {
            $command = new AssignToolCommand(
                toolId: $toolId,
                projectId: $projectId,
                notes: "Assigned for project {$projectId}"
            );

            $result = $this->assignToolUseCase->execute($command);
            $results[$toolId] = $result;
        }

        return $results;
    }

    public function returnProjectTools($projectId)
    {
        $tools = $this->toolQueryService->getByProject($projectId);

        foreach ($tools as $tool) {
            $command = new ReturnToolCommand(
                toolId: $tool->id(),
                condition: 'good',
                notes: 'Project completed, tools returned'
            );

            $this->returnToolUseCase->execute($command);
        }
    }
}
```

### From Inventory Module

```php
class InventoryService
{
    public function getToolInventoryStatus()
    {
        return [
            'available' => $this->toolQueryService->getAvailable(),
            'in_use' => $this->toolQueryService->getInUse(),
            'maintenance' => $this->toolQueryService->getInMaintenance(),
            'nearing_retirement' => $this->toolQueryService->getNearingRetirement(),
            'total_value' => $this->calculateTotalValue(),
        ];
    }

    public function getDepreciationReport()
    {
        $tools = $this->toolQueryService->all();

        return $tools->map(function($tool) {
            $usagePercent = $tool->usagePercentage();
            $remainingValue = $this->calculateRemainingValue($tool);

            return [
                'tool_id' => $tool->id(),
                'serial_number' => $tool->serialNumber(),
                'type' => $tool->type()->value(),
                'usage_percentage' => $usagePercent,
                'remaining_value' => $remainingValue,
                'depreciation_rate' => $usagePercent . '%',
            ];
        });
    }
}
```

## 📈 Business Rules

### Capacity Management
```php
// Tools cannot exceed their capacity
$tool->capacity_meters = 1500.00;
$tool->used_meters = 1400.00; // 93.3% used

// This will work
$tool->recordUsage(meters: 50.00, wear: 'light'); // 96.7% - auto-retires

// This will throw ToolException
$tool->recordUsage(meters: 200.00, wear: 'light'); // Would exceed 100%
```

### Wear Level Tracking
```php
// Wear levels are combined (highest wins)
$tool->wearLevel = 'light';
$tool->recordUsage(meters: 100, wear: 'moderate');
// Result: wearLevel = 'moderate'

$tool->recordUsage(meters: 100, wear: 'light');
// Result: wearLevel = 'moderate' (unchanged, takes highest)

$tool->recordUsage(meters: 100, wear: 'critical');
// Result: Tool auto-retires immediately
```

### Status Transitions

Valid transitions:
```
available → in_use (via assign)
in_use → available (via return)
available/in_use → maintenance (via send to maintenance)
maintenance → available (via complete maintenance)
any → retired (via retire/auto-retire)
any → lost/damaged (via report lost/damaged)
```

Invalid transitions throw `ToolException`.

## 🎓 Domain Events

The module emits the following domain events:

| Event | Triggered When | Payload |
|-------|----------------|---------|
| `ToolCreated` | New tool registered | toolId, companyId, type, serialNumber, capacity |
| `ToolUsageRecorded` | Usage logged | toolId, metersUsed, totalUsed, wearLevel, remainingCapacity |
| `ToolStatusChanged` | Status changes | toolId, oldStatus, newStatus, projectId |
| `ToolMaintenanceScheduled` | Sent to maintenance | toolId, reason, previousStatus |
| `ToolRetired` | Tool retired | toolId, reason, totalMetersUsed, finalWearLevel |

### Event Listeners

Example event listener for alerts:

```php
use App\Modules\ToolManagement\Domain\Events\ToolRetired;

class NotifyToolRetirementListener
{
    public function handle(ToolRetired $event): void
    {
        // Send notification to inventory manager
        Notification::send(
            User::role('inventory_manager')->get(),
            new ToolRetiredNotification($event->toolId, $event->reason)
        );

        // Update inventory counts
        $this->inventoryService->recordRetirement($event->toolId);

        // Check if replacement needed
        if ($this->shouldOrderReplacement($event)) {
            $this->purchaseService->createPurchaseRequest($event);
        }
    }
}
```

## 📊 Reporting & Analytics

### Tool Utilization Report
```php
class ToolAnalyticsService
{
    public function getUtilizationReport($startDate, $endDate)
    {
        $tools = $this->repository->all(current_company_id());

        return [
            'total_tools' => $tools->count(),
            'average_usage_percentage' => $tools->avg(fn($t) => $t->usagePercentage()),
            'tools_by_status' => $this->groupByStatus($tools),
            'tools_by_wear_level' => $this->groupByWearLevel($tools),
            'projected_retirements_30_days' => $this->projectRetirements(30),
            'most_used_tools' => $this->getMostUsedTools(10),
            'underutilized_tools' => $this->getUnderutilizedTools(),
        ];
    }

    public function getCostAnalysis()
    {
        return [
            'total_investment' => $this->calculateTotalInvestment(),
            'average_cost_per_meter' => $this->calculateCostPerMeter(),
            'maintenance_costs' => $this->getMaintenanceCosts(),
            'projected_replacement_costs' => $this->projectReplacementCosts(),
        ];
    }
}
```

## 🧪 Testing

### Unit Tests (Domain Layer)
```bash
# Run all tool management tests
./vendor/bin/sail artisan test app/Modules/ToolManagement/tests/

# Run domain tests only
./vendor/bin/sail artisan test app/Modules/ToolManagement/tests/Unit

# Run specific test
./vendor/bin/sail artisan test --filter=ToolEntityTest
```

### Test Coverage

- ✅ Tool creation and registration
- ✅ Usage recording with capacity validation
- ✅ Wear level combination logic
- ✅ Auto-retirement at threshold
- ✅ Assignment and return workflows
- ✅ Maintenance lifecycle
- ✅ Status transitions
- ✅ Business rule enforcement
- ✅ Domain event emission

## 🔐 Security & Permissions

### Required Permissions

```php
// In your permission seeder
'tool-management.view' => 'View tools',
'tool-management.create' => 'Create new tools',
'tool-management.record-usage' => 'Record tool usage',
'tool-management.assign' => 'Assign tools to projects',
'tool-management.return' => 'Return tools from projects',
'tool-management.maintenance' => 'Manage tool maintenance',
'tool-management.retire' => 'Retire tools',
```

### Multi-tenancy

All tools are scoped to company:
- `company_id` set automatically via middleware
- Queries filtered by current company
- Unique serial numbers per company
- Cross-company tool access prevented

## ⚙️ Configuration

### Environment Variables
```env
# Tool Management Settings
TOOL_AUTO_RETIRE_THRESHOLD=0.95  # 95% capacity
TOOL_MAINTENANCE_REMINDER_DAYS=30
TOOL_NEARING_RETIREMENT_THRESHOLD=0.80  # 80% capacity
```

## 📋 Validation Rules

### Create Tool
- `type`: Required, must be valid tool type
- `serial_number`: Required, max 100 chars, unique per company
- `capacity_meters`: Required, numeric, min 0.01
- `acquired_at`: Optional, valid date

### Record Usage
- `meters_used`: Required, numeric, min 0.01
- `wear_level`: Required, valid wear level (new, light, moderate, severe, critical)
- `project_id`: Optional, valid UUID
- `report_id`: Optional, valid UUID

### Assign Tool
- `project_id`: Required, valid UUID
- `notes`: Optional, string, max 500 chars

## 🚀 Future Enhancements

1. **Predictive Maintenance** - ML-based wear prediction
2. **Cost Tracking** - Track acquisition, maintenance, and operating costs
3. **Performance Analytics** - Compare tool performance across projects
4. **Bulk Operations** - Assign/return multiple tools at once
5. **QR Code Integration** - Physical tool tracking with QR codes
6. **Tool Reservation** - Reserve tools for upcoming projects
7. **Calibration Tracking** - Track calibration dates for precision tools
8. **Vendor Management** - Track tool suppliers and warranty

## 📝 Notes

- Serial numbers must be unique within a company
- Tools automatically retire at 95% capacity or critical wear
- Retired tools cannot be reactivated
- Usage history is preserved for audit trail
- All operations are logged via domain events
- Multi-tenancy ensures complete data isolation

## 🆘 Support

For issues or questions about this module:
1. Check this README
2. Review the domain entity: `Domain/Entities/Tool.php`
3. Check value objects for business rules
4. Review use cases for workflow logic
5. Contact the development team

## 💡 Best Practices

### 1. Always Record Usage After Each Shift
```php
// Good - Record usage immediately
$tool->recordUsage(meters: 45.5, wear: 'light');

// Bad - Waiting to record usage
// (May lose track of actual usage and wear)
```

### 2. Assess Wear Accurately
```php
// Consider drilling conditions
if ($hardFormation && $highRPM) {
    $wear = 'severe';
} elseif ($normalConditions) {
    $wear = 'light';
}
```

### 3. Return Tools Promptly
```php
// Return tools when project phase completes
// Don't keep tools assigned longer than needed
$tool->returnFromProject();
```

### 4. Monitor Nearing Retirement
```php
// Check weekly for tools approaching limits
$nearingRetirement = $queryService->getNearingRetirement();

// Order replacements proactively
foreach ($nearingRetirement as $tool) {
    $this->procurementService->orderReplacement($tool);
}
```

### 5. Use Domain Events
```php
// Listen to domain events for business workflows
class ToolRetiredListener
{
    public function handle(ToolRetired $event)
    {
        // Automatically create procurement request
        // Update inventory counts
        // Notify relevant teams
    }
}
```
