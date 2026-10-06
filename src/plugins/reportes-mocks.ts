// Datos de ejemplo del módulo de reportes (MSW) para trabajar sin backend.
// Solo en desarrollo y con VITE_REPORTES_MOCK=true en .env.local; el resto de peticiones pasan al servidor real.
export default function () {
  if (!import.meta.env.DEV || import.meta.env.VITE_REPORTES_MOCK !== 'true')
    return

  import('@/modules/reportes/mocks/browser').then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
}
