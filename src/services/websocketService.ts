import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance: Echo | null = null;

try {
  // Asegúrate de que Pusher esté disponible globalmente
  window.Pusher = Pusher;

  // Inicializar Laravel Echo
  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
  });
} catch (error) {
  console.error('Error al inicializar Laravel Echo:', error);
}

// Exportar la instancia (puede ser null si no está configurado)
export const echo = echoInstance;
