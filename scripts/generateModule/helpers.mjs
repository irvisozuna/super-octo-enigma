// scripts/helpers.mjs
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { STUBS_PATH } from './generateModule/config.mjs';

/**
 * Convierte una palabra en plural a su forma singular.
 */
export function pluralToSingular(word) {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';   // e.g. "batteries" -> "battery"
  if (word.endsWith('ves')) return word.slice(0, -3) + 'f';   // e.g. "wolves" -> "wolf"
  if (word.endsWith('oes')) return word.slice(0, -2);         // e.g. "heroes" -> "hero"
  if (word.endsWith('ses')) return word.slice(0, -2);         // e.g. "buses" -> "bus"
  if (word.endsWith('xes')) return word.slice(0, -2);         // e.g. "boxes" -> "box"
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1); // e.g. "cats" -> "cat"
  return word;
}

/**
 * Valida que el nombre del módulo cumpla con el patrón permitido.
 */
export function validateModuleName(name) {
  const isValid = /^[a-zA-Z0-9_-]+$/.test(name);
  if (!isValid) {
    console.error(chalk.red('El nombre del módulo contiene caracteres no permitidos.'));
    process.exit(1);
  }
  return name;
}

/**
 * Normaliza el nombre: lo limpia, valida y genera variantes (lower, upper, etc.).
 */
export function normalizeModuleName(input) {
  const sanitizedInput = validateModuleName(input.trim().toLowerCase());
  const singular = pluralToSingular(sanitizedInput);
  const moduleName = singular.charAt(0).toUpperCase() + singular.slice(1);

  return {
    original: input,
    moduleName,
    moduleNameLower: singular,
    moduleNameUpper: moduleName.toUpperCase()
  };
}

/**
 * Lee una plantilla (stub) desde la carpeta adecuada.
 * - Primero busca en una subcarpeta específica (STUBS_PATH/<moduleName>),
 * - Si no existe, usa la carpeta "defaults".
 */
export function readStub(stubFileName, moduleName) {
  const moduleSpecificPath = path.join(STUBS_PATH, moduleName.toLowerCase());
  const defaultStubPath = path.join(STUBS_PATH, 'defaults');
  
  // Determina qué stub usar
  const stubPath = fs.existsSync(moduleSpecificPath)
    ? path.join(moduleSpecificPath, stubFileName)
    : path.join(defaultStubPath, stubFileName);

  if (!fs.existsSync(stubPath)) {
    console.error(chalk.red(`Plantilla no encontrada: ${stubFileName}`));
    process.exit(1);
  }

  return fs.readFileSync(stubPath, 'utf8');
}

/**
 * Reemplaza las variables de la forma {{variable}} en el contenido.
 */
export function replaceVariables(content, variables) {
  return Object.keys(variables).reduce(
    (result, key) => result.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]),
    content
  );
}

/**
 * Crea un archivo con el contenido dado, y si la carpeta no existe, la crea recursivamente.
 */
export function createFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(chalk.green(`Carpeta creada: ${dir}`));
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(chalk.green(`Archivo creado: ${filePath}`));
}
