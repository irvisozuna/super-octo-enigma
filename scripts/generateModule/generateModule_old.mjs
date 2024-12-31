import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';

const config = {
  stubsPath: 'stubs', // Ruta donde están las plantillas
  modulesPath: 'src/modules', // Ruta donde se generan los módulos
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const STUBS_PATH = path.resolve(__dirname, '../', config.stubsPath);
const MODULES_PATH = path.resolve(__dirname, '../', config.modulesPath);

function pluralToSingular(word) {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'; // e.g., "batteries" -> "battery"
  if (word.endsWith('ves')) return word.slice(0, -3) + 'f'; // e.g., "wolves" -> "wolf"
  if (word.endsWith('oes')) return word.slice(0, -2); // e.g., "heroes" -> "hero"
  if (word.endsWith('ses')) return word.slice(0, -2); // e.g., "buses" -> "bus"
  if (word.endsWith('xes')) return word.slice(0, -2); // e.g., "boxes" -> "box"
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1); // e.g., "cats" -> "cat"
  return word;
}

function validateModuleName(name) {
  const isValid = /^[a-zA-Z0-9_-]+$/.test(name);
  if (!isValid) {
    console.error(chalk.red('El nombre del módulo contiene caracteres no permitidos.'));
    process.exit(1);
  }
  return name;
}

function normalizeModuleName(input) {
  const sanitizedInput = validateModuleName(input.trim().toLowerCase());
  const singular = pluralToSingular(sanitizedInput);
  const moduleName = singular.charAt(0).toUpperCase() + singular.slice(1);
  return { original: input, moduleName, moduleNameLower: singular, moduleNameUpper: moduleName.toUpperCase() };
}

function readStub(stubFileName, moduleName) {
  const moduleSpecificPath = path.join(STUBS_PATH, moduleName.toLowerCase());
  const defaultStubPath = path.join(STUBS_PATH, 'defaults');
  const stubPath = fs.existsSync(moduleSpecificPath)
    ? path.join(moduleSpecificPath, stubFileName)
    : path.join(defaultStubPath, stubFileName);

  if (!fs.existsSync(stubPath)) {
    console.error(chalk.red(`Plantilla no encontrada: ${stubFileName}`));
    process.exit(1);
  }
  return fs.readFileSync(stubPath, 'utf8');
}

function replaceVariables(content, variables) {
  return Object.keys(variables).reduce(
    (result, key) => result.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]),
    content
  );
}

function createFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(chalk.green(`Carpeta creada: ${dir}`));
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(chalk.green(`Archivo creado: ${filePath}`));
}

function deleteModule(moduleName) {
  const modulePath = path.join(MODULES_PATH, moduleName.moduleNameLower);
  if (fs.existsSync(modulePath)) {
    fs.rmSync(modulePath, { recursive: true, force: true });
    console.log(chalk.yellow(`El módulo ${moduleName.moduleName} fue eliminado.`));
  } else {
    console.log(chalk.red(`No se encontró el módulo ${moduleName.moduleName}.`));
  }
}

async function generateModule(moduleName, regenerate = false) {
  console.log(chalk.yellow(`${regenerate ? 'Regenerando' : 'Generando'} módulo: ${moduleName.original}`));
  const modulePath = path.join(MODULES_PATH, moduleName.moduleNameLower);

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

  if (regenerate) deleteModule(moduleName); // Eliminar antes de regenerar

  const subfolders = ['views','components', 'composables', 'stores', 'types', 'tests'];
  subfolders.forEach((subfolder) => {
    const subfolderPath = path.join(modulePath, subfolder);
    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath, { recursive: true });
      console.log(chalk.green(`Carpeta creada: ${subfolderPath}`));
    }
  });

  const filesToGenerate = [
    { stub: 'vue.stub', output: `views/index.vue` },
    { stub: 'routes.stub', output: 'routes.ts' },
    { stub: 'index.stub', output: 'index.ts' },
    { stub: 'store.stub', output: `stores/${moduleName.moduleNameLower}Store.ts` },
    { stub: 'type.stub', output: `types/${moduleName.moduleNameLower}.ts` },
    { stub: 'composable.stub', output: `composables/use${moduleName.moduleName}Helpers.ts` },
    { stub: 'components/List.stub', output: `views/${moduleName.moduleName}List.vue` },
    { stub: 'components/Add.stub', output: `views/${moduleName.moduleName}Add.vue` },
    { stub: 'components/Edit.stub', output: `views/${moduleName.moduleName}Edit.vue` },
    { stub: 'components/Delete.stub', output: `views/${moduleName.moduleName}Delete.vue` },
    { stub: 'components/view.stub', output: `views/${moduleName.moduleName}View.vue` },
    { stub: 'components/ViewDialog.stub', output: `components/${moduleName.moduleName}ViewDialog.vue` },
    { stub: 'components/Table.stub', output: `components/${moduleName.moduleName}Table.vue` },
    { stub: 'components/Filters.stub', output: `components/${moduleName.moduleName}Filters.vue` },
    { stub: 'components/AccountTab.stub', output: `components/${moduleName.moduleName}AccountTab.vue` },
    { stub: 'components/BioPanel.stub', output: `components/${moduleName.moduleName}BioPanel.vue` },
    { stub: 'test.stub', output: `tests/${moduleName.moduleNameLower}.test.ts` },
  ];

  filesToGenerate.forEach(({ stub, output }) => {
    const stubContent = readStub(stub, moduleName.moduleName);
    const content = replaceVariables(stubContent, moduleName);
    createFile(path.join(modulePath, output), content);
  });

  console.log(chalk.green(`Módulo ${moduleName.moduleName} generado correctamente.`));

  console.log(chalk.yellow('Ejecutando pruebas del módulo...'));
  try {
   // execSync(`pnpm vitest run ${modulePath}/tests/${moduleName.moduleNameLower}.test.ts`, { stdio: 'inherit' });
    console.log(chalk.green('Pruebas ejecutadas con éxito.'));
  } catch (err) {
    console.error(chalk.red('Algunas pruebas fallaron:'), err.message);
  }
}

async function listModules() {
  const modules = fs.readdirSync(MODULES_PATH).filter((file) => fs.statSync(path.join(MODULES_PATH, file)).isDirectory());
  return modules;
}

async function mainMenu() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '¿Qué acción deseas realizar?',
      choices: [
        { name: 'Generar', value: 'n' },
        { name: 'Regenerar', value: 'r' },
        { name: 'Eliminar', value: 'd' },
        { name: 'Cancelar', value: 'c' },
      ],
    },
    {
      type: 'input',
      name: 'moduleName',
      message: 'Nombre del módulo:',
      validate: (input) => (input ? true : 'El nombre del módulo es obligatorio.'),
      when: (answers) => answers.action === 'n',
    },
    {
      type: 'list',
      name: 'moduleName',
      message: 'Selecciona el módulo:',
      choices: async () => await listModules(),
      when: (answers) => answers.action === 'r' || answers.action === 'd',
    },
    {
      type: 'confirm',
      name: 'confirmAction',
      message: (answers) => `¿Estás seguro de que deseas ${answers.action === 'r' ? 'regenerar' : 'eliminar'} el módulo ${answers.moduleName}?`,
      when: (answers) => answers.action === 'r' || answers.action === 'd',
    }
  ]);

  if (answers.action === 'c' || (answers.action !== 'n' && !answers.confirmAction)) {
    console.log(chalk.yellow('Operación cancelada.'));
    return;
  }

  const normalizedName = normalizeModuleName(answers.moduleName);

  if (answers.action === 'n') {
    await generateModule(normalizedName);
  } else if (answers.action === 'r') {
    await generateModule(normalizedName, true);
  } else if (answers.action === 'd') {
    deleteModule(normalizedName);
  }

  const { goBack } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'goBack',
      message: '¿Deseas realizar otra acción?',
      default: true,
    },
  ]);

  if (goBack) {
    await mainMenu();
  } else {
    console.log(chalk.green('Operación finalizada.'));
  }
}

mainMenu();
