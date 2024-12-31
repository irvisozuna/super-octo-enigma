// scripts/config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Aquí defines lo que antes tenías en "config"
export const CONFIG = {
  stubsPath: 'stubs',       // Ruta relativa a la raíz del proyecto
  modulesPath: 'src/modules'
};

// Estas constantes resuelven las rutas absolutas.
export const STUBS_PATH = path.resolve(__dirname, '../', CONFIG.stubsPath);
export const MODULES_PATH = path.resolve(__dirname, '../', CONFIG.modulesPath);
