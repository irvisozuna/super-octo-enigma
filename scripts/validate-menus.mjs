#!/usr/bin/env node

/**
 * Script para validar todos los menús del proyecto
 * Puede ejecutarse manualmente o como pre-commit hook
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

let hasErrors = false

function validateMenuFile(filePath) {
  console.log(`\n📄 Validando: ${filePath}`)
  
  try {
    const content = readFileSync(filePath, 'utf-8')
    const errors = []

    // Validar formato de iconos
    const iconStringMatches = content.match(/icon:\s*['"`][\w-]+['"`]/g)
    if (iconStringMatches) {
      errors.push({
        type: 'icon-format',
        message: 'Iconos encontrados como strings en lugar de objetos',
        matches: iconStringMatches,
        fix: 'Cambiar icon: "name" por icon: { icon: "name" }'
      })
    }

    // Validar que use VerticalNavItems
    if (!content.includes('VerticalNavItems') && !content.includes('HorizontalNavItems')) {
      errors.push({
        type: 'missing-type',
        message: 'No usa el tipo VerticalNavItems o HorizontalNavItems',
        fix: 'import type { VerticalNavItems } from \'@layouts/types\''
      })
    }

    // Validar que use el validador
    if (!content.includes('createValidatedMenu')) {
      console.warn('⚠️  No usa createValidatedMenu() - recomendado para desarrollo')
    }

    // Validar paths absolutos en "to"
    const absolutePathMatches = content.match(/to:\s*['"`]\/[\w-/]+['"`]/g)
    if (absolutePathMatches) {
      errors.push({
        type: 'absolute-paths',
        message: 'Paths absolutos encontrados (debe usar nombres de ruta)',
        matches: absolutePathMatches,
        fix: 'Cambiar to: "/path" por to: "route-name"'
      })
    }

    // Reportar errores
    if (errors.length > 0) {
      hasErrors = true
      console.error(`\n❌ ${errors.length} error(es) encontrado(s):\n`)
      
      errors.forEach((error, index) => {
        console.error(`${index + 1}. ${error.type.toUpperCase()}`)
        console.error(`   ${error.message}`)
        if (error.matches) {
          console.error(`   Encontrado: ${error.matches.slice(0, 3).join(', ')}${error.matches.length > 3 ? '...' : ''}`)
        }
        console.error(`   💡 Fix: ${error.fix}\n`)
      })
    } else {
      console.log('✅ Sin errores detectados')
    }

  } catch (error) {
    console.error(`❌ Error leyendo archivo: ${error.message}`)
    hasErrors = true
  }
}

function findMenuFiles(dir) {
  const files = []
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findMenuFiles(fullPath))
      } else if (entry.isFile() && entry.name === 'menu.ts') {
        files.push(fullPath)
      }
    }
  } catch (error) {
    // Ignorar directorios sin acceso
  }
  
  return files
}

// Main
console.log('🔍 Buscando archivos menu.ts en el proyecto...\n')

const modulesDir = join(projectRoot, 'src', 'modules')
const menuFiles = findMenuFiles(modulesDir)

console.log(`📦 Encontrados ${menuFiles.length} archivos de menú\n`)
console.log('━'.repeat(60))

menuFiles.forEach(validateMenuFile)

console.log('\n' + '━'.repeat(60))

if (hasErrors) {
  console.error('\n❌ Validación fallida. Por favor corrije los errores antes de hacer commit.\n')
  process.exit(1)
} else {
  console.log('\n✅ Todos los menús pasaron la validación.\n')
  process.exit(0)
}

