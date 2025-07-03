import Dexie, { Table } from 'dexie';
import { tableConfigs } from './indexedDbTables';
import type { OfflineOperation } from './offlineQueueService';

/**
 * Clase principal de la base de datos.  
 * Aquí, además de las tablas dinámicas que vienen de `tableConfigs`,
 * agregamos la tabla "offlineQueue" para almacenar operaciones pendientes.
 */
export class AppDatabase extends Dexie {
  // Con Dexie, puedes tipar cada tabla para facilitar el autocompletado
  // Ej.: offlineQueue!: Table<OfflineOperation, number>;

  // Si quieres tipar cada tabla dinámica, tendrías que hacerlo
  // de forma genérica. Aquí, al menos, tipamos offlineQueue.
  public offlineQueue!: Table<OfflineOperation, number>;

  constructor() {
    super('nibuk'); // Nombre de la base de datos
    this.initializeTables();
  }

  initializeTables() {
    // 1. Construimos el schema que viene de tus módulos
    const schema: { [tableName: string]: string } = {};

    tableConfigs.forEach((config) => {
      if (config?.tableName && config?.schema) {
        // Ej.: schema['users'] = 'id, name, email'
        schema[config.tableName] = config.schema;
      } else {
        console.warn(`Configuración de tabla inválida:`, config);
      }
    });

    // 2. Agregamos la definición para la tabla offlineQueue
    //    Si no existía, la creamos.
    //    '++id' => autoincrement, y luego las demás claves de índice
    schema.offlineQueue = '++id, storeId, type, itemId, createdAt';

    if (Object.keys(schema).length === 0) {
      console.error('No se encontraron configuraciones de tablas. Verifica los módulos.');
    } else {
      // console.log('Esquema de IndexedDB aplicado:', schema);
    }

    // 3. Define las tablas en una versión concreta (por ejemplo, 1)
    //    Si en producción ya tienes "version(1)", deberías usar
    //    "version(2)" con una función upgrade(...).
    this.version(1).stores(schema);

    // Opcional: si quieres tipar la tabla offlineQueue (para autocompletado)
    this.offlineQueue = this.table('offlineQueue');
  }
}

// Exporta una instancia única de la base de datos
export const db = new AppDatabase();
