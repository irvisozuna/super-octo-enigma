#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const MODULES_PATH = 'src/modules'

// Corregir importaciones y variables en componentes Vue
async function fixVueComponentIssues(modulePath, entities) {
  console.log(chalk.yellow('🔧 Fixing Vue component issues...'))
  
  for (const entityName of entities) {
    const componentTypes = ['List', 'Form', 'Detail', 'Create', 'Edit']
    
    for (const type of componentTypes) {
      const componentPath = path.join(modulePath, 'presentation', 'views', `${entityName}${type}.vue`)
      
      if (fs.existsSync(componentPath)) {
        try {
          let content = fs.readFileSync(componentPath, 'utf8')
          let hasChanges = false
          
          // Fix formatDate import - change from global to local
          if (content.includes("from '@/shared/utils/dateUtils'")) {
            content = content.replace(
              "from '@/shared/utils/dateUtils'",
              "from '../../shared/utils/dateUtils'"
            )
            hasChanges = true
          }
          
          // If it still uses formatDate but has no import, add inline formatter
          if (content.includes('formatDate(') && !content.includes('formatDate =')) {
            const scriptSetupIndex = content.indexOf('<script setup lang="ts">')
            if (scriptSetupIndex !== -1) {
              const insertIndex = scriptSetupIndex + '<script setup lang="ts">'.length
              const inlineFormatter = `
// Simple date formatter
const formatDate = (date: any) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return 'Invalid Date'
  }
}`
              content = content.slice(0, insertIndex) + inlineFormatter + content.slice(insertIndex)
              hasChanges = true
            }
          }
          
          // Remove any remaining template variables like {{ }}
          const templateVarRegex = /\{\{[^}]+\}\}/g
          if (templateVarRegex.test(content)) {
            // For List components, replace {{ entityName.toLowerCase() }} with actual entity name
            content = content.replace(/\{\{\s*(\w+)\.toLowerCase\(\)\s*\}\}/g, entityName.toLowerCase())
            
            // For other template variables, replace with sensible defaults
            content = content.replace(/\{\{\s*(\w+)\.(\w+)\s*\}\}/g, (match, obj, prop) => {
              if (obj === 'formatDate') return 'formatDate'
              if (prop === 'name') return `${entityName.toLowerCase()}.name`
              if (prop === 'status') return `${entityName.toLowerCase()}.status`
              if (prop === 'created_at') return `${entityName.toLowerCase()}.created_at`
              return `${entityName.toLowerCase()}.${prop}`
            })
            
            // Replace simple template variables
            content = content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, varName) => {
              if (varName === 'loading') return 'loading'
              if (varName === 'isEdit') return 'isEdit'
              return varName
            })
            
            hasChanges = true
          }
          
          // Fix form reactive object for specific entity
          if (type === 'Form' && content.includes("form = reactive({")) {
            // Get the entity's main properties for the form
            const entityFormFields = getEntityFormFields(entityName)
            const formReactiveRegex = /form = reactive\(\{[^}]*\}\)/s
            const newFormReactive = `form = reactive(${JSON.stringify(entityFormFields, null, 2)})`
            
            content = content.replace(formReactiveRegex, newFormReactive)
            hasChanges = true
          }
          
          // Fix prop interfaces for specific entity
          if (type === 'Form' && content.includes('interface Props')) {
            const propsRegex = /interface Props \{[^}]*\}/s
            const newProps = `interface Props {
  ${entityName.toLowerCase()}?: ${entityName}
  isEdit?: boolean
}`
            content = content.replace(propsRegex, newProps)
            hasChanges = true
          }
          
          // Add missing entity type import if needed
          if (!content.includes(`import type { ${entityName} }`)) {
            const scriptSetupIndex = content.indexOf('<script setup lang="ts">')
            if (scriptSetupIndex !== -1) {
              const insertIndex = scriptSetupIndex + '<script setup lang="ts">'.length
              const entityImport = `\nimport type { ${entityName} } from '../../domain/entities/${entityName}'`
              content = content.slice(0, insertIndex) + entityImport + content.slice(insertIndex)
              hasChanges = true
            }
          }
          
          if (hasChanges) {
            fs.writeFileSync(componentPath, content, 'utf8')
            console.log(chalk.green(`✓ Fixed ${entityName}${type}.vue`))
          }
          
        } catch (error) {
          console.log(chalk.red(`❌ Error fixing ${entityName}${type}.vue: ${error.message}`))
        }
      }
    }
  }
}

// Get appropriate form fields for each entity
function getEntityFormFields(entityName) {
  const baseFields = {
    name: '',
    status: 'active'
  }
  
  switch (entityName) {
    case 'Reader':
      return {
        name: '',
        email: '',
        phone: '',
        employee_code: '',
        status: 'active'
      }
    case 'Route':
      return {
        name: '',
        description: '',
        status: 'active'
      }
    case 'Reading':
      return {
        meter_id: '',
        reader_id: '',
        reading_value: 0,
        photo_url: '',
        status: 'pending'
      }
    case 'Meter':
      return {
        meter_number: '',
        customer_name: '',
        customer_address: '',
        status: 'active'
      }
    default:
      return baseFields
  }
}

// Main function
async function fixVueComponents(moduleName) {
  const modulePath = path.join(MODULES_PATH, moduleName.toLowerCase())
  
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Module ${moduleName} not found at ${modulePath}`)
  }
  
  console.log(chalk.blue(`🔧 Fixing Vue components for module: ${moduleName}`))
  
  const entities = ['Reader', 'Route', 'Reading', 'Meter']
  
  try {
    await fixVueComponentIssues(modulePath, entities)
    console.log(chalk.green.bold('✅ Vue components fixed successfully!'))
    return true
  } catch (error) {
    console.error(chalk.red(`❌ Error fixing Vue components: ${error.message}`))
    return false
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const moduleName = process.argv[2] || 'DashboardMonitor'
  
  fixVueComponents(moduleName)
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error(chalk.red(`Fatal error: ${error.message}`))
      process.exit(1)
    })
} 
