// scripts/generator.mjs
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { MODULES_PATH } from './config.mjs';
import {
  createFile,
  readStub,
  replaceVariables
} from './helpers.mjs';

/**
 * Elimina un módulo (carpeta principal + contenido).
 */
export function deleteModule(moduleName) {
  const modulePath = path.join(MODULES_PATH, moduleName.moduleNameLower);
  if (fs.existsSync(modulePath)) {
    fs.rmSync(modulePath, { recursive: true, force: true });
    console.log(chalk.yellow(`El módulo ${moduleName.moduleName} fue eliminado.`));
  } else {
    console.log(chalk.red(`No se encontró el módulo ${moduleName.moduleName}.`));
  }
}

/**
 * Genera o regenera un módulo (carpetas y archivos desde plantillas).
 */
export async function generateModule(moduleName, regenerate = false) {
  console.log(chalk.yellow(`${regenerate ? 'Regenerando' : 'Generando'} módulo: ${moduleName.original}`));
  const modulePath = path.join(MODULES_PATH, moduleName.moduleNameLower);

  // Si no es regeneración y ya existe, pregunta si se debe sobrescribir
  if (!regenerate && fs.existsSync(modulePath)) {
    const { shouldRegenerate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldRegenerate',
        message: `El módulo ${moduleName.moduleName} ya existe. ¿Quieres regenerarlo?`,
        default: false,
      },
    ]);

    if (!shouldRegenerate) {
      console.log(chalk.yellow('Operación cancelada.'));
      return;
    }
    regenerate = true;
  }

  if (regenerate) {
    deleteModule(moduleName); // Eliminar antes de regenerar
  }

  // Crea subcarpetas base
  const subfolders = ['views','components', 'composables', 'stores', 'types', 'tests'];
  subfolders.forEach((subfolder) => {
    const subfolderPath = path.join(modulePath, subfolder);
    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath, { recursive: true });
      console.log(chalk.green(`Carpeta creada: ${subfolderPath}`));
    }
  });

  // Define los archivos a crear
  const filesToGenerate = [
    { stub: 'vue.stub',           output: `views/index.vue` },
    { stub: 'routes.stub',        output: 'routes.ts' },
    { stub: 'index.stub',         output: 'index.ts' },
    { stub: 'store.stub',         output: `stores/${moduleName.moduleNameLower}Store.ts` },
    { stub: 'type.stub',          output: `types/${moduleName.moduleNameLower}.ts` },
    { stub: 'composable.stub',    output: `composables/use${moduleName.moduleName}Helpers.ts` },
    { stub: 'components/List.stub',      output: `views/${moduleName.moduleName}List.vue` },
    { stub: 'components/Add.stub',       output: `views/${moduleName.moduleName}Add.vue` },
    { stub: 'components/Edit.stub',      output: `views/${moduleName.moduleName}Edit.vue` },
    { stub: 'components/Delete.stub',    output: `views/${moduleName.moduleName}Delete.vue` },
    { stub: 'components/view.stub',      output: `views/${moduleName.moduleName}View.vue` },
    { stub: 'components/ViewDialog.stub',output: `components/${moduleName.moduleName}ViewDialog.vue` },
    { stub: 'components/Table.stub',     output: `components/${moduleName.moduleName}Table.vue` },
    { stub: 'components/Filters.stub',   output: `components/${moduleName.moduleName}Filters.vue` },
    { stub: 'components/AccountTab.stub',output: `components/${moduleName.moduleName}AccountTab.vue` },
    { stub: 'components/BioPanel.stub',  output: `components/${moduleName.moduleName}BioPanel.vue` },
    { stub: 'test.stub',          output: `tests/${moduleName.moduleNameLower}.test.ts` },
  ];

  // Crea cada archivo a partir del stub
  filesToGenerate.forEach(({ stub, output }) => {
    const stubContent = readStub(stub, moduleName.moduleName);
    const content = replaceVariables(stubContent, moduleName);
    createFile(path.join(modulePath, output), content);
  });

  console.log(chalk.green(`Módulo ${moduleName.moduleName} generado correctamente.`));

  // Simula (o ejecuta) pruebas
  console.log(chalk.yellow('Ejecutando pruebas del módulo...'));
  try {
    // Descomenta si quieres realmente ejecutar las pruebas:
    // import { execSync } from 'child_process';
    // execSync(`pnpm vitest run ${modulePath}/tests/${moduleName.moduleNameLower}.test.ts`, { stdio: 'inherit' });
    console.log(chalk.green('Pruebas ejecutadas con éxito.'));
  } catch (err) {
    console.error(chalk.red('Algunas pruebas fallaron:'), err.message);
  }
}

/**
 * Devuelve la lista de módulos (carpetas) existentes en MODULES_PATH.
 */
export async function listModules() {
  return fs
    .readdirSync(MODULES_PATH)
    .filter((file) => fs.statSync(path.join(MODULES_PATH, file)).isDirectory());
}
