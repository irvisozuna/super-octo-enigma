// scripts/helpers.mjs
import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { STUBS_PATH } from './config.mjs'

/**
 * Mapeador de tipos del spec a tipos TypeScript
 */
const TYPE_MAP = {
  // Tipos básicos
  string: 'string',
  text: 'string',
  integer: 'number',
  number: 'number',
  float: 'number',
  double: 'number',
  boolean: 'boolean',
  date: 'Date',
  datetime: 'Date',
  time: 'string',
  uuid: 'string',
  json: 'Record<string, any>',
  array: 'any[]',

  // Tipos especiales
  enum: 'string',
  email: 'string',
  url: 'string',
  phone: 'string',
  password: 'string',
  file: 'File',
  image: 'string',

  // Tipos de relación
  foreign_key: 'string',
  reference: 'string',

  // Tipos por defecto
  default: 'any',
}

/**
 * Convierte un tipo del spec a un tipo TypeScript válido
 */
export function mapTypeToTypeScript(specType, propertyConfig = {}) {
  const baseType = TYPE_MAP[specType] || TYPE_MAP.default

  // Si es un enum, usar el tipo específico
  if (specType === 'enum' && propertyConfig.values)
    return propertyConfig.values.map(v => `'${v}'`).join(' | ')

  // Si es un array, agregar []
  if (propertyConfig.isArray)
    return `${baseType}[]`

  return baseType
}

/**
 * Determina si una propiedad es opcional basándose en su configuración
 */
export function isPropertyOptional(propertyConfig) {
  return !propertyConfig.required && !propertyConfig.primary
}

/**
 * Genera el sufijo de opcionalidad para una propiedad
 */
export function getOptionalSuffix(propertyConfig) {
  return isPropertyOptional(propertyConfig) ? '?' : ''
}

/**
 * Convierte una palabra en plural a su forma singular
 */
export function pluralToSingular(word) {
  const rules = [
    { pattern: /ies$/, replacement: 'y' },
    { pattern: /ves$/, replacement: 'f' },
    { pattern: /oes$/, replacement: 'o' },
    { pattern: /ses$/, replacement: 's' },
    { pattern: /ches$/, replacement: 'ch' },
    { pattern: /shes$/, replacement: 'sh' },
    { pattern: /xes$/, replacement: 'x' },
    { pattern: /s$/, replacement: '' },
  ]

  for (const rule of rules) {
    if (rule.pattern.test(word))
      return word.replace(rule.pattern, rule.replacement)
  }

  return word
}

/**
 * Convierte una palabra singular a plural
 */
export function singularToPlural(word) {
  const rules = [
    { pattern: /y$/, replacement: 'ies' },
    { pattern: /f$/, replacement: 'ves' },
    { pattern: /fe$/, replacement: 'ves' },
    { pattern: /(o)$/, replacement: '$1es' },
    { pattern: /(s|ss|sh|ch|x)$/, replacement: '$1es' },
    { pattern: /$/, replacement: 's' },
  ]

  for (const rule of rules) {
    if (rule.pattern.test(word))
      return word.replace(rule.pattern, rule.replacement)
  }

  return `${word}s`
}

/**
 * Valida que el nombre del módulo cumpla con el patrón permitido
 */
export function validateModuleName(name) {
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    console.error(chalk.red('❌ El nombre del módulo debe empezar con mayúscula y solo contener letras y números.'))
    process.exit(1)
  }

  return name
}

/**
 * Normaliza el nombre del módulo y genera todas las variantes
 */
export function normalizeModuleName(input) {
  const sanitizedInput = validateModuleName(input.trim())
  const moduleName = sanitizedInput.charAt(0).toUpperCase() + sanitizedInput.slice(1)
  const moduleNameLower = moduleName.charAt(0).toLowerCase() + moduleName.slice(1)
  const moduleNameUpper = moduleName.toUpperCase()
  const moduleNameKebab = toKebabCase(moduleName)
  const moduleNameSnake = toSnakeCase(moduleName)
  const moduleNamePlural = singularToPlural(moduleName)
  const moduleNamePluralLower = moduleNamePlural.charAt(0).toLowerCase() + moduleNamePlural.slice(1)

  return {
    original: input,
    moduleName,
    moduleNameLower,
    moduleNameUpper,
    moduleNameKebab,
    moduleNameSnake,
    moduleNamePlural,
    moduleNamePluralLower,
  }
}

/**
 * Convierte a kebab-case
 */
export function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convierte a snake_case
 */
export function toSnakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * Convierte a camelCase
 */
export function toCamelCase(str) {
  return str
    .replace(/^\w|[A-Z]|\b\w/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

/**
 * Convierte a PascalCase
 */
export function toPascalCase(str) {
  return str
    .replace(/^\w|[A-Z]|\b\w/g, word => word.toUpperCase())
    .replace(/\s+/g, '')
}

/**
 * Lee una plantilla (stub) desde la carpeta adecuada
 */
export function readStub(stubFileName, moduleName) {
  // Primero busca en una subcarpeta específica del módulo
  const moduleSpecificPath = path.join(STUBS_PATH, moduleName.toLowerCase())
  const defaultStubPath = path.join(STUBS_PATH, 'ddd')

  let stubPath
  if (fs.existsSync(path.join(moduleSpecificPath, stubFileName))) {
    stubPath = path.join(moduleSpecificPath, stubFileName)
  }
  else if (fs.existsSync(path.join(defaultStubPath, stubFileName))) {
    stubPath = path.join(defaultStubPath, stubFileName)
  }
  else {
    // Fallback a la ruta directa
    stubPath = path.join(STUBS_PATH, stubFileName)
  }

  if (!fs.existsSync(stubPath)) {
    console.error(chalk.red(`❌ Plantilla no encontrada: ${stubFileName}`))
    console.error(chalk.gray(`   Buscada en: ${stubPath}`))

    return `// Template not found: ${stubFileName}`
  }

  return fs.readFileSync(stubPath, 'utf8')
}

/**
 * Reemplaza las variables en el contenido usando el contexto proporcionado
 */
export function replaceVariables(content, variables) {
  let result = content

  // Procesar loops {{#each}} primero
  result = processEachLoops(result, variables)

  // Procesar condicionales {{#if}}
  result = processConditionals(result, variables)

  // Reemplazar variables simples {{variable}}
  result = replaceSimpleVariables(result, variables)

  // Procesar referencias anidadas {{variable.property}}
  result = processNestedReferences(result, variables)

  return result
}

/**
 * Reemplaza variables simples en el formato {{variable}}
 */
function replaceSimpleVariables(content, variables) {
  return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = variables[varName]

    if (value === undefined) {
      console.warn(chalk.yellow(`⚠️  Variable ${varName} no existe`))

      return match
    }

    return value
  })
}

/**
 * Procesa condicionales {{#if variable}}...{{/if}}
 */
function processConditionals(content, variables) {
  // Soporta solo condicionales simples: {{#if variable}}...{{/if}}
  const ifPattern = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g

  return content.replace(ifPattern, (match, varName, inner) => {
    // Soporta acceso a propiedades anidadas tipo a.b.c
    const value = varName.split('.').reduce((acc, key) => acc && acc[key], variables)
    if (value)
      return inner

    return ''
  })
}

/**
 * Procesa los loops {{#each}} en las plantillas
 */
function processEachLoops(content, variables) {
  // Patrón para encontrar bloques {{#each}}
  const eachPattern = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g

  return content.replace(eachPattern, (match, arrayName, template) => {
    const data = variables[arrayName]

    if (!data) {
      console.warn(chalk.yellow(`⚠️  Variable ${arrayName} no existe`))

      return ''
    }

    // Si es un array, procesar como antes
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        let itemTemplate = template

        // Reemplazar {{this}} con el valor del item
        itemTemplate = itemTemplate.replace(/\{\{this\}\}/g, item)

        // Reemplazar {{thisLower}} con el valor en minúsculas
        itemTemplate = itemTemplate.replace(/\{\{thisLower\}\}/g, item.toLowerCase())

        // Reemplazar {{thisUpper}} con el valor en mayúsculas
        itemTemplate = itemTemplate.replace(/\{\{thisUpper\}\}/g, item.toUpperCase())

        // Reemplazar {{@index}} con el índice
        itemTemplate = itemTemplate.replace(/\{\{@index\}\}/g, index.toString())

        return itemTemplate
      }).join('\n')
    }

    // Si es un objeto (como entities), iterar sobre las claves
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data).map(([key, value], index) => {
        let itemTemplate = template

        // Crear un contexto combinado con la clave y el valor
        const context = {
          ...variables,
          '@key': key,
          '@index': index,
          'entityName': key,
          'entityNameLower': key.toLowerCase(),
          'entityNameUpper': key.toUpperCase(),
          ...value, // Incluir las propiedades de la entidad
        }

        // Procesar propiedades si existen
        if (value.properties && typeof value.properties === 'object') {
          const propertiesContext = Object.entries(value.properties).map(([propKey, propValue]) => {
            const tsType = mapTypeToTypeScript(propValue.type, propValue)
            const optionalSuffix = getOptionalSuffix(propValue)

            return {
              '@key': propKey,
              'type': tsType,
              'required': optionalSuffix,
              'isRequired': propValue.required || false,
              'isPrimary': propValue.primary || false,
              'isGenerated': propValue.generated || false,
              'default': propValue.default,
              'values': propValue.values,
              ...propValue,
            }
          })

          // Procesar el template con las propiedades
          let processedTemplate = itemTemplate

          // Reemplazar bucles de propiedades
          const propertiesPattern = /\{\{#each\s+properties\}\}([\s\S]*?)\{\{\/each\}\}/g

          processedTemplate = processedTemplate.replace(propertiesPattern, (match, propTemplate) => {
            return propertiesContext.map(prop => {
              let propItemTemplate = propTemplate

              // Reemplazar variables de propiedad
              propItemTemplate = propItemTemplate.replace(/\{\{@key\}\}/g, prop['@key'])
              propItemTemplate = propItemTemplate.replace(/\{\{type\}\}/g, prop.type)
              propItemTemplate = propItemTemplate.replace(/\{\{required\}\}/g, prop.required)
              propItemTemplate = propItemTemplate.replace(/\{\{isRequired\}\}/g, prop.isRequired.toString())
              propItemTemplate = propItemTemplate.replace(/\{\{isPrimary\}\}/g, prop.isPrimary.toString())
              propItemTemplate = propItemTemplate.replace(/\{\{isGenerated\}\}/g, prop.isGenerated.toString())

              return propItemTemplate
            }).join('\n')
          })

          itemTemplate = processedTemplate
        }

        // Reemplazar variables básicas
        itemTemplate = itemTemplate.replace(/\{\{@key\}\}/g, key)
        itemTemplate = itemTemplate.replace(/\{\{@index\}\}/g, index.toString())
        itemTemplate = itemTemplate.replace(/\{\{entityName\}\}/g, key)
        itemTemplate = itemTemplate.replace(/\{\{entityNameLower\}\}/g, key.toLowerCase())
        itemTemplate = itemTemplate.replace(/\{\{entityNameUpper\}\}/g, key.toUpperCase())

        return itemTemplate
      }).join('\n')
    }

    return ''
  })
}

/**
 * Procesa las referencias del contexto padre
 */
function processParentContext(template, variables, currentItem) {
  let result = template

  // Reemplazar variables del contexto padre usando {{../variable}}
  const parentContextPattern = /\{\{\.\.\/(\w+)\}\}/g

  result = result.replace(parentContextPattern, (match, varName) => {
    return variables[varName] || ''
  })

  // Procesar referencias anidadas como {{../spec.entities.[this].properties}}
  const nestedRefPattern = /\{\{\.\.\/([^}]+)\}\}/g

  result = result.replace(nestedRefPattern, (match, path) => {
    const pathParts = path.split('.')
    let current = variables

    for (const part of pathParts) {
      if (part === '[this]' && currentItem) {
        current = current[currentItem] || {}
      }
      else if (part.startsWith('[') && part.endsWith(']')) {
        const key = part.slice(1, -1)

        current = current[key] || {}
      }
      else {
        current = current[part] || {}
      }
    }

    return current
  })

  return result
}

/**
 * Reemplaza referencias anidadas como {{a.b.c}}
 */
function processNestedReferences(content, variables) {
  // Busca {{a.b.c}} y reemplaza por el valor correspondiente
  return content.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
    const value = path.split('.').reduce((acc, key) => acc && acc[key], variables)

    return value !== undefined ? value : match
  })
}

/**
 * Crea un archivo con el contenido dado
 */
export function createFile(filePath, content) {
  const processedPath = replaceVariables(filePath, content.variables || {})
  const dir = path.dirname(processedPath)

  ensureDirectoryExists(dir)

  fs.writeFileSync(processedPath, content, 'utf8')
  console.log(chalk.green(`   ✓ ${path.basename(processedPath)}`))
}

/**
 * Asegura que un directorio existe, si no lo crea
 */
export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath))
    fs.mkdirSync(dirPath, { recursive: true })
}

/**
 * Genera un timestamp en formato ISO
 */
export function generateTimestamp() {
  return new Date().toISOString()
}

/**
 * Genera un UUID v4
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)

    return v.toString(16)
  })
}

/**
 * Capitaliza la primera letra de una cadena
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Genera el contenido de un archivo de barril (index.ts)
 */
export function generateBarrelExports(files, basePath) {
  return files
    .map(file => {
      const fileName = path.basename(file, path.extname(file))
      const relativePath = `./${path.relative(basePath, file).replace(/\\/g, '/')}`

      return `export * from '${relativePath.replace(/\.ts$/, '')}'`
    })
    .join('\n')
}

/**
 * Valida si un directorio está vacío
 */
export function isDirectoryEmpty(dirPath) {
  if (!fs.existsSync(dirPath))
    return true

  return fs.readdirSync(dirPath).length === 0
}

/**
 * Copia archivos de un directorio a otro
 */
export function copyDirectory(source, destination) {
  ensureDirectoryExists(destination)

  const files = fs.readdirSync(source)

  files.forEach(file => {
    const sourcePath = path.join(source, file)
    const destPath = path.join(destination, file)

    if (fs.statSync(sourcePath).isDirectory())
      copyDirectory(sourcePath, destPath)
    else
      fs.copyFileSync(sourcePath, destPath)
  })
}

/**
 * Genera un archivo de configuración de módulo
 */
export function generateModuleConfig(moduleName, features) {
  return {
    name: moduleName.moduleName,
    version: '1.0.0',
    description: `${moduleName.moduleName} module with DDD architecture`,
    features,
    created: generateTimestamp(),
    author: process.env.USER || 'DDD Generator',
  }
}

/**
 * Valida que todas las dependencias estén instaladas
 */
export function validateDependencies() {
  const requiredDeps = ['vue', 'vue-router', 'pinia', 'axios', 'yup', 'vue-i18n']
  const missingDeps = []

  requiredDeps.forEach(dep => {
    try {
      require.resolve(dep)
    }
    catch {
      missingDeps.push(dep)
    }
  })

  if (missingDeps.length > 0) {
    console.warn(chalk.yellow(`⚠️  Dependencias faltantes: ${missingDeps.join(', ')}`))
    console.log(chalk.gray(`   Instala con: npm install ${missingDeps.join(' ')}`))
  }
}

/**
 * Genera estadísticas del módulo
 */
export function generateModuleStats(modulePath) {
  let fileCount = 0
  let lineCount = 0
  let sizeInBytes = 0

  function walkDir(dir) {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        walkDir(filePath)
      }
      else if (file.endsWith('.ts') || file.endsWith('.vue')) {
        fileCount++
        sizeInBytes += stat.size

        const content = fs.readFileSync(filePath, 'utf8')

        lineCount += content.split('\n').length
      }
    })
  }

  if (fs.existsSync(modulePath))
    walkDir(modulePath)

  return {
    files: fileCount,
    lines: lineCount,
    size: formatBytes(sizeInBytes),
  }
}

/**
 * Formatea bytes a formato legible
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}
