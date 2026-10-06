import 'vue-router'
declare module 'vue-router' {
  interface RouteMeta {
    action?: string
    subject?: string
    layoutWrapperClasses?: string
    navActiveLink?: RouteLocationRaw
    layout?: 'blank' | 'default'
    unauthenticatedOnly?: boolean
    public?: boolean
  }
}
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_MAPBOX_KEY: string;
  readonly VITE_API_ORGANIZATION: string;
  readonly VITE_REPORTES_MOCK?: string; // 'true' activa los datos de ejemplo (MSW) del módulo de reportes
  // Añade otras variables de entorno que necesites aquí
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
