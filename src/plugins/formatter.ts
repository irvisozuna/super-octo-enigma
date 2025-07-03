import { App } from 'vue';

function formatCurrency(value: number | string) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

function formatDate(dateString: string, format: Intl.DateTimeFormatOptions = { 
  day: '2-digit', month: '2-digit', year: 'numeric' 
}) {
  // Reemplazar espacio por 'T' para hacerla compatible con `Date`
  const normalizedDateString = dateString.replace(" ", "T");
  const date = new Date(normalizedDateString);
  
  if (isNaN(date.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat('es-MX', format).format(date);
}

export default function (app: App) {
  // Asignamos la función a las propiedades globales:
  app.config.globalProperties.$formatCurrency = formatCurrency;
  app.config.globalProperties.$formatDate = formatDate;
}
