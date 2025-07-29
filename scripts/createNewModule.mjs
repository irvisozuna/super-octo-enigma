#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import chalk from 'chalk'
import { generateModuleFromSpec } from './generator.mjs'

function showHelp() {
  console.log(chalk.cyan.bold('🏗️  New Module Creator'))
  console.log(chalk.gray('─'.repeat(50)))
  console.log(chalk.white('Crear un nuevo módulo desde el template base\n'))
  
  console.log(chalk.yellow('Uso:'))
  console.log(chalk.gray('  node scripts/createNewModule.mjs <nombre-modulo>'))
  console.log(chalk.gray('  node scripts/createNewModule.mjs <nombre-modulo> --from <spec-existente.json>\n'))
  
  console.log(chalk.yellow('Ejemplos:'))
  console.log(chalk.gray('  node scripts/createNewModule.mjs InventoryManager'))
  console.log(chalk.gray('  node scripts/createNewModule.mjs BlogSystem --from specs/dashboad-monitor.json'))
  console.log(chalk.gray('  node scripts/createNewModule.mjs CRMModule\n'))
  
  console.log(chalk.yellow('Flujo completo:'))
  console.log(chalk.gray('  1. Copia el spectBase.json al nuevo módulo'))
  console.log(chalk.gray('  2. Abre el archivo para editarlo'))
  console.log(chalk.gray('  3. Ejecuta el generador automáticamente'))
  console.log(chalk.gray('  4. Te muestra la estructura generada\n'))
}

function normalizeModuleName(name) {
  // Convertir a PascalCase
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function getSpecFileName(moduleName) {
  // Convertir PascalCase a kebab-case para el nombre del archivo
  return moduleName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
}

async function createNewModule(moduleName, fromSpec = null) {
  try {
    console.log(chalk.cyan.bold('🏗️  New Module Creator'))
    console.log(chalk.gray('─'.repeat(50)))

    // Normalizar nombre del módulo
    const normalizedName = normalizeModuleName(moduleName)
    const specFileName = getSpecFileName(normalizedName)
    const specPath = `specs/${specFileName}.json`

    console.log(chalk.blue(`📄 Creando spec para módulo: ${normalizedName}`))
    console.log(chalk.gray(`📁 Archivo spec: ${specPath}`))

    // Verificar si ya existe
    if (fs.existsSync(specPath)) {
      console.log(chalk.yellow(`⚠️  El spec ${specPath} ya existe.`))
      console.log(chalk.gray('¿Quieres continuar y sobrescribir? (Ctrl+C para cancelar)'))
      
      // Esperar 3 segundos para que el usuario pueda cancelar
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    // Fuente del template
    const sourceSpec = fromSpec || 'specs/spectBase.json'
    
    if (!fs.existsSync(sourceSpec)) {
      console.error(chalk.red(`❌ No se encontró el archivo fuente: ${sourceSpec}`))
      process.exit(1)
    }

    // Leer y modificar el template
    console.log(chalk.yellow(`📋 Copiando desde: ${sourceSpec}`))
    const templateContent = fs.readFileSync(sourceSpec, 'utf8')
    const spec = JSON.parse(templateContent)

    // Personalizar el spec
    spec.moduleName = normalizedName
    spec.description = `Módulo ${normalizedName} - Personaliza esta descripción`
    
    if (sourceSpec === 'specs/spectBase.json') {
      // Solo actualizar si es del template base
      spec.entities = {
        [`${normalizedName}Entity`]: {
          table: specFileName.replace('-', '_'),
          description: `Entidad principal del módulo ${normalizedName}`,
          properties: {
            id: { type: 'uuid', primary: true, generated: true },
            name: { type: 'string', required: true },
            description: { type: 'string', required: false },
            status: { 
              type: 'enum', 
              values: ['active', 'inactive'], 
              default: 'active',
              required: true 
            },
            created_at: { type: 'datetime', generated: true },
            updated_at: { type: 'datetime', generated: true }
          }
        }
      }
    }

    // Guardar el nuevo spec
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2))
    console.log(chalk.green(`✅ Spec creado: ${specPath}`))

    // Preguntar si quiere editar el spec
    console.log(chalk.cyan(`\n📝 Abre ${specPath} para personalizar tus entidades`))
    console.log(chalk.gray('Ejemplo: cambia "YourEntity" por "Product", "User", "Order", etc.'))
    console.log(chalk.gray('Añade las propiedades específicas que necesites'))
    
    console.log(chalk.yellow('\n⏳ Presiona ENTER cuando hayas terminado de editar el spec, o Ctrl+C para salir...'))
    
    // Esperar entrada del usuario
    process.stdin.setRawMode(true)
    process.stdin.resume()
    
    await new Promise((resolve) => {
      process.stdin.on('data', (key) => {
        if (key[0] === 13) { // Enter key
          process.stdin.setRawMode(false)
          process.stdin.pause()
          resolve()
        } else if (key[0] === 3) { // Ctrl+C
          console.log(chalk.yellow('\n👋 Proceso cancelado por el usuario'))
          process.exit(0)
        }
      })
    })

    console.log(chalk.cyan('\n🚀 Generando módulo...'))

    // Ejecutar el generador
    execSync(`node scripts/generateModuleFromSpec.mjs ${specPath}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })

    // Mostrar resultado final
    console.log(chalk.green.bold(`\n🎉 ¡Módulo ${normalizedName} creado exitosamente!`))
    console.log(chalk.gray('─'.repeat(50)))
    console.log(chalk.blue('📁 Ubicación:'), `src/modules/${specFileName}`)
    console.log(chalk.blue('📄 Spec:'), specPath)
    console.log(chalk.blue('🎯 Siguiente paso:'), 'Personalizar los componentes Vue si es necesario')

  } catch (error) {
    console.error(chalk.red.bold('❌ Error creando módulo:'), error.message)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  const moduleName = args[0]
  let fromSpec = null

  // Verificar si se especificó un spec de origen
  const fromIndex = args.indexOf('--from')
  if (fromIndex !== -1 && args[fromIndex + 1]) {
    fromSpec = args[fromIndex + 1]
  }

  if (!moduleName) {
    console.error(chalk.red('❌ Debes especificar un nombre para el módulo'))
    showHelp()
    process.exit(1)
  }

  await createNewModule(moduleName, fromSpec)
}

main().catch(console.error) 
