import { App } from 'vue';

function formatCurrency(value: number | string) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

export default function (app: App) {
  // Asignamos la función a las propiedades globales:
  app.config.globalProperties.$formatCurrency = formatCurrency;
}
