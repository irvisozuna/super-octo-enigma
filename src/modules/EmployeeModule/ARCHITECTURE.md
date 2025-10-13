# Employee Module - Arquitectura y Mejores Prácticas

## 🎯 Comparación con TransportModule

Este documento explica las mejoras y diferencias arquitectónicas entre el módulo Employee (nuevo estándar) y el módulo Transport (anterior).

## 📊 Comparación de Arquitectura

| Aspecto | TransportModule | EmployeeModule (Nuevo Estándar) | Mejora |
|---------|----------------|----------------------------------|--------|
| **Value Objects** | ❌ No implementados | ✅ Email, PhoneNumber, FullName | Encapsulación y validación |
| **Contratos explícitos** | ⚠️ Algunos | ✅ INotificationService, etc. | Desacoplamiento |
| **Repository Pattern** | ✅ Implementado | ✅ Mejorado con tipos estrictos | Mejor type safety |
| **Domain Logic** | ⚠️ Dispersa | ✅ Centralizada en EmployeeDomain | Mantenibilidad |
| **Dependency Injection** | ⚠️ Básica | ✅ Container con IoC | Testabilidad |
| **Separación de capas** | ⚠️ Buena | ✅ Estricta con dependencias claras | Clean Architecture |
| **Mappers** | ✅ Implementados | ✅ Mejorados con tipos explícitos | Type safety |
| **Error Handling** | ✅ Básico | ✅ Centralizado y estructurado | UX mejorada |

## 🚀 Mejoras Implementadas

### 1. Value Objects (Nuevo)

#### ❌ Antes (TransportModule)
```typescript
// Validación dispersa en múltiples lugares
if (!data.email || !isValidEmail(data.email)) {
  errors.push('Email inválido')
}

// Función helper global
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

#### ✅ Ahora (EmployeeModule)
```typescript
// Value Object con encapsulación completa
export class Email {
  private readonly _value: string

  static create(value: string): Email {
    if (!Email.isValid(value))
      throw new Error('Email inválido')
    return new Email(value.toLowerCase().trim())
  }

  static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  get value(): string {
    return this._value
  }
}

// Uso: Siempre válido
const email = Email.create('user@example.com')
```

**Beneficios**:
- ✅ Validación centralizada
- ✅ Inmutabilidad garantizada
- ✅ Reutilizable en todo el dominio
- ✅ Type-safe

### 2. Contratos Explícitos (Mejorado)

#### ❌ Antes (TransportModule)
```typescript
// Dependencia directa de implementación
export class VehicleApplicationService {
  constructor(
    private vehicleRepository: VehicleRepository,
    private notificationService?: (options: NotificationOptions) => void  // ← Función, no contrato
  ) {}
}
```

#### ✅ Ahora (EmployeeModule)
```typescript
// Interface explícita
export interface INotificationService {
  notify(options: NotificationOptions): void
  success(title: string, message: string): void
  error(title: string, message: string): void
  warning(title: string, message: string): void
  info(title: string, message: string): void
}

// Service usa el contrato
export class EmployeeApplicationService {
  constructor(
    private employeeRepository: EmployeeRepository,
    private notificationService?: INotificationService  // ← Interface explícita
  ) {}
}
```

**Beneficios**:
- ✅ Desacoplamiento total
- ✅ Fácil de mockear en tests
- ✅ Intercambiable sin cambios
- ✅ Autodocumentado

### 3. Domain Logic Centralizada (Mejorado)

#### ❌ Antes (TransportModule)
```typescript
// Lógica de negocio dispersa
export class VehicleDomain {
  static validate(data: Partial<CreateVehicleRequest>): string[] {
    // Solo validación
  }

  static calculateAge(year: number): number {
    // Solo cálculos
  }

  // Otras funciones dispersas...
}
```

#### ✅ Ahora (EmployeeModule)
```typescript
// Lógica de negocio completa y organizada
export class EmployeeDomain {
  // Validaciones
  static validate(data: Partial<CreateEmployeeRequest>): string[] { }
  static isValidEmail(email: string): boolean { }
  static isValidPhone(phone: string): boolean { }

  // Cálculos
  static calculateAge(dateOfBirth: string): number { }
  static calculateYearsOfService(hireDate: string, terminationDate?: string): number { }

  // Reglas de negocio
  static isActive(status: EmployeeStatus): boolean { }
  static canDelete(employee: EmployeeEntity): { canDelete: boolean; reason?: string } { }

  // Formateo y presentación
  static getStatusColor(status: EmployeeStatus): string { }
  static getPositionLabel(position: EmployeePosition): string { }
  static getDisplayName(employee: EmployeeEntity): string { }

  // Comparación
  static hasChanges(original: EmployeeEntity, updated: Partial<EmployeeEntity>): boolean { }

  // Certificaciones
  static isCertificationExpired(certification: EmployeeCertificationEntity): boolean { }
  static isCertificationExpiringSoon(certification: EmployeeCertificationEntity, days?: number): boolean { }
}
```

**Beneficios**:
- ✅ Toda la lógica de negocio en un lugar
- ✅ Fácil de testear
- ✅ Fácil de encontrar
- ✅ Reutilizable

### 4. Dependency Injection Container (Nuevo)

#### ❌ Antes (TransportModule)
```typescript
// Sin container, instanciación manual
export class TransportModuleContainer {
  // Simplemente agrupa módulos, no maneja DI
  private vehicleContainer = Vehicle
  private driverContainer = Driver
}
```

#### ✅ Ahora (EmployeeModule)
```typescript
// Container con Inversión de Control
export class EmployeeModuleContainer {
  private static instance: EmployeeModuleContainer
  private _repository: EmployeeRepositoryImpl
  private _applicationService: EmployeeApplicationService
  private _notificationService?: INotificationService

  private constructor() {
    // Crear dependencias
    this._repository = new EmployeeRepositoryImpl()
    this._applicationService = new EmployeeApplicationService(
      this._repository,
      this._notificationService
    )
  }

  // Singleton pattern
  static getInstance(): EmployeeModuleContainer {
    if (!EmployeeModuleContainer.instance)
      EmployeeModuleContainer.instance = new EmployeeModuleContainer()
    return EmployeeModuleContainer.instance
  }

  // Inyección de dependencias externas
  setNotificationService(service: INotificationService): void {
    this._notificationService = service
    // Recrear service con nueva dependencia
    this._applicationService = new EmployeeApplicationService(
      this._repository,
      this._notificationService
    )
  }

  // Getters para acceso controlado
  get applicationService(): EmployeeApplicationService {
    return this._applicationService
  }
}
```

**Beneficios**:
- ✅ Control centralizado de dependencias
- ✅ Singleton para instancias únicas
- ✅ Fácil de mockear en tests
- ✅ Permite inyectar dependencias externas

### 5. Separación Estricta de Capas (Mejorado)

#### ❌ Antes (TransportModule)
```typescript
// Store accede directamente al API Service
export const useVehicleStore = defineStore('vehicle', () => {
  const apiService = new VehicleApiService()  // ← Dependencia directa de infraestructura

  const fetchList = async () => {
    const response = await apiService.getList(filters.value)  // ← Sin capa de aplicación
    items.value = response.data
  }
})
```

#### ✅ Ahora (EmployeeModule)
```typescript
// Store usa Application Service (respeta las capas)
export const useEmployeeStore = defineStore('employee', () => {
  const repository = new EmployeeRepositoryImpl()
  const applicationService = new EmployeeApplicationService(repository)  // ← Capa de aplicación

  const fetchList = async () => {
    const response = await applicationService.getEmployees(filters.value)  // ← A través de application
    items.value = response.data
  }
})
```

**Flujo correcto**:
```
Presentation (Store)
    ↓
Application (Service)
    ↓
Domain (Repository Interface)
    ↑
Infrastructure (Repository Implementation)
```

**Beneficios**:
- ✅ Lógica de negocio centralizada
- ✅ Fácil de testear cada capa
- ✅ Cambiar infraestructura sin afectar presentación

### 6. Error Handling Centralizado (Mejorado)

#### ❌ Antes (TransportModule)
```typescript
// Error handling duplicado en cada método
try {
  const response = await this.vehicleRepository.findById(id)
  return VehicleMapper.mapApiResponse(response.data)
}
catch (error) {
  this.handleError('Error al obtener el vehículo', error)
  throw error
}
```

#### ✅ Ahora (EmployeeModule)
```typescript
// Error handling centralizado y estructurado
export class EmployeeApplicationService {
  private handleError(title: string, error: any): void {
    console.error(title, error)

    let message = 'Ha ocurrido un error inesperado'

    if (error?.response?.data?.message)
      message = error.response.data.message
    else if (error?.message)
      message = error.message

    this.notificationService?.error(title, message)
  }

  // Métodos privados para tipos de notificación
  private showSuccess(message: string): void {
    this.notificationService?.success('Éxito', message)
  }

  private showInfo(message: string): void {
    this.notificationService?.info('Información', message)
  }
}
```

**Beneficios**:
- ✅ Manejo consistente de errores
- ✅ Fácil de modificar en un solo lugar
- ✅ Separación de responsabilidades

## 📐 Principios de Diseño Aplicados

### 1. Dependency Inversion Principle (DIP)

```
❌ MAL: Depender de implementaciones
┌─────────────────────┐
│ Application Service │
└──────────┬──────────┘
           │ depende de
           ↓
┌─────────────────────┐
│ API Service (impl)  │
└─────────────────────┘

✅ BIEN: Depender de abstracciones
┌─────────────────────┐
│ Application Service │
└──────────┬──────────┘
           │ depende de
           ↓
┌─────────────────────┐
│ Repository (interface) │ ← Domain
└──────────▲──────────┘
           │ implementa
           │
┌─────────────────────┐
│ Repository Impl     │ ← Infrastructure
└─────────────────────┘
```

### 2. Single Responsibility Principle (SRP)

Cada clase tiene una única responsabilidad:

- **EmployeeEntity**: Define la estructura del empleado
- **EmployeeDomain**: Contiene lógica de negocio
- **EmployeeRepository**: Define operaciones de datos (interface)
- **EmployeeRepositoryImpl**: Implementa acceso a datos
- **EmployeeApplicationService**: Orquesta casos de uso
- **EmployeeApiService**: Maneja comunicación HTTP
- **EmployeeMapper**: Transforma datos entre capas
- **useEmployeeStore**: Maneja estado de UI

### 3. Open/Closed Principle (OCP)

El módulo está abierto para extensión, cerrado para modificación:

```typescript
// Agregar nueva funcionalidad sin modificar código existente
export interface IEmailService {
  sendWelcomeEmail(employee: EmployeeEntity): Promise<void>
}

// Inyectar en el Application Service
export class EmployeeApplicationService {
  constructor(
    private employeeRepository: EmployeeRepository,
    private notificationService?: INotificationService,
    private emailService?: IEmailService  // ← Nueva dependencia
  ) {}

  async createEmployee(data: CreateEmployeeRequest): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.create(data)

    // Nueva funcionalidad sin modificar lógica existente
    await this.emailService?.sendWelcomeEmail(employee)

    return employee
  }
}
```

## 🎨 Patrones de Diseño Adicionales

### 1. Builder Pattern (para Value Objects)

```typescript
// Construcción fluida y segura
const employee = EmployeeBuilder.create()
  .withEmployeeCode('EMP001')
  .withName('John', 'Doe')
  .withEmail('john@example.com')
  .withPhone('6621234567')
  .withPosition('operator')
  .build()
```

### 2. Strategy Pattern (para validación)

```typescript
export interface ValidationStrategy {
  validate(data: any): string[]
}

export class CreateEmployeeValidation implements ValidationStrategy {
  validate(data: CreateEmployeeRequest): string[] {
    // Validación específica para crear
  }
}

export class UpdateEmployeeValidation implements ValidationStrategy {
  validate(data: UpdateEmployeeRequest): string[] {
    // Validación específica para actualizar
  }
}
```

### 3. Observer Pattern (Domain Events - Future)

```typescript
// Publicar eventos de dominio
export class EmployeeCreatedEvent {
  constructor(public readonly employee: EmployeeEntity) {}
}

// En Application Service
await this.domainEvents.publish(new EmployeeCreatedEvent(employee))

// Otros módulos escuchan
domainEvents.subscribe(EmployeeCreatedEvent, async (event) => {
  await sendWelcomeEmail(event.employee)
  await createUserAccount(event.employee)
})
```

## 🧪 Testabilidad Mejorada

### Unit Tests de Dominio

```typescript
describe('EmployeeDomain', () => {
  describe('validate', () => {
    it('should validate required fields', () => {
      const errors = EmployeeDomain.validate({})
      expect(errors).toContain('El código de empleado es requerido')
    })

    it('should validate email format', () => {
      const errors = EmployeeDomain.validate({
        employee_code: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid'
      })
      expect(errors).toContain('El email no es válido')
    })
  })

  describe('canDelete', () => {
    it('should not allow deleting active employees', () => {
      const employee = { status: 'active' } as EmployeeEntity
      const result = EmployeeDomain.canDelete(employee)

      expect(result.canDelete).toBe(false)
      expect(result.reason).toBe('No se puede eliminar un empleado activo')
    })
  })
})
```

### Integration Tests con Mocks

```typescript
describe('EmployeeApplicationService', () => {
  let service: EmployeeApplicationService
  let mockRepository: jest.Mocked<EmployeeRepository>
  let mockNotification: jest.Mocked<INotificationService>

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      isEmployeeCodeAvailable: jest.fn(),
    } as any

    mockNotification = {
      success: jest.fn(),
      error: jest.fn(),
    } as any

    service = new EmployeeApplicationService(mockRepository, mockNotification)
  })

  it('should create employee with validation', async () => {
    const data = createValidEmployee()
    mockRepository.isEmployeeCodeAvailable.mockResolvedValue(true)
    mockRepository.create.mockResolvedValue({ data: mockEmployee })

    await service.createEmployee(data)

    expect(mockRepository.create).toHaveBeenCalledWith(data)
    expect(mockNotification.success).toHaveBeenCalled()
  })

  it('should throw error if employee code is taken', async () => {
    const data = createValidEmployee()
    mockRepository.isEmployeeCodeAvailable.mockResolvedValue(false)

    await expect(service.createEmployee(data))
      .rejects.toThrow('El código de empleado ya está en uso')
  })
})
```

## 📋 Checklist para Nuevos Módulos

Al crear un nuevo módulo siguiendo este estándar:

### Domain Layer
- [ ] Entidades con lógica de negocio
- [ ] Value Objects para conceptos de dominio
- [ ] Interfaces de repositorios
- [ ] Domain logic class (XxxDomain)
- [ ] Eventos de dominio (si aplica)

### Application Layer
- [ ] DTOs para comunicación externa
- [ ] Mappers entre DTOs y Entities
- [ ] Application Service con orquestación
- [ ] Use Cases específicos (si son complejos)

### Infrastructure Layer
- [ ] API Service para HTTP
- [ ] Repository Implementation
- [ ] Transformers (si aplica)

### Presentation Layer
- [ ] Pinia Store
- [ ] Components siguiendo Atomic Design
- [ ] Views
- [ ] Composables reutilizables

### Shared
- [ ] Types y Enums
- [ ] Contracts/Interfaces
- [ ] Utils del módulo

### Configuration
- [ ] Routes
- [ ] Menu
- [ ] Container con DI
- [ ] Config general

### Documentation
- [ ] README.md completo
- [ ] ARCHITECTURE.md (si hay decisiones especiales)
- [ ] JSDoc en interfaces públicas
- [ ] Tests

## 🎓 Conclusión

El módulo Employee representa el **nuevo estándar** para desarrollo de módulos en el proyecto. Las mejoras clave son:

1. ✅ **Value Objects** para encapsulación
2. ✅ **Contratos explícitos** para desacoplamiento
3. ✅ **Domain logic centralizada** para mantenibilidad
4. ✅ **Dependency Injection** para testabilidad
5. ✅ **Separación estricta de capas** para Clean Architecture
6. ✅ **Sin dependencias entre módulos** para escalabilidad

**Migración**: Los módulos existentes deben migrar gradualmente a este estándar, priorizando:
1. Primero: Extraer lógica de negocio al dominio
2. Segundo: Crear contratos explícitos
3. Tercero: Implementar DI Container
4. Cuarto: Añadir Value Objects donde aplique

Este estándar asegura que el código sea:
- 🧪 **Testeable**: Cada capa se puede testear independientemente
- 🔄 **Mantenible**: Cambios localizados y predecibles
- 📈 **Escalable**: Fácil añadir nuevas funcionalidades
- 🔌 **Desacoplado**: Sin dependencias entre módulos
- 📚 **Documentado**: Código autodocumentado con tipos fuertes
