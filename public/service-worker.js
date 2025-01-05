self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activado');
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-queue') {
      event.waitUntil(syncOfflineQueue());
    }
  });
  
  async function syncOfflineQueue() {
    console.log('Sincronizando cola offline...');
    try {
      const db = await openDatabase();
      const queue = await db.transaction('offlineQueue', 'readonly').objectStore('offlineQueue').getAll();
  
      for (const operation of queue) {
        const { method, endpoint, payload } = operation;
        //eliminar del payload el id
        delete payload.id;
        // Realiza la operación
        await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        // Borra operación de la cola
        const tx = db.transaction('offlineQueue', 'readwrite');
        tx.objectStore('offlineQueue').delete(operation.id);
        await tx.complete;
      }
      console.log('Cola sincronizada exitosamente.');
    } catch (error) {
      console.error('Error al sincronizar la cola offline:', error);
    }
  }
  
  async function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('nubik', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  