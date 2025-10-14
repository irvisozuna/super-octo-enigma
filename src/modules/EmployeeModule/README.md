# Employee Module

Módulo de gestión de empleados siguiendo Domain-Driven Design (DDD) y Clean Architecture.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Capas de la Aplicación](#capas-de-la-aplicación)
- [Principios y Patrones](#principios-y-patrones)
- [Uso del Módulo](#uso-del-módulo)
- [Testing](#testing)

## 🏗️ Arquitectura

Este módulo sigue los principios de **Clean Architecture** y **Domain-Driven Design**, organizando el código en capas claramente definidas con dependencias unidireccionales desde las capas externas hacia el dominio.

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│   (Stores, Components, Views)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Application Layer                 │
│  (Use Cases, DTOs, Mappers, Services)   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Domain Layer                   │
│  (Entities, Value Objects, Contracts)   │
└─────────────────▲───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│      Infrastructure Layer               │
│  (API Services, Repository Impl)        │
└─────────────────────────────────────────┘
```

### Flujo de Dependencias

```
Presentation → Application → Domain ← Infrastructure
```

**Regla de oro**: Las dependencias siempre apuntan hacia adentro. El dominio no conoce ninguna capa externa.

## 📁 Estructura del Proyecto

```
src/modules/EmployeeModule/
├── domain/                      # Capa de Dominio (Core Business Logic)
│   ├── entities/               # Entidades de dominio
│   │   └── EmployeeEntity.ts   # Entidad Employee con lógica de negocio
│   ├── repositories/           # Contratos de repositorios
│   │   └── EmployeeRepository.ts  # Interface del repositorio
│   ├── value-objects/          # Objetos de valor
│   │   ├── Email.ts           # Value Object para Email
│   │   ├── PhoneNumber.ts     # Value Object para Teléfono
│   │   └── FullName.ts        # Value Object para Nombre Completo
│   └── events/                # Domain Events (future)
│
├── application/               # Capa de Aplicación (Use Cases)
│   ├── dtos/                 # Data Transfer Objects
│   │   └── EmployeeDtos.ts   # DTOs para comunicación con API
│   ├── mappers/              # Mappers entre DTOs y Entidades
│   │   └── EmployeeMapper.ts # Mapper Employee
│   ├── services/             # Application Services
│   │   └── EmployeeApplicationService.ts  # Orquestación de casos de uso
│   └── use-cases/            # Casos de uso específicos (future)
│
├── infrastructure/           # Capa de Infraestructura (External)
│   ├── api/
│   │   ├── services/        # Servicios de API
│   │   │   └── EmployeeApiService.ts  # Cliente HTTP para Employee API
│   │   └── transformers/    # Transformadores de respuesta (future)
│   └── persistence/
│       └── repositories/
│           └── EmployeeRepositoryImpl.ts  # Implementación del repositorio
│
├── presentation/            # Capa de Presentación (UI)
│   ├── stores/             # Pinia Stores
│   │   └── employeeStore.ts  # Estado global de empleados
│   ├── components/         # Componentes Vue (Atomic Design)
│   │   ├── atoms/         # Componentes básicos
│   │   ├── molecules/     # Combinaciones simples
│   │   └── organisms/     # Componentes complejos
│   ├── views/             # Vistas de página
│   │   ├── EmployeeList.vue
│   │   ├── EmployeeDetail.vue
│   │   ├── EmployeeCreate.vue
│   │   └── EmployeeEdit.vue
│   └── composables/       # Composables reutilizables
│
├── shared/                # Código compartido del módulo
│   ├── types/            # Tipos TypeScript compartidos
│   │   └── index.ts      # Enums, interfaces, tipos
│   ├── contracts/        # Contratos/Interfaces
│   │   └── INotificationService.ts  # Interface para notificaciones
│   └── utils/           # Utilidades del módulo
│
├── config/              # Configuración del módulo
│   ├── routes.ts       # Definición de rutas
│   ├── menu.ts         # Configuración de menú
│   ├── container.ts    # Dependency Injection Container
│   └── config.ts       # Configuración general
│
├── locales/            # Traducciones i18n
│   ├── es.json
│   └── en.json
│
├── tests/              # Tests del módulo
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── index.ts            # Punto de entrada del módulo
└── README.md           # Este archivo
```

## 🎯 Capas de la Aplicación

### 1. Domain Layer (Dominio)

**Propósito**: Contiene la lógica de negocio central y las reglas de dominio.

**Componentes**:
- **Entities**: Objetos con identidad y ciclo de vida (Employee, Skill, Certification)
- **Value Objects**: Objetos inmutables sin identidad (Email, PhoneNumber, FullName)
- **Repository Interfaces**: Contratos para acceso a datos
- **Domain Events**: Eventos de negocio (future)

**Reglas**:
- ❌ NO depende de ninguna capa externa
- ❌ NO conoce frameworks, librerías, o APIs
- ✅ Contiene toda la lógica de negocio
- ✅ Define contratos (interfaces) que otras capas implementan

**Ejemplo**:
```typescript
// domain/entities/EmployeeEntity.ts
export class EmployeeDomain {
  static validate(data: Partial<CreateEmployeeRequest>): string[] {
    // Lógica de validación de negocio
  }

  static canDelete(employee: EmployeeEntity): { canDelete: boolean; reason?: string } {
    // Reglas de negocio para eliminación
  }
}
```

### 2. Application Layer (Aplicación)

**Propósito**: Orquesta los casos de uso y coordina entre las capas.

**Componentes**:
- **DTOs**: Estructuras de datos para transferencia
- **Mappers**: Transforman entre DTOs y Entidades
- **Application Services**: Coordinan casos de uso complejos
- **Use Cases**: Casos de uso específicos del negocio

**Reglas**:
- ✅ Depende SOLO del Domain Layer
- ✅ Orquesta operaciones de dominio
- ✅ Maneja transacciones y coordinación
- ❌ NO contiene lógica de negocio (esa va en Domain)

**Ejemplo**:
```typescript
// application/services/EmployeeApplicationService.ts
export class EmployeeApplicationService {
  constructor(
    private employeeRepository: EmployeeRepository,  // ← Interface del dominio
    private notificationService?: INotificationService,  // ← Interface, no implementación
  ) {}

  async createEmployee(data: CreateEmployeeRequest): Promise<EmployeeEntity> {
    // 1. Validar usando lógica de dominio
    const errors = EmployeeDomain.validate(data)
    if (errors.length > 0) throw new Error(errors.join(', '))

    // 2. Verificar reglas de negocio
    const isCodeAvailable = await this.employeeRepository.isEmployeeCodeAvailable(data.employee_code)
    if (!isCodeAvailable) throw new Error('El código ya está en uso')

    // 3. Crear empleado
    const response = await this.employeeRepository.create(data)

    // 4. Notificar éxito
    this.notificationService?.success('Éxito', 'Empleado creado correctamente')

    return response.data
  }
}
```

### 3. Infrastructure Layer (Infraestructura)

**Propósito**: Implementa detalles técnicos y se comunica con servicios externos.

**Componentes**:
- **API Services**: Cliente HTTP para comunicación con backend
- **Repository Implementations**: Implementan interfaces del dominio
- **Transformers**: Adaptan datos externos a formato interno

**Reglas**:
- ✅ Implementa interfaces definidas en Domain
- ✅ Maneja detalles técnicos (HTTP, DB, etc.)
- ✅ Se puede reemplazar sin afectar el dominio
- ❌ NO contiene lógica de negocio

**Ejemplo**:
```typescript
// infrastructure/persistence/repositories/EmployeeRepositoryImpl.ts
export class EmployeeRepositoryImpl implements EmployeeRepository {  // ← Implementa interface del dominio
  private apiService: EmployeeApiService

  async findById(id: string): Promise<ApiResponse<EmployeeEntity>> {
    const response = await this.apiService.getById(id)  // ← HTTP call
    return {
      data: EmployeeMapper.apiDetailToDomain(response.data)  // ← Transform DTO → Entity
    }
  }
}
```

### 4. Presentation Layer (Presentación)

**Propósito**: Maneja la interfaz de usuario y la interacción con el usuario.

**Componentes**:
- **Stores** (Pinia): Estado global de la UI
- **Components**: Componentes Vue siguiendo Atomic Design
- **Views**: Páginas completas
- **Composables**: Lógica reutilizable de UI

**Reglas**:
- ✅ Usa Application Services para lógica de negocio
- ✅ Maneja estado de UI y presentación
- ✅ Sigue Atomic Design
- ❌ NO contiene lógica de negocio

**Ejemplo**:
```typescript
// presentation/stores/employeeStore.ts
export const useEmployeeStore = defineStore('employee', () => {
  const applicationService = new EmployeeApplicationService(repository)

  const createItem = async (data: CreateEmployeeRequest) => {
    loading.value = true
    try {
      const newItem = await applicationService.createEmployee(data)  // ← Usa Application Service
      items.value.unshift(newItem)
      return newItem
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return { createItem, items, loading, error }
})
```

## 🔧 Principios y Patrones

### Principios SOLID

1. **Single Responsibility**: Cada clase tiene una única responsabilidad
2. **Open/Closed**: Abierto para extensión, cerrado para modificación
3. **Liskov Substitution**: Las implementaciones pueden reemplazarse por sus interfaces
4. **Interface Segregation**: Interfaces específicas en lugar de interfaces generales
5. **Dependency Inversion**: Depender de abstracciones, no de implementaciones concretas

### Patrones Implementados

#### 1. Repository Pattern
```typescript
// Domain define el contrato
export interface EmployeeRepository {
  findById(id: string): Promise<ApiResponse<EmployeeEntity>>
  create(data: CreateEmployeeRequest): Promise<ApiResponse<EmployeeEntity>>
}

// Infrastructure lo implementa
export class EmployeeRepositoryImpl implements EmployeeRepository {
  // Implementación específica con API HTTP
}
```

#### 2. Dependency Injection
```typescript
// Application Service recibe dependencias, no las crea
export class EmployeeApplicationService {
  constructor(
    private employeeRepository: EmployeeRepository,  // ← Inyectado
    private notificationService?: INotificationService  // ← Inyectado
  ) {}
}

// Container maneja la creación
export class EmployeeModuleContainer {
  private _repository: EmployeeRepositoryImpl
  private _applicationService: EmployeeApplicationService

  constructor() {
    this._repository = new EmployeeRepositoryImpl()
    this._applicationService = new EmployeeApplicationService(
      this._repository,
      this._notificationService
    )
  }
}
```

#### 3. Value Objects
```typescript
// Encapsulan lógica de validación y comportamiento
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
}

// Uso
const email = Email.create('user@example.com')  // ← Siempre válido
```

#### 4. Mapper Pattern
```typescript
// Transforma entre DTOs (API) y Entities (Domain)
export class EmployeeMapper {
  static apiDetailToDomain(dto: EmployeeDetailDto): EmployeeEntity {
    return {
      id: dto.id,
      first_name: dto.first_name,
      // ... más campos
    }
  }

  static createRequestToDto(request: CreateEmployeeRequest): EmployeeCreateDto {
    return {
      employee_code: request.employee_code,
      // ... más campos
    }
  }
}
```

### Sin Dependencias Entre Módulos

El módulo **NO** depende de otros módulos de la aplicación. Toda comunicación se hace a través de:

1. **Contracts/Interfaces**: Define `INotificationService`, no usa implementación específica
2. **Domain Events**: (Future) Publicar eventos que otros módulos pueden escuchar
3. **Shared Services**: Usa servicios globales inyectados, no importados directamente

**❌ Mal (Acoplamiento)**:
```typescript
import { useTransportStore } from '@/modules/TransportModule'  // ← Dependencia directa

// Usar el store directamente
const transportStore = useTransportStore()
```

**✅ Bien (Desacoplado)**:
```typescript
// Define interface en tu módulo
export interface IVehicleService {
  getVehiclesByEmployee(employeeId: string): Promise<Vehicle[]>
}

// Inyecta la implementación
constructor(private vehicleService?: IVehicleService) {}

// O usa Domain Events
domainEvents.publish('EmployeeModule.employee.created', { employeeId })
```

## 🚀 Uso del Módulo

### Instalación

```typescript
// main.ts o módulo principal
import { employeeContainer } from '@/modules/EmployeeModule'

// Instalar el módulo
employeeContainer.install(app)

// Configurar servicios externos (opcional)
employeeContainer.setNotificationService(notificationService)
```

### Uso en Componentes

```vue
<script setup lang="ts">
import { useEmployeeStore } from '@/modules/EmployeeModule'

const employeeStore = useEmployeeStore()

onMounted(async () => {
  await employeeStore.fetchList()
})

const createEmployee = async (data) => {
  await employeeStore.createItem(data)
  router.push('/employees')
}
</script>
```

### Uso Directo de Application Service

```typescript
import { employeeContainer } from '@/modules/EmployeeModule'

// Obtener el application service
const employeeService = employeeContainer.applicationService

// Usar directamente
const employees = await employeeService.getEmployees({ status: 'active' })
```

## 🧪 Testing

### Unit Tests (Domain)

```typescript
// tests/unit/domain/EmployeeDomain.spec.ts
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
        email: 'invalid-email'
      })
      expect(errors).toContain('El email no es válido')
    })
  })
})
```

### Integration Tests (Application)

```typescript
// tests/integration/EmployeeApplicationService.spec.ts
describe('EmployeeApplicationService', () => {
  let service: EmployeeApplicationService
  let mockRepository: jest.Mocked<EmployeeRepository>

  beforeEach(() => {
    mockRepository = createMockRepository()
    service = new EmployeeApplicationService(mockRepository)
  })

  it('should create employee with validation', async () => {
    mockRepository.isEmployeeCodeAvailable.mockResolvedValue(true)
    mockRepository.create.mockResolvedValue({ data: mockEmployee })

    const result = await service.createEmployee(validData)

    expect(result).toEqual(mockEmployee)
    expect(mockRepository.create).toHaveBeenCalled()
  })
})
```

## 📚 Recursos Adicionales

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Value Objects](https://martinfowler.com/bliki/ValueObject.html)

## 📝 Notas Importantes

1. **Nunca importar de capas externas al dominio**: El dominio debe ser puro y sin dependencias externas
2. **Usar interfaces para dependencias**: Siempre inyectar interfaces, no implementaciones concretas
3. **Mantener el dominio rico**: La lógica de negocio va en el dominio, no en los servicios
4. **Value Objects para validación**: Encapsular validación y comportamiento en Value Objects
5. **Sin dependencias entre módulos**: Usar contratos y eventos para comunicación entre módulos

## 🤝 Contribución

Al añadir nuevas funcionalidades, asegúrate de:

1. Seguir la estructura de capas existente
2. Añadir lógica de negocio en el dominio
3. Crear tests unitarios para el dominio
4. Documentar interfaces públicas
5. Mantener el acoplamiento bajo
