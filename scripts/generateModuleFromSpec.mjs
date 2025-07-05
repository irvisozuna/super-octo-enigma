#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { generateModuleFromSpec } from './generator.mjs'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error(chalk.red('❌ Error: Debes especificar el archivo spec JSON'))
    console.log(chalk.gray('Uso: node scripts/generateModuleFromSpec.mjs <spec-file.json>'))
    process.exit(1)
  }

  const specFile = args[0]

  if (!fs.existsSync(specFile)) {
    console.error(chalk.red(`❌ Error: El archivo ${specFile} no existe`))
    process.exit(1)
  }

  try {
    console.log(chalk.cyan.bold('🏗️  DDD Module Generator from Spec'))
    console.log(chalk.gray('─'.repeat(50)))
    console.log(chalk.blue(`📄 Leyendo spec: ${specFile}`))

    const specContent = fs.readFileSync(specFile, 'utf8')
    const spec = JSON.parse(specContent)

    if (!spec.moduleName) {
      console.error(chalk.red('❌ Error: El spec debe contener un campo "moduleName"'))
      process.exit(1)
    }

    console.log(chalk.green(`✅ Spec válido para módulo: ${spec.moduleName}`))

    // Generar el módulo
    await generateModuleFromSpec(spec)

    console.log(chalk.green(`\n✅ Módulo ${spec.moduleName} generado exitosamente!`))
  }
  catch (error) {
    console.error(chalk.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

// Ejecutar
main()
