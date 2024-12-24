import { setupLayouts } from 'virtual:generated-layouts';
import { createRouter, createWebHistory } from 'vue-router/auto';
import { routes } from './additional-routes';
import { setupGuards } from './guards';

// Cargar rutas de módulos
const modules = import.meta.glob('@/modules/**/routes.ts', { eager: true });
const routesModules = Object.values(modules).flatMap((mod: any) => mod.default);

console.log("Rutas de módulos:", routesModules);

function recursiveLayouts(route: any): any {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i]);
    return route;
  }
  return setupLayouts([route])[0];
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 60 };
    return { top: 0 };
  },
  extendRoutes: pages => {
    const allRoutes = [...pages, ...routes, ...routesModules];
    console.log("Rutas combinadas:", allRoutes);
    return allRoutes.map(route => recursiveLayouts(route));
  },
});

setupGuards(router);

export { router };

export default function (app: any) {
  app.use(router);
}
