// scripts/generateModule.mjs
import chalk from 'chalk';
import inquirer from 'inquirer';
import { deleteModule, generateModule, listModules } from './generator.mjs';
import { normalizeModuleName } from './helpers.mjs';

async function mainMenu() {
  // Preguntamos por la acción a realizar
const answers = await inquirer.prompt([
    {
        type: 'list',
        name: 'action',
        message: '¿Qué acción deseas realizar?',
        choices: [
            { name: 'Generar',   value: 'n' },
            { name: 'Regenerar', value: 'r' },
            { name: 'Eliminar',  value: 'd' },
            { name: 'Cancelar',  value: 'c' },
        ],
    },
    {
        type: 'input',
        name: 'moduleName',
        message: 'Nombre del módulo:',
        validate: (input) => (input ? true : 'El nombre del módulo es obligatorio.'),
        when: (prev) => prev.action === 'n',
    },
    {
        type: 'list',
        name: 'moduleName',
        message: 'Selecciona el módulo:',
        choices: async () => await listModules(),
        when: (prev) => prev.action === 'r' || prev.action === 'd',
    },
    {
        type: 'confirm',
        name: 'confirmAction',
        message: (prev) => `¿Estás seguro de que deseas ${prev.action === 'r' ? 'regenerar' : 'eliminar'} el módulo ${prev.moduleName}?`,
        when: (prev) => prev.action === 'r' || prev.action === 'd',
    }
], {
    onCancel: () => {
        console.log(chalk.yellow('Operación cancelada.'));
        process.exit(0);
    }
});

  // Si cancela
  if (answers.action === 'c' || (answers.action !== 'n' && !answers.confirmAction)) {
    console.log(chalk.yellow('Operación cancelada.'));
    return;
  }

  // Normalizamos el nombre
  const normalizedName = normalizeModuleName(answers.moduleName);

  // Lógica según la acción
  if (answers.action === 'n') {
    await generateModule(normalizedName);
  } else if (answers.action === 'r') {
    await generateModule(normalizedName, true);
  } else if (answers.action === 'd') {
    deleteModule(normalizedName);
  }

  // Preguntamos si se quiere hacer algo más
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

// Ejecutamos el menú principal
mainMenu();
