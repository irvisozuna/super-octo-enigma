#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const MODULES_PATH = 'src/modules'

// ===========================================
// TEMPLATES DE CONTRATOS DDD
// ===========================================

// 1. Domain Repository Contract
const createDomainRepositoryContract = (entityName) => {
  return `import type { ${entityName} } from '../../entities/${entityName}'

/**
 * ${entityName} Domain Repository Contract
 * Defines the contract for ${entityName} data access from domain perspective
 */
export interface I${entityName}DomainRepository {
  /**
   * Find ${entityName} by ID
   */
  findById(id: string): Promise<${entityName} | null>
  
  /**
   * Find all ${entityName}s
   */
  findAll(): Promise<${entityName}[]>
  
  /**
   * Save ${entityName}
   */
  save(${entityName.toLowerCase()}: ${entityName}): Promise<${entityName}>
  
  /**
   * Delete ${entityName}
   */
  delete(id: string): Promise<void>
  
  /**
   * Check if ${entityName} exists
   */
  exists(id: string): Promise<boolean>
  
  /**
   * Find by specific criteria
   */
  findByCriteria(criteria: Partial<${entityName}>): Promise<${entityName}[]>
  
  /**
   * Count total ${entityName}s
   */
  count(): Promise<number>
}`
}

// 2. Domain Service Contract
const createDomainServiceContract = (entityName) => {
  return `import type { ${entityName} } from '../../entities/${entityName}'

/**
 * ${entityName} Domain Service Contract
 * Defines business logic operations that don't belong to entities
 */
export interface I${entityName}DomainService {
  /**
   * Validate ${entityName} business rules
   */
  validateBusinessRules(${entityName.toLowerCase()}: ${entityName}): Promise<boolean>
  
  /**
   * Check if ${entityName} can be deleted
   */
  canBeDeleted(id: string): Promise<boolean>
  
  /**
   * Calculate derived properties
   */
  calculateDerivedProperties(${entityName.toLowerCase()}: ${entityName}): ${entityName}
  
  /**
   * Validate ${entityName} uniqueness
   */
  validateUniqueness(${entityName.toLowerCase()}: Partial<${entityName}>): Promise<boolean>
}`
}

// 3. Use Case Contract
const createUseCaseContract = (entityName, action) => {
  const useCaseName = `${action}${entityName}UseCase`
  let inputType = 'any'
  let outputType = entityName
  
  switch (action) {
    case 'Create':
      inputType = `Create${entityName}Input`
      break
    case 'Update':
      inputType = `Update${entityName}Input`
      break
    case 'Delete':
      inputType = 'string'
      outputType = 'void'
      break
    case 'GetById':
      inputType = 'string'
      break
    case 'GetList':
      inputType = 'GetListInput'
      outputType = `${entityName}[]`
      break
  }

  return `/**
 * ${useCaseName} Contract
 * Defines the interface for ${action.toLowerCase()} ${entityName} use case
 */
export interface I${useCaseName} {
  /**
   * Execute the ${action.toLowerCase()} ${entityName} operation
   */
  execute(input: ${inputType}): Promise<${outputType}>
}

// Input/Output Types
${action === 'Create' ? `export interface Create${entityName}Input {
  // Define create input properties
  [key: string]: any
}` : ''}

${action === 'Update' ? `export interface Update${entityName}Input {
  id: string
  // Define update input properties
  [key: string]: any
}` : ''}

${action === 'GetList' ? `export interface GetListInput {
  page?: number
  limit?: number
  filters?: Record<string, any>
  sort?: string
}` : ''}`
}

// 4. Event Handler Contract
const createEventHandlerContract = (entityName, eventType) => {
  return `import type { ${entityName}${eventType} } from '../../events/${entityName}${eventType}'

/**
 * ${entityName}${eventType} Handler Contract
 * Defines the interface for handling ${entityName} ${eventType.toLowerCase()} events
 */
export interface I${entityName}${eventType}Handler {
  /**
   * Handle ${entityName} ${eventType.toLowerCase()} event
   */
  handle(event: ${entityName}${eventType}): Promise<void>
  
  /**
   * Check if handler can process this event
   */
  canHandle(event: ${entityName}${eventType}): boolean
}`
}

// 5. Application Service Contract
const createApplicationServiceContract = (entityName) => {
  return `import type { ${entityName} } from '../../domain/entities/${entityName}'

/**
 * ${entityName} Application Service Contract
 * Orchestrates use cases and coordinates application flow
 */
export interface I${entityName}ApplicationService {
  /**
   * Create new ${entityName}
   */
  create(data: any): Promise<${entityName}>
  
  /**
   * Update existing ${entityName}
   */
  update(id: string, data: any): Promise<${entityName}>
  
  /**
   * Delete ${entityName}
   */
  delete(id: string): Promise<void>
  
  /**
   * Get ${entityName} by ID
   */
  getById(id: string): Promise<${entityName}>
  
  /**
   * Get all ${entityName}s
   */
  getAll(): Promise<${entityName}[]>
  
  /**
   * Search ${entityName}s
   */
  search(criteria: any): Promise<${entityName}[]>
}`
}

// 6. Aggregate Root Contract
const createAggregateRootContract = () => {
  return `/**
 * Aggregate Root Contract
 * Base interface for all aggregate roots in the domain
 */
export interface IAggregateRoot {
  /**
   * Unique identifier
   */
  readonly id: string
  
  /**
   * Creation timestamp
   */
  readonly createdAt: Date
  
  /**
   * Last update timestamp
   */
  readonly updatedAt: Date
  
  /**
   * Get domain events
   */
  getDomainEvents(): IDomainEvent[]
  
  /**
   * Clear domain events
   */
  clearDomainEvents(): void
  
  /**
   * Add domain event
   */
  addDomainEvent(event: IDomainEvent): void
}

/**
 * Domain Event Contract
 */
export interface IDomainEvent {
  /**
   * Event ID
   */
  readonly id: string
  
  /**
   * Aggregate ID that generated the event
   */
  readonly aggregateId: string
  
  /**
   * When the event occurred
   */
  readonly occurredOn: Date
  
  /**
   * Event name
   */
  eventName(): string
}`
}

// 7. Mapper Contract
const createMapperContract = (entityName) => {
  return `import type { ${entityName} } from '../../domain/entities/${entityName}'

/**
 * ${entityName} Mapper Contract
 * Defines the interface for mapping between different representations
 */
export interface I${entityName}Mapper {
  /**
   * Map from API response to domain entity
   */
  fromApiResponse(apiData: any): ${entityName}
  
  /**
   * Map from domain entity to API request
   */
  toApiRequest(entity: ${entityName}): any
  
  /**
   * Map from database record to domain entity
   */
  fromDatabase(dbRecord: any): ${entityName}
  
  /**
   * Map from domain entity to database record
   */
  toDatabase(entity: ${entityName}): any
  
  /**
   * Map array from API
   */
  fromApiResponseList(apiDataList: any[]): ${entityName}[]
  
  /**
   * Map array to API
   */
  toApiRequestList(entities: ${entityName}[]): any[]
}`
}

// 8. Infrastructure Service Contract
const createInfrastructureServiceContract = (serviceName) => {
  return `/**
 * ${serviceName} Infrastructure Service Contract
 * Defines external service communication interface
 */
export interface I${serviceName}Service {
  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>
  
  /**
   * Get service health status
   */
  getHealthStatus(): Promise<ServiceHealthStatus>
  
  /**
   * Handle service errors
   */
  handleError(error: Error): void
}

export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  timestamp: Date
}`
}

// ===========================================
// GENERADOR PRINCIPAL
// ===========================================

async function createFile(filePath, content) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, content, 'utf8')
}

async function generateContracts(moduleName, entities) {
  const modulePath = path.join(MODULES_PATH, moduleName.toLowerCase())
  
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Module ${moduleName} not found at ${modulePath}`)
  }
  
  console.log(chalk.blue(`🔗 Generating DDD Contracts for module: ${moduleName}`))
  console.log(chalk.gray(`📁 Path: ${modulePath}\n`))
  
  let contractsCreated = 0
  
  // 1. Domain Repository Contracts
  console.log(chalk.yellow('📝 Generating Domain Repository Contracts...'))
  for (const entityName of entities) {
    const content = createDomainRepositoryContract(entityName)
    await createFile(
      path.join(modulePath, 'domain', 'contracts', 'repositories', `I${entityName}DomainRepository.ts`),
      content
    )
    contractsCreated++
    console.log(chalk.green(`   ✓ I${entityName}DomainRepository.ts`))
  }
  
  // 2. Domain Service Contracts
  console.log(chalk.yellow('📝 Generating Domain Service Contracts...'))
  for (const entityName of entities) {
    const content = createDomainServiceContract(entityName)
    await createFile(
      path.join(modulePath, 'domain', 'contracts', 'services', `I${entityName}DomainService.ts`),
      content
    )
    contractsCreated++
    console.log(chalk.green(`   ✓ I${entityName}DomainService.ts`))
  }
  
  // 3. Use Case Contracts
  console.log(chalk.yellow('📝 Generating Use Case Contracts...'))
  const useCaseActions = ['Create', 'Update', 'Delete', 'GetById', 'GetList']
  for (const entityName of entities) {
    for (const action of useCaseActions) {
      const content = createUseCaseContract(entityName, action)
      await createFile(
        path.join(modulePath, 'application', 'contracts', `I${action}${entityName}UseCase.ts`),
        content
      )
      contractsCreated++
      console.log(chalk.green(`   ✓ I${action}${entityName}UseCase.ts`))
    }
  }
  
  // 4. Event Handler Contracts
  console.log(chalk.yellow('📝 Generating Event Handler Contracts...'))
  const eventTypes = ['Created', 'Updated', 'Deleted']
  for (const entityName of entities) {
    for (const eventType of eventTypes) {
      const content = createEventHandlerContract(entityName, eventType)
      await createFile(
        path.join(modulePath, 'domain', 'contracts', 'events', `I${entityName}${eventType}Handler.ts`),
        content
      )
      contractsCreated++
      console.log(chalk.green(`   ✓ I${entityName}${eventType}Handler.ts`))
    }
  }
  
  // 5. Application Service Contracts
  console.log(chalk.yellow('📝 Generating Application Service Contracts...'))
  for (const entityName of entities) {
    const content = createApplicationServiceContract(entityName)
    await createFile(
      path.join(modulePath, 'application', 'contracts', `I${entityName}ApplicationService.ts`),
      content
    )
    contractsCreated++
    console.log(chalk.green(`   ✓ I${entityName}ApplicationService.ts`))
  }
  
  // 6. Mapper Contracts
  console.log(chalk.yellow('📝 Generating Mapper Contracts...'))
  for (const entityName of entities) {
    const content = createMapperContract(entityName)
    await createFile(
      path.join(modulePath, 'application', 'contracts', `I${entityName}Mapper.ts`),
      content
    )
    contractsCreated++
    console.log(chalk.green(`   ✓ I${entityName}Mapper.ts`))
  }
  
  // 7. Base Aggregate Root Contract
  console.log(chalk.yellow('📝 Generating Base Contracts...'))
  const aggregateContent = createAggregateRootContract()
  await createFile(
    path.join(modulePath, 'domain', 'contracts', 'IAggregateRoot.ts'),
    aggregateContent
  )
  contractsCreated++
  console.log(chalk.green(`   ✓ IAggregateRoot.ts`))
  
  // 8. Infrastructure Service Contracts
  console.log(chalk.yellow('📝 Generating Infrastructure Service Contracts...'))
  const infraServices = ['EmailService', 'NotificationService', 'FileStorageService']
  for (const serviceName of infraServices) {
    const content = createInfrastructureServiceContract(serviceName)
    await createFile(
      path.join(modulePath, 'infrastructure', 'contracts', `I${serviceName}.ts`),
      content
    )
    contractsCreated++
    console.log(chalk.green(`   ✓ I${serviceName}.ts`))
  }
  
  // 9. Create index files for better organization
  console.log(chalk.yellow('📝 Generating Contract Index Files...'))
  
  // Domain contracts index
  const domainContractsIndex = `// Domain Repository Contracts
${entities.map(e => `export * from './repositories/I${e}DomainRepository'`).join('\n')}

// Domain Service Contracts  
${entities.map(e => `export * from './services/I${e}DomainService'`).join('\n')}

// Event Handler Contracts
${entities.flatMap(e => eventTypes.map(t => `export * from './events/I${e}${t}Handler'`)).join('\n')}

// Base Contracts
export * from './IAggregateRoot'
`
  
  await createFile(
    path.join(modulePath, 'domain', 'contracts', 'index.ts'),
    domainContractsIndex
  )
  
  // Application contracts index
  const applicationContractsIndex = `// Use Case Contracts
${entities.flatMap(e => useCaseActions.map(a => `export * from './I${a}${e}UseCase'`)).join('\n')}

// Application Service Contracts
${entities.map(e => `export * from './I${e}ApplicationService'`).join('\n')}

// Mapper Contracts
${entities.map(e => `export * from './I${e}Mapper'`).join('\n')}
`
  
  await createFile(
    path.join(modulePath, 'application', 'contracts', 'index.ts'),
    applicationContractsIndex
  )
  
  // Infrastructure contracts index
  const infraContractsIndex = `// Infrastructure Service Contracts
${infraServices.map(s => `export * from './I${s}'`).join('\n')}
`
  
  await createFile(
    path.join(modulePath, 'infrastructure', 'contracts', 'index.ts'),
    infraContractsIndex
  )
  
  contractsCreated += 3 // index files
  
  console.log(chalk.green.bold(`\n✅ DDD Contracts generation completed!`))
  console.log(chalk.cyan(`🔗 Total contracts created: ${contractsCreated}`))
  console.log(chalk.white(`   • ${entities.length} Domain Repository Contracts`))
  console.log(chalk.white(`   • ${entities.length} Domain Service Contracts`))
  console.log(chalk.white(`   • ${entities.length * useCaseActions.length} Use Case Contracts`))
  console.log(chalk.white(`   • ${entities.length * eventTypes.length} Event Handler Contracts`))
  console.log(chalk.white(`   • ${entities.length} Application Service Contracts`))
  console.log(chalk.white(`   • ${entities.length} Mapper Contracts`))
  console.log(chalk.white(`   • 1 Aggregate Root Contract`))
  console.log(chalk.white(`   • ${infraServices.length} Infrastructure Service Contracts`))
  console.log(chalk.white(`   • 3 Index files for organization`))
  
  return contractsCreated
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const moduleName = process.argv[2] || 'DashboardMonitor'
  const entities = ['Reader', 'Route', 'Reading', 'Meter']
  
  generateContracts(moduleName, entities)
    .then(count => {
      console.log(chalk.green.bold(`\n🎉 Successfully generated ${count} contracts!`))
      process.exit(0)
    })
    .catch(error => {
      console.error(chalk.red(`Fatal error: ${error.message}`))
      process.exit(1)
    })
} 
