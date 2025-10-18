# Versiones del Diálogo de Creación de Reportes

Este módulo ofrece **DOS versiones** del diálogo de creación de reportes de perforación, cada una optimizada para diferentes casos de uso.

---

## 🧙‍♂️ **VERSIÓN ACTIVA: Wizard (CreateReportWizardOrganism.vue)**

### Características:
- ✅ **Wizard de 6 pasos** con navegación guiada
- ✅ **Auto-propagación de turno** a todas las secciones
- ✅ **Depth tracking automático** (continuidad de profundidad)
- ✅ **Horómetro auto-calculado** basado en horas trabajadas
- ✅ **Quick-add templates** para actividades comunes
- ✅ **Validación progresiva** paso a paso
- ✅ **Resumen visual** antes de guardar
- ✅ **Mobile-friendly** (un paso a la vez)

### Ventajas:
- Menor sobrecarga cognitiva
- Menos errores de captura
- Flujo guiado para usuarios nuevos
- Automatizaciones inteligentes

### Desventajas:
- Más clics para usuarios expertos (aunque más rápido por las automatizaciones)
- No puedes ver todos los datos de un vistazo

### Ideal para:
- ✅ Usuarios nuevos
- ✅ Captura de datos complejos
- ✅ Minimizar errores
- ✅ Uso en dispositivos móviles

---

## 📋 **VERSIÓN BACKUP: Linear (CreateReportDialogOrganism.vue.backup)**

### Características:
- ✅ **Expansion Panels** para secciones collapsables
- ✅ **Tablas inline editables** para actividades/consumos/herramientas
- ✅ **Vista completa** de todos los datos
- ✅ **Menos pasos** de navegación

### Ventajas:
- Todo visible de un vistazo
- Menos navegación entre pasos
- Mejor para usuarios expertos que saben exactamente qué capturar

### Desventajas:
- Puede ser abrumador para usuarios nuevos
- Más scroll horizontal/vertical
- Sin automatizaciones inteligentes
- Validaciones solo al final

### Ideal para:
- ✅ Usuarios expertos
- ✅ Revisión rápida de datos
- ✅ Pantallas grandes
- ✅ Cuando se prefiere ver todo junto

---

## 🔄 **Cómo Cambiar de Versión**

### Activar Versión Linear (Expansion Panels):

1. En `ProjectDetail.vue`, cambia el import:

```typescript
// COMENTAR WIZARD
// import CreateReportDialogOrganism from '../components/organisms/CreateReportWizardOrganism.vue'

// DESCOMENTAR LINEAR
import CreateReportDialogOrganism from '../components/organisms/CreateReportDialogOrganism.vue'
```

2. Restaura el archivo desde el backup:

```bash
cd src/modules/DrillingReportsModule/presentation/components/organisms
mv CreateReportDialogOrganism.vue.backup CreateReportDialogOrganism.vue
```

### Activar Versión Wizard (Actual):

1. En `ProjectDetail.vue`, cambia el import:

```typescript
// COMENTAR LINEAR
// import CreateReportDialogOrganism from '../components/organisms/CreateReportDialogOrganism.vue'

// DESCOMENTAR WIZARD
import CreateReportDialogOrganism from '../components/organisms/CreateReportWizardOrganism.vue'
```

---

## 📊 **Comparación Detallada**

| Característica | Wizard | Linear |
|----------------|--------|--------|
| **Pasos de navegación** | 6 pasos | 1 pantalla |
| **Auto-propagación de turno** | ✅ Sí | ❌ No |
| **Depth tracking automático** | ✅ Sí | ❌ No |
| **Horómetro auto-calculado** | ✅ Sí | ❌ No |
| **Quick-add templates** | ✅ Sí | ❌ No |
| **Validación en tiempo real** | ✅ Por paso | ⚠️ Solo final |
| **Vista completa de datos** | ❌ No | ✅ Sí |
| **Mobile UX** | ✅ Excelente | ⚠️ Regular |
| **Curva de aprendizaje** | ✅ Baja | ⚠️ Media |
| **Velocidad (usuarios expertos)** | ✅ Rápido (con automatizaciones) | ✅ Rápido (si conoces el flujo) |

---

## 💡 **Recomendaciones**

### Usa WIZARD si:
- Tienes usuarios con diferentes niveles de experiencia
- Quieres minimizar errores de captura
- La mayoría de tus usuarios usa móviles/tablets
- Prefieres un flujo guiado y estructurado
- Quieres aprovechar automatizaciones inteligentes

### Usa LINEAR si:
- Todos tus usuarios son expertos
- Necesitan ver todos los datos de un vistazo
- Trabajan principalmente en pantallas grandes
- Prefieren control total sin guías
- No les importa la repetición manual

---

## 🚀 **Versión Recomendada: WIZARD**

Por defecto, está activa la **versión Wizard** porque ofrece:
- Mejor UX general
- Menor tasa de errores
- Automatizaciones que ahorran tiempo
- Mejor experiencia mobile
- Validaciones progresivas

Ambas versiones generan el **mismo payload** hacia el backend, por lo que son completamente intercambiables sin afectar la lógica de negocio.

---

## 📝 **Notas Técnicas**

- Ambas versiones usan los mismos tipos TypeScript
- Ambas emiten el evento `submit` con la misma estructura de datos
- Las automatizaciones del Wizard NO afectan la flexibilidad:
  - Puedes cambiar manualmente cualquier valor auto-completado
  - Los valores sugeridos son solo defaults inteligentes

- El backup se mantiene para facilitar A/B testing o cambios futuros

---

**Última actualización:** Implementación inicial con ambas versiones
**Versión activa:** Wizard (CreateReportWizardOrganism.vue)
**Versión backup:** Linear (CreateReportDialogOrganism.vue.backup)
