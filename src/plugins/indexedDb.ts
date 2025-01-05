import { db } from '@/services/indexedDbService';
import type { App } from 'vue';

export default function (app: App) {
  db.open()
    .then(() => {
      console.log('IndexedDB inicializado correctamente.');
      console.log('Tablas disponibles:', db.tables.map((table) => table.name));
    })
    .catch((err) => {
      console.error('Error inicializando IndexedDB:', err);
    });
}
