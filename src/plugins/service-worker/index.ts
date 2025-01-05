import type { App } from 'vue';

export default function (app: App) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registrado:', registration);
      })
      .catch((error) => {
        console.error('Error al registrar el Service Worker:', error);
      });

    // Escucha eventos de conexión recuperada para sincronizar datos
    window.addEventListener('online', async () => {
      console.log('Conexión recuperada. Sincronizando cola offline...');
      const { flushOfflineQueue } = await import('@/services/offlineQueueService');
      await flushOfflineQueue(); // Sincroniza la cola
    });
  }
}
