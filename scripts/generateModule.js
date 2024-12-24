const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Carga la configuración centralizada
const config = require('./config/generateModuleConfig');

const STUBS_PATH = path.resolve(__dirname, config.stubsPath);
const MODULES_PATH = path.resolve(__dirname, config.modulesPath);

// Validar que `inquirer` esté instalado
function validateInquirer() {
  try {
    require.resolve('inquirer');
    return true;
  } catch (error) {
    return false;
  }
}

// Instalar inquirer usando pnpm
function installInquirer() {
  console.log('El paquete "inquirer" no está instalado.');
  const userInput = require('readline-sync').question(
    '¿Deseas instalar "inquirer" usando pnpm? (y/n): '
  );
  if (userInput.toLowerCase() === 'y') {
    console.log('Instalando "inquirer"...');
    try {
      execSync('pnpm add inquirer', { stdio: 'inherit' });
      console.log('Inquirer instalado correctamente.');
    } catch (error) {
      console.error('Hubo un error al instalar inquirer:', error);
      process.exit(1);
    }
  } else {
    console.error('No se puede continuar sin instalar "inquirer".');
    process.exit(1);
  }
}

// Verificar si `inquirer` está instalado
if (!validateInquirer()) {
  installInquirer();
}

const inquirer = require('inquirer'); // Importar inquirer después de asegurarse de que está instalado

// Leer el contenido de un archivo de plantilla (stub)
function readStub(stubFileName, moduleName) {
  const moduleSpecificPath = path.join(STUBS_PATH, moduleName.toLowerCase());
  const defaultStubPath = path.join(STUBS_PATH, 'defaults');
  const stubPath = fs.existsSync(moduleSpecificPath)
    ? path.join(moduleSpecificPath, stubFileName)
    : path.join(defaultStubPath, stubFileName);

  if (!fs.existsSync(stubPath)) {
    console.error(`Plantilla no encontrada: ${stubFileName}`);
    process.exit(1);
  }
  return fs.readFileSync(stubPath, 'utf8');
}

// Reemplazar variables en el contenido de las plantillas
function replaceVariables(content, variables) {
  let result = content;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  return result;
}

// Crear un archivo, generando las carpetas necesarias si no existen
function createFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Carpeta creada: ${dir}`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Archivo creado: ${filePath}`);
}

// Validar que existan todas las plantillas necesarias
function validateStubs(requiredStubs) {
  requiredStubs.forEach((stub) => {
    const stubPath = path.join(STUBS_PATH, 'defaults', stub);
    if (!fs.existsSync(stubPath)) {
      console.error(`Falta la plantilla: ${stubPath}`);
      process.exit(1);
    }
  });
}

// Generar los archivos base del módulo
function generateModule(moduleName) {
  const modulePath = path.join(MODULES_PATH, moduleName.toLowerCase());
  if (fs.existsSync(modulePath)) {
    console.error(`El módulo ${moduleName} ya existe.`);
    return;
  }

  // Variables para reemplazar en las plantillas
  const variables = {
    moduleName,
    moduleNameLower: moduleName.toLowerCase(),
    moduleNameUpper: moduleName.toUpperCase(),
  };

  // Crear las carpetas necesarias
  const subfolders = ['components', 'composables', 'stores', 'types'];
  subfolders.forEach((subfolder) => {
    const subfolderPath = path.join(modulePath, subfolder);
    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath, { recursive: true });
      console.log(`Carpeta creada: ${subfolderPath}`);
    }
  });

  // Archivos a generar
  const filesToGenerate = [
    { stub: 'vue.stub', output: `${moduleNameLower}.vue` },
    { stub: 'routes.stub', output: 'routes.ts' },
    { stub: 'store.stub', output: `stores/${moduleNameLower}Store.ts` },
    { stub: 'type.stub', output: `types/${moduleNameLower}.ts` },
    { stub: 'composable.stub', output: `composables/use${moduleName}Helpers.ts` },
    { stub: 'components/AddDialog.stub', output: `components/${moduleName}AddDialog.vue` },
    { stub: 'components/EditDialog.stub', output: `components/${moduleName}EditDialog.vue` },
    { stub: 'components/DeleteDialog.stub', output: `components/${moduleName}DeleteDialog.vue` },
    { stub: 'components/ViewDialog.stub', output: `components/${moduleName}ViewDialog.vue` },
    { stub: 'components/Table.stub', output: `components/${moduleName}Table.vue` },
    { stub: 'components/Filters.stub', output: `components/${moduleName}Filters.vue` },
    { stub: 'components/List.stub', output: `components/${moduleName}List.vue` },
  ];

  filesToGenerate.forEach(({ stub, output }) => {
    const stubContent = readStub(stub, moduleName);
    const content = replaceVariables(stubContent, variables);
    createFile(path.join(modulePath, output), content);
  });

  console.log(`Módulo ${moduleName} generado correctamente.`);
}

// Crear los stubs base si no existen
function createDefaultStubs() {
  const defaultStubs = {
    'defaults/vue.stub': '<template></template>\n<script setup></script>',
    'defaults/routes.stub': 'export default [];',
    'defaults/store.stub': 'export const useStore = () => ({});',
    'defaults/type.stub': 'export interface Type {};',
    'defaults/composable.stub': 'export const useHelpers = () => ({});',
    'defaults/components/AddDialog.stub': '<template></template>',
    // Agregar más plantillas según sea necesario
  };

  Object.entries(defaultStubs).forEach(([filePath, content]) => {
    const fullPath = path.join(STUBS_PATH, filePath);
    if (!fs.existsSync(fullPath)) {
      createFile(fullPath, content);
    }
  });

  console.log('Plantillas por defecto generadas correctamente.');
}

// CLI interactivo
inquirer
  .prompt([
    {
      type: 'list',
      name: 'action',
      message: '¿Qué acción deseas realizar?',
      choices: [
        { name: 'Generar un módulo', value: 'generate' },
        { name: 'Crear plantillas base (stubs)', value: 'createStubs' },
      ],
    },
    {
      type: 'input',
      name: 'moduleName',
      message: 'Nombre del módulo:',
      when: (answers) => answers.action === 'generate',
      validate: (input) => (input ? true : 'El nombre del módulo es obligatorio.'),
    },
  ])
  .then((answers) => {
    if (answers.action === 'generate') {
      generateModule(answers.moduleName);
    } else if (answers.action === 'createStubs') {
      createDefaultStubs();
    }
  });
