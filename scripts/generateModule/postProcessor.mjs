import fs from 'node:fs'
import path from 'node:path'
import { getOptionalSuffix, mapTypeToTypeScript } from './helpers.mjs'

/**
 * Post-procesa los archivos generados para agregar las propiedades correctamente
 */
export function postProcessGeneratedFiles(modulePath, spec) {
  const entities = spec.entities || {}

  Object.entries(entities).forEach(([entityName, entitySpec]) => {
    const properties = entitySpec.properties || {}

    // Procesar archivos de comandos
    postProcessCommandFiles(modulePath, entityName, properties)

    // Procesar archivos de DTOs
    postProcessDTOFiles(modulePath, entityName, properties)

    // Procesar archivos de entidades
    postProcessEntityFiles(modulePath, entityName, properties)
  })

  // Procesar archivo types.ts
  postProcessTypesFile(modulePath, entities)
}

/**
 * Post-procesa archivos de comandos
 */
function postProcessCommandFiles(modulePath, entityName, properties) {
  const commandFiles = [
    `application/${entityName.toLowerCase()}/commands/Create${entityName}Command.ts`,
    `application/${entityName.toLowerCase()}/commands/Update${entityName}Command.ts`,
  ]

  commandFiles.forEach(filePath => {
    const fullPath = path.join(modulePath, filePath)
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8')

      // Generar propiedades
      const propertiesCode = Object.entries(properties)
        .map(([propName, propConfig]) => {
          const tsType = mapTypeToTypeScript(propConfig.type, propConfig)
          const optionalSuffix = getOptionalSuffix(propConfig)

          return `  ${propName}${optionalSuffix}: ${tsType};`
        })
        .join('\n')

      // Reemplazar placeholder y eliminar código adicional
      content = content.replace('// Properties will be added here', propertiesCode)

      // Eliminar código adicional (clases de implementación, validaciones, etc.)
      content = content.replace(/export class[\s\S]*?\}\s*\}/g, '')

      // Limpiar líneas vacías múltiples
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n')

      fs.writeFileSync(fullPath, content)
    }
  })
}

/**
 * Post-procesa archivos de DTOs
 */
function postProcessDTOFiles(modulePath, entityName, properties) {
  const dtoFiles = [
    `application/${entityName.toLowerCase()}/dtos/Create${entityName}DTO.ts`,
    `application/${entityName.toLowerCase()}/dtos/Update${entityName}DTO.ts`,
  ]

  dtoFiles.forEach(filePath => {
    const fullPath = path.join(modulePath, filePath)
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8')

      // Generar propiedades
      const propertiesCode = Object.entries(properties)
        .map(([propName, propConfig]) => {
          const tsType = mapTypeToTypeScript(propConfig.type, propConfig)
          const optionalSuffix = getOptionalSuffix(propConfig)

          return `  ${propName}${optionalSuffix}: ${tsType};`
        })
        .join('\n')

      // Reemplazar placeholder y eliminar código adicional
      content = content.replace('// Properties will be added here', propertiesCode)

      // Eliminar código adicional
      content = content.replace(/export class[\s\S]*?\}\s*\}/g, '')

      // Limpiar líneas vacías múltiples
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n')

      fs.writeFileSync(fullPath, content)
    }
  })
}

/**
 * Post-procesa archivos de entidades
 */
function postProcessEntityFiles(modulePath, entityName, properties) {
  const entityFile = `domain/${entityName.toLowerCase()}/${entityName}.ts`
  const fullPath = path.join(modulePath, entityFile)

  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')

    // Generar propiedades
    const propertiesCode = Object.entries(properties)
      .map(([propName, propConfig]) => {
        const tsType = mapTypeToTypeScript(propConfig.type, propConfig)
        const optionalSuffix = getOptionalSuffix(propConfig)

        return `  ${propName}${optionalSuffix}: ${tsType};`
      })
      .join('\n')

    // Reemplazar placeholder
    content = content.replace('// Properties will be added here', propertiesCode)

    // Eliminar código adicional complejo (AggregateRoot, eventos, etc.)
    content = content.replace(/import[\s\S]*?;/g, '')
    content = content.replace(/extends AggregateRoot[\s\S]*?\}/g, '')
    content = content.replace(/\{\{#each[\s\S]*?\}\}/g, '')
    content = content.replace(/\{\{\/each\}\}/g, '')
    content = content.replace(/\{\{#if[\s\S]*?\}\}/g, '')
    content = content.replace(/\{\{\/if\}\}/g, '')
    content = content.replace(/\{\{#unless[\s\S]*?\}\}/g, '')
    content = content.replace(/\{\{\/unless\}\}/g, '')
    content = content.replace(/\{\{@key\}\}/g, '')
    content = content.replace(/\{\{[\s\S]*?\}\}/g, '')

    // Limpiar líneas vacías múltiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n')

    fs.writeFileSync(fullPath, content)
  }
}

/**
 * Post-procesa archivo types.ts
 */
function postProcessTypesFile(modulePath, entities) {
  const typesFile = path.join(modulePath, 'types.ts')

  if (fs.existsSync(typesFile)) {
    let content = fs.readFileSync(typesFile, 'utf8')

    // Limpiar variables no procesadas
    content = content.replace(/\{\{#each[\s\S]*?\}\}/g, '')
    content = content.replace(/\{\{\/each\}\}/g, '')
    content = content.replace(/\{\{@key\}\}/g, '')
    content = content.replace(/\{\{required\}\}/g, '')
    content = content.replace(/\{\{type\}\}/g, '')
    content = content.replace(/\{\{[\s\S]*?\}\}/g, '')

    // Generar interfaces de entidades correctamente
    Object.entries(entities).forEach(([entityName, entitySpec]) => {
      const properties = entitySpec.properties || {}

      // Generar propiedades para la interfaz de la entidad
      const entityPropertiesCode = Object.entries(properties)
        .map(([propName, propConfig]) => {
          const tsType = mapTypeToTypeScript(propConfig.type, propConfig)
          const optionalSuffix = getOptionalSuffix(propConfig)

          return `  ${propName}${optionalSuffix}: ${tsType};`
        })
        .join('\n')

      // Reemplazar la interfaz de la entidad
      const entityInterfacePattern = new RegExp(`export interface ${entityName} \\{[\\s\\S]*?\\}`, 'g')

      const entityInterfaceReplacement = `export interface ${entityName} {
  id: string;
${entityPropertiesCode}
}`

      content = content.replace(entityInterfacePattern, entityInterfaceReplacement)

      // Generar propiedades para CreateDTO
      const createDTOPropertiesCode = Object.entries(properties)
        .map(([propName, propConfig]) => {
          const tsType = mapTypeToTypeScript(propConfig.type, propConfig)
          const optionalSuffix = getOptionalSuffix(propConfig)

          return `  ${propName}${optionalSuffix}: ${tsType};`
        })
        .join('\n')

      // Reemplazar CreateDTO
      const createDTOPattern = new RegExp(`export interface Create${entityName}DTO \\{[\\s\\S]*?\\}`, 'g')

      const createDTOReplacement = `export interface Create${entityName}DTO {
${createDTOPropertiesCode}
}`

      content = content.replace(createDTOPattern, createDTOReplacement)

      // Generar propiedades para UpdateDTO
      const updateDTOPropertiesCode = Object.entries(properties)
        .map(([propName, propConfig]) => {
          const tsType = mapTypeToTypeScript(propConfig.type, propConfig)

          return `  ${propName}?: ${tsType};`
        })
        .join('\n')

      // Reemplazar UpdateDTO
      const updateDTOPattern = new RegExp(`export interface Update${entityName}DTO \\{[\\s\\S]*?\\}`, 'g')

      const updateDTOReplacement = `export interface Update${entityName}DTO {
  id: string;
${updateDTOPropertiesCode}
}`

      content = content.replace(updateDTOPattern, updateDTOReplacement)
    })

    // Limpiar líneas vacías múltiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n')

    fs.writeFileSync(typesFile, content)
  }
}
