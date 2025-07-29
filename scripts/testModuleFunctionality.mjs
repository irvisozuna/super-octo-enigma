#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const MODULES_PATH = 'src/modules'

// Get entities from module config or directory structure
function getModuleEntities(modulePath) {
  try {
    // Try to read from module.config.ts
    const configPath = path.join(modulePath, 'module.config.ts')
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8')
      // Look for entities in config: 'EntityName': { ... }
      const entitiesMatch = configContent.match(/entities:\s*\{([^}]+)\}/s)
      if (entitiesMatch) {
        const entitiesBlock = entitiesMatch[1]
        const entityMatches = entitiesBlock.match(/'([^']+)':\s*\{/g)
        if (entityMatches) {
          const entities = entityMatches.map(match => 
            match.replace(/[':\s{}]/g, '')
          ).filter(name => name.length > 0)
          if (entities.length > 0) {
            console.log(chalk.gray(`Auto-detected entities: ${entities.join(', ')}`))
            return entities
          }
        }
      }
    }
    
    // Fallback: read from domain/entities directory
    const entitiesDir = path.join(modulePath, 'domain', 'entities')
    if (fs.existsSync(entitiesDir)) {
      const files = fs.readdirSync(entitiesDir)
      const entities = files
        .filter(file => file.endsWith('.ts'))
        .map(file => file.replace('.ts', ''))
      if (entities.length > 0) {
        console.log(chalk.gray(`Auto-detected entities from files: ${entities.join(', ')}`))
        return entities
      }
    }
    
    // Ultimate fallback
    console.log(chalk.gray('Using default entities (auto-detection failed)'))
    return ['Reader', 'Route', 'Reading', 'Meter']
  } catch (error) {
    console.log(chalk.gray(`Could not auto-detect entities: ${error.message}`))
    return ['Reader', 'Route', 'Reading', 'Meter']
  }
}

// Test que todas las entidades tienen sus archivos generados
function testEntityFiles(modulePath, entities) {
  console.log(chalk.yellow('🧪 Testing entity files generation...'))
  
  const results = []
  
  for (const entityName of entities) {
    const tests = [
      // Domain layer
      { file: `domain/entities/${entityName}.ts`, layer: 'Domain' },
      { file: `domain/events/${entityName}Created.ts`, layer: 'Domain' },
      { file: `domain/events/${entityName}Updated.ts`, layer: 'Domain' },
      { file: `domain/events/${entityName}Deleted.ts`, layer: 'Domain' },
      { file: `domain/exceptions/${entityName}NotFound.ts`, layer: 'Domain' },
      { file: `domain/exceptions/${entityName}ValidationError.ts`, layer: 'Domain' },
      
      // Application layer
      { file: `application/dtos/Create${entityName}DTO.ts`, layer: 'Application' },
      { file: `application/dtos/Update${entityName}DTO.ts`, layer: 'Application' },
      { file: `application/repositories/${entityName}Repository.ts`, layer: 'Application' },
      { file: `application/useCases/Create${entityName}UseCase.ts`, layer: 'Application' },
      { file: `application/useCases/Update${entityName}UseCase.ts`, layer: 'Application' },
      { file: `application/useCases/Delete${entityName}UseCase.ts`, layer: 'Application' },
      { file: `application/useCases/GetById${entityName}UseCase.ts`, layer: 'Application' },
      { file: `application/useCases/GetList${entityName}UseCase.ts`, layer: 'Application' },
      { file: `application/mappers/${entityName}Mapper.ts`, layer: 'Application' },
      
      // Infrastructure layer
      { file: `infrastructure/api/services/${entityName}ApiService.ts`, layer: 'Infrastructure' },
      { file: `infrastructure/api/services/${entityName}Endpoints.ts`, layer: 'Infrastructure' },
      { file: `infrastructure/persistence/repositories/${entityName}RepositoryImpl.ts`, layer: 'Infrastructure' },
      
      // Presentation layer
      { file: `presentation/views/${entityName}List.vue`, layer: 'Presentation' },
      { file: `presentation/views/${entityName}Form.vue`, layer: 'Presentation' },
      { file: `presentation/views/${entityName}Detail.vue`, layer: 'Presentation' },
      { file: `presentation/views/${entityName}Create.vue`, layer: 'Presentation' },
      { file: `presentation/views/${entityName}Edit.vue`, layer: 'Presentation' },
      { file: `presentation/stores/${entityName.toLowerCase()}Store.ts`, layer: 'Presentation' }
    ]
    
    for (const test of tests) {
      const filePath = path.join(modulePath, test.file)
      const exists = fs.existsSync(filePath)
      
      results.push({
        entity: entityName,
        file: test.file,
        layer: test.layer,
        exists,
        path: filePath
      })
    }
  }
  
  const passed = results.filter(r => r.exists).length
  const total = results.length
  
  console.log(chalk.green(`✓ Entity files test: ${passed}/${total} files exist`))
  
  if (passed < total) {
    console.log(chalk.red('❌ Missing files:'))
    results.filter(r => !r.exists).forEach(r => {
      console.log(chalk.red(`   • ${r.entity}: ${r.file}`))
    })
  }
  
  return passed === total
}

// Test que los archivos TypeScript tienen contenido válido
function testTypeScriptContent(modulePath) {
  console.log(chalk.yellow('🧪 Testing TypeScript content validity...'))
  
  const errors = []
  let filesChecked = 0
  
  function checkTSFiles(dir) {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        checkTSFiles(fullPath)
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        filesChecked++
        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          
          // Check for basic issues
          if (content.trim().length === 0) {
            errors.push(`Empty file: ${fullPath}`)
          }
          
          if (content.includes('{{') && content.includes('}}')) {
            errors.push(`Unreplaced template variables: ${fullPath}`)
          }
          
          // Check for basic TypeScript structure
          if (content.includes('export') || content.includes('import')) {
            // Good, has imports/exports
          } else if (!content.includes('interface') && !content.includes('class') && !content.includes('type') && !content.includes('const') && !content.includes('function')) {
            errors.push(`No TypeScript definitions found: ${fullPath}`)
          }
          
        } catch (error) {
          errors.push(`Cannot read file ${fullPath}: ${error.message}`)
        }
      }
    }
  }
  
  checkTSFiles(modulePath)
  
  if (errors.length === 0) {
    console.log(chalk.green(`✓ TypeScript content test: ${filesChecked} files passed`))
    return true
  } else {
    console.log(chalk.red(`❌ TypeScript content test: ${errors.length} errors in ${filesChecked} files`))
    errors.slice(0, 5).forEach(error => {
      console.log(chalk.red(`   • ${error}`))
    })
    if (errors.length > 5) {
      console.log(chalk.red(`   ... and ${errors.length - 5} more errors`))
    }
    return false
  }
}

// Test que los componentes Vue tienen estructura válida
function testVueComponents(modulePath, entities) {
  console.log(chalk.yellow('🧪 Testing Vue components structure...'))
  
  const errors = []
  let componentsChecked = 0
  
  for (const entityName of entities) {
    const componentTypes = ['List', 'Form', 'Detail', 'Create', 'Edit']
    
    for (const type of componentTypes) {
      const componentPath = path.join(modulePath, 'presentation', 'views', `${entityName}${type}.vue`)
      
      if (fs.existsSync(componentPath)) {
        componentsChecked++
        try {
          const content = fs.readFileSync(componentPath, 'utf8')
          
          // Check for Vue SFC structure
          if (!content.includes('<template>')) {
            errors.push(`Missing <template> in ${entityName}${type}.vue`)
          }
          
          if (!content.includes('<script setup')) {
            errors.push(`Missing <script setup> in ${entityName}${type}.vue`)
          }
          
          // Check for basic functionality
          if (type === 'List' && !content.includes('table')) {
            errors.push(`List component should have table structure: ${entityName}${type}.vue`)
          }
          
          if (type === 'Form' && !content.includes('form')) {
            errors.push(`Form component should have form structure: ${entityName}${type}.vue`)
          }
          
        } catch (error) {
          errors.push(`Cannot read ${entityName}${type}.vue: ${error.message}`)
        }
      }
    }
  }
  
  if (errors.length === 0) {
    console.log(chalk.green(`✓ Vue components test: ${componentsChecked} components passed`))
    return true
  } else {
    console.log(chalk.red(`❌ Vue components test: ${errors.length} errors in ${componentsChecked} components`))
    errors.forEach(error => {
      console.log(chalk.red(`   • ${error}`))
    })
    return false
  }
}

// Test que los stores de Pinia tienen la estructura correcta
function testPiniaStores(modulePath, entities) {
  console.log(chalk.yellow('🧪 Testing Pinia stores structure...'))
  
  const errors = []
  let storesChecked = 0
  
  for (const entityName of entities) {
    const storePath = path.join(modulePath, 'presentation', 'stores', `${entityName.toLowerCase()}Store.ts`)
    
    if (fs.existsSync(storePath)) {
      storesChecked++
      try {
        const content = fs.readFileSync(storePath, 'utf8')
        
        // Check for required Pinia store structure
        if (!content.includes('defineStore')) {
          errors.push(`Missing defineStore in ${entityName.toLowerCase()}Store.ts`)
        }
        
        // Check for CRUD methods
        const requiredMethods = ['getAll', 'getById', 'create', 'update', 'remove']
        for (const method of requiredMethods) {
          if (!content.includes(method)) {
            errors.push(`Missing ${method} method in ${entityName.toLowerCase()}Store.ts`)
          }
        }
        
        // Check for proper imports
        if (!content.includes('import { defineStore }')) {
          errors.push(`Missing Pinia import in ${entityName.toLowerCase()}Store.ts`)
        }
        
        if (!content.includes(`import type { ${entityName} }`)) {
          errors.push(`Missing entity import in ${entityName.toLowerCase()}Store.ts`)
        }
        
      } catch (error) {
        errors.push(`Cannot read ${entityName.toLowerCase()}Store.ts: ${error.message}`)
      }
    }
  }
  
  if (errors.length === 0) {
    console.log(chalk.green(`✓ Pinia stores test: ${storesChecked} stores passed`))
    return true
  } else {
    console.log(chalk.red(`❌ Pinia stores test: ${errors.length} errors in ${storesChecked} stores`))
    errors.forEach(error => {
      console.log(chalk.red(`   • ${error}`))
    })
    return false
  }
}

// Test que las rutas están configuradas correctamente
function testRouterConfiguration(modulePath) {
  console.log(chalk.yellow('🧪 Testing router configuration...'))
  
  const routesPath = path.join(modulePath, 'presentation', 'router', 'routes.ts')
  
  if (!fs.existsSync(routesPath)) {
    console.log(chalk.red('❌ Router configuration not found'))
    return false
  }
  
  try {
    const content = fs.readFileSync(routesPath, 'utf8')
    const errors = []
    
    // Check for proper router structure
    if (!content.includes('RouteRecordRaw')) {
      errors.push('Missing RouteRecordRaw type import')
    }
    
    if (!content.includes('export const')) {
      errors.push('Missing routes export')
    }
    
    // Check for entity routes
    const entities = getModuleEntities(modulePath)
    for (const entity of entities) {
      if (!content.includes(`${entity}List`)) {
        errors.push(`Missing ${entity}List route`)
      }
      if (!content.includes(`${entity}Create`)) {
        errors.push(`Missing ${entity}Create route`)
      }
    }
    
    if (errors.length === 0) {
      console.log(chalk.green('✓ Router configuration test passed'))
      return true
    } else {
      console.log(chalk.red('❌ Router configuration test failed:'))
      errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`))
      })
      return false
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Cannot read router configuration: ${error.message}`))
    return false
  }
}

// Test de integración básica
function testBasicIntegration(modulePath) {
  console.log(chalk.yellow('🧪 Testing basic integration...'))
  
  const indexPath = path.join(modulePath, 'index.ts')
  const configPath = path.join(modulePath, 'module.config.ts')
  
  const errors = []
  
  // Check main index file
  if (!fs.existsSync(indexPath)) {
    errors.push('Missing module index.ts')
  } else {
    try {
      const content = fs.readFileSync(indexPath, 'utf8')
      
      if (!content.includes('export')) {
        errors.push('Index.ts has no exports')
      }
      
      if (!content.includes('Module')) {
        errors.push('Index.ts missing module definition')
      }
      
    } catch (error) {
      errors.push(`Cannot read index.ts: ${error.message}`)
    }
  }
  
  // Check config file
  if (!fs.existsSync(configPath)) {
    errors.push('Missing module.config.ts')
  } else {
    try {
      const content = fs.readFileSync(configPath, 'utf8')
      
      if (!content.includes('ModuleConfig')) {
        errors.push('module.config.ts missing ModuleConfig type')
      }
      
      if (!content.includes('entities')) {
        errors.push('module.config.ts missing entities configuration')
      }
      
    } catch (error) {
      errors.push(`Cannot read module.config.ts: ${error.message}`)
    }
  }
  
  if (errors.length === 0) {
    console.log(chalk.green('✓ Basic integration test passed'))
    return true
  } else {
    console.log(chalk.red('❌ Basic integration test failed:'))
    errors.forEach(error => {
      console.log(chalk.red(`   • ${error}`))
    })
    return false
  }
}

// Función principal de testing
export async function testModuleFunctionality(moduleName) {
  const modulePath = path.join(MODULES_PATH, moduleName.toLowerCase())
  
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Module ${moduleName} not found at ${modulePath}`)
  }
  
  console.log(chalk.blue(`🧪 Testing module functionality: ${moduleName}`))
  console.log(chalk.gray(`📁 Path: ${modulePath}\n`))
  
  const entities = getModuleEntities(modulePath) // Auto-detect entities
  
  const tests = [
    () => testEntityFiles(modulePath, entities),
    () => testTypeScriptContent(modulePath),
    () => testVueComponents(modulePath, entities),
    () => testPiniaStores(modulePath, entities),
    () => testRouterConfiguration(modulePath),
    () => testBasicIntegration(modulePath)
  ]
  
  let passedTests = 0
  const totalTests = tests.length
  
  for (const test of tests) {
    try {
      const result = test()
      if (result) {
        passedTests++
      }
      console.log() // Add spacing
    } catch (error) {
      console.log(chalk.red(`❌ Test failed with error: ${error.message}\n`))
    }
  }
  
  // Final report
  console.log(chalk.blue('📊 Final Test Report:'))
  console.log(chalk.white(`   Tests passed: ${passedTests}/${totalTests}`))
  
  if (passedTests === totalTests) {
    console.log(chalk.green.bold('🎉 ALL TESTS PASSED! Module is fully functional.'))
    return true
  } else {
    const percentage = Math.round((passedTests / totalTests) * 100)
    console.log(chalk.yellow.bold(`⚠️ ${percentage}% tests passed. Module needs improvements.`))
    return false
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const moduleName = process.argv[2] || 'DashboardMonitor'
  
  testModuleFunctionality(moduleName)
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error(chalk.red(`Fatal error: ${error.message}`))
      process.exit(1)
    })
} 
