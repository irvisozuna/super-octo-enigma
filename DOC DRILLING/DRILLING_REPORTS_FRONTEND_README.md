# 📘 GUÍA COMPLETA - DRILLING REPORTS FRONTEND

**Para**: Equipo de Desarrollo Frontend  
**Fecha**: 2025-10-15  
**Estado**: ✅ Listo para Implementar

---

## 📋 DOCUMENTACIÓN DISPONIBLE

Esta carpeta contiene **4 documentos** que cubren TODA la especificación del módulo de Reportes de Perforación:

### 📄 **Parte 1: Arquitectura y Endpoints Básicos**
**Archivo**: `DRILLING_REPORTS_FRONTEND_SPEC.md`

**Contenido**:
1. ✅ Contexto de negocio completo
2. ✅ Actores y roles del sistema
3. ✅ Ciclo de vida de un reporte
4. ✅ Base URL y autenticación
5. ✅ Endpoints 1-4:
   - GET /reports (listar)
   - POST /reports (crear)
   - GET /reports/{id} (detalle)
   - PUT /reports/{id} (actualizar)

**Lee este primero** para entender el contexto y los endpoints básicos.

---

### 📄 **Parte 2: Endpoints de Acciones y Flujo de Trabajo**
**Archivo**: `DRILLING_REPORTS_FRONTEND_SPEC_PART2.md`

**Contenido**:
1. ✅ Endpoints 5-12:
   - POST /add-activity
   - POST /record-consumption
   - POST /assign-tool
   - POST /complete
   - POST /approve
   - POST /reject
   - POST /sign
   - DELETE (eliminar)
2. ✅ Flujo de trabajo completo paso a paso
3. ✅ Diagramas de flujo con ASCII art

**Lee este después** para entender cómo funcionan las acciones específicas.

---

### 📄 **Parte 3: UI/UX y Modelos de Datos**
**Archivo**: `DRILLING_REPORTS_FRONTEND_SPEC_PART3.md`

**Contenido**:
1. ✅ 4 Pantallas principales con layouts detallados
2. ✅ Componentes React sugeridos
3. ✅ Modelos de datos TypeScript completos
4. ✅ Validaciones frontend exhaustivas con Yup
5. ✅ Estados y transiciones

**Lee este para implementar** los componentes y validaciones.

---

### 📄 **Parte 4: Casos de Uso y Criterios de Aceptación**
**Archivo**: `DRILLING_REPORTS_FRONTEND_SPEC_PART4.md`

**Contenido**:
1. ✅ 5 Casos de uso detallados con flujos alternativos
2. ✅ Especificaciones de UI/UX (colores, tipografía)
3. ✅ Sistema de mensajes y notificaciones
4. ✅ Permisos y roles (matriz completa)
5. ✅ 8 Criterios de aceptación
6. ✅ Estimación de esfuerzo (31 días / 1 dev)
7. ✅ Checklist de implementación

**Lee este para QA** y validar que todo funcione correctamente.

---

## 🎯 ORDEN DE LECTURA RECOMENDADO

### Para **Product Owner / Project Manager**:
1. 📄 Parte 1 - Contexto de negocio
2. 📄 Parte 2 - Flujo de trabajo
3. 📄 Parte 4 - Criterios de aceptación

### Para **Desarrollador Frontend**:
1. 📄 Parte 1 - Contexto y endpoints básicos
2. 📄 Parte 3 - UI/UX y modelos de datos
3. 📄 Parte 2 - Endpoints de acciones
4. 📄 Parte 4 - Casos de uso

### Para **QA / Tester**:
1. 📄 Parte 1 - Contexto de negocio
2. 📄 Parte 2 - Flujo de trabajo
3. 📄 Parte 4 - Casos de uso y criterios

### Para **Diseñador UI/UX**:
1. 📄 Parte 3 - Pantallas y componentes
2. 📄 Parte 4 - Especificaciones UI/UX

---

## 📊 RESUMEN EJECUTIVO

### ¿Qué es este módulo?

Un sistema para registrar y gestionar **Reportes Diarios de Perforación de Pozos**, donde los operadores de campo documentan:
- ✅ Actividades realizadas
- ✅ Personal asignado
- ✅ Herramientas y equipos utilizados
- ✅ Materiales consumidos
- ✅ Progreso de perforación (metros)
- ✅ Horas trabajadas

### Flujo Principal (Simplificado)

```
1. OPERADOR → Crea reporte (DRAFT)
2. OPERADOR → Agrega actividades, consumos, herramientas
3. OPERADOR → Completa reporte → Firma (COMPLETED)
4. SUPERVISOR → Revisa reporte
5. SUPERVISOR → Firma y Aprueba (APPROVED)
   O
   SUPERVISOR → Rechaza con motivo (REJECTED)
6. Si rechazado → OPERADOR corrige → Repite desde paso 3
```

### Tecnologías Recomendadas

**Core**:
- React 18+ con TypeScript
- React Router v6
- React Query (TanStack Query)
- Axios

**Formularios**:
- Formik + Yup

**UI**:
- Tailwind CSS
- React Signature Canvas
- React Datepicker
- React Select
- React Toastify

**Utilidades**:
- date-fns
- html2pdf (para exportar)

---

## 🚀 QUICK START

### 1. Setup Inicial

```bash
# Clonar repositorio (si aplica)
git clone <repo-url>
cd frontend

# Instalar dependencias
npm install

# Instalar dependencias específicas del módulo
npm install react-query formik yup react-signature-canvas \
  react-datepicker react-select react-toastify date-fns \
  html2pdf.js axios
```

### 2. Configurar Variables de Entorno

```env
# .env.local
REACT_APP_API_URL=https://api.tudominio.com
REACT_APP_COMPANY_ID=uuid-de-tu-empresa
```

### 3. Crear Servicio de API

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Company-Id': process.env.REACT_APP_COMPANY_ID
  }
});

// Interceptor para agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### 4. Implementar Primer Endpoint

```typescript
// src/features/drilling-reports/services/drillingReportService.ts
import apiClient from '@/api/client';
import { DrillingReport } from '../types';

export const drillingReportService = {
  async getReports(params: any) {
    const response = await apiClient.get('/drilling/reports', { params });
    return response.data;
  },

  async getReportById(id: string) {
    const response = await apiClient.get(`/drilling/reports/${id}`);
    return response.data.data;
  },

  async createReport(data: any) {
    const response = await apiClient.post('/drilling/reports', data);
    return response.data.data;
  }
};
```

### 5. Crear Primer Componente

```typescript
// src/features/drilling-reports/components/StatusBadge.tsx
import React from 'react';

type ReportStatus = 'draft' | 'completed' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: ReportStatus;
}

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: '#FCD34D', bg: '#FEF3C7', icon: '✏️' },
  completed: { label: 'Completado', color: '#60A5FA', bg: '#DBEAFE', icon: '📝' },
  approved: { label: 'Aprobado', color: '#34D399', bg: '#D1FAE5', icon: '✅' },
  rejected: { label: 'Rechazado', color: '#F87171', bg: '#FEE2E2', icon: '❌' }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.icon} {config.label}
    </span>
  );
};
```

---

## 📈 ESTIMACIÓN Y PLANIFICACIÓN

### Esfuerzo Total: **31 días (1 desarrollador full-time)**

| Fase | Días | Descripción |
|------|------|-------------|
| **Fase 1**: Setup | 2 | Configuración inicial y estructura |
| **Fase 2**: Servicios | 2 | API services y hooks |
| **Fase 3**: Componentes Base | 3 | Componentes reutilizables |
| **Fase 4**: Lista Reportes | 2 | Pantalla principal con filtros |
| **Fase 5**: Crear/Editar | 3 | Formulario principal |
| **Fase 6**: Vista Detallada | 3 | Tabs y detalles completos |
| **Fase 7**: Formularios Acción | 5 | Modals de actividades, consumos, herramientas |
| **Fase 8**: Completar/Firmar | 3 | Wizard y firma digital |
| **Fase 9**: Aprobar/Rechazar | 3 | Acciones de supervisor |
| **Fase 10**: Testing | 5 | Pruebas y ajustes |

### Con 2 Desarrolladores: **~16 días**

---

## ✅ CRITERIOS DE ACEPTACIÓN (Resumen)

1. ✅ Puedo crear un reporte con todos los campos requeridos
2. ✅ Las validaciones muestran errores claros en tiempo real
3. ✅ Puedo agregar múltiples actividades sin exceder 24h por turno
4. ✅ Al asignar herramienta, veo su capacidad restante
5. ✅ No puedo asignar herramientas sin capacidad suficiente
6. ✅ Puedo completar el reporte y firmarlo digitalmente
7. ✅ Como supervisor, puedo aprobar o rechazar reportes
8. ✅ Los reportes rechazados pueden editarse nuevamente
9. ✅ Los reportes aprobados son de solo lectura
10. ✅ Los permisos se respetan según el rol del usuario
11. ✅ La interfaz es responsive (desktop, tablet, móvil)
12. ✅ Las notificaciones se muestran correctamente

---

## 🔗 ENDPOINTS RÁPIDOS (Para Postman)

```
Base URL: https://api.tudominio.com/api/drilling/reports

Headers:
  Authorization: Bearer {token}
  X-Company-Id: {uuid}
  Content-Type: application/json

GET    /                      - Listar reportes
POST   /                      - Crear reporte
GET    /{id}                  - Ver detalle
PUT    /{id}                  - Actualizar
DELETE /{id}                  - Eliminar (solo draft)
POST   /{id}/add-activity     - Agregar actividad
POST   /{id}/record-consumption - Registrar consumo
POST   /{id}/assign-tool      - Asignar herramienta
POST   /{id}/complete         - Completar reporte
POST   /{id}/approve          - Aprobar reporte
POST   /{id}/reject           - Rechazar reporte
POST   /{id}/sign             - Firmar reporte
```

---

## 💡 TIPS Y MEJORES PRÁCTICAS

### 1. Manejo de Estados
```typescript
// Usar React Query para caché y sincronización
const { data: reports, isLoading } = useQuery(
  ['reports', filters],
  () => drillingReportService.getReports(filters),
  { staleTime: 30000 }  // 30 segundos
);
```

### 2. Validación Optimista
```typescript
// Actualizar UI inmediatamente mientras se guarda en servidor
const mutation = useMutation(
  drillingReportService.addActivity,
  {
    onMutate: async (newActivity) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries(['report', reportId]);
      
      // Guardar snapshot
      const previousReport = queryClient.getQueryData(['report', reportId]);
      
      // Actualizar optimísticamente
      queryClient.setQueryData(['report', reportId], (old) => ({
        ...old,
        activities: [...old.activities, newActivity]
      }));
      
      return { previousReport };
    },
    onError: (err, newActivity, context) => {
      // Revertir en caso de error
      queryClient.setQueryData(['report', reportId], context.previousReport);
    }
  }
);
```

### 3. Debounce en Búsquedas
```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 500);

useEffect(() => {
  // Solo hace la búsqueda después de 500ms sin escribir
  fetchReports({ search: debouncedSearch });
}, [debouncedSearch]);
```

### 4. Manejo de Errores Global
```typescript
// Interceptor de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('No tienes permiso para esta acción');
    } else {
      toast.error(error.response?.data?.message || 'Error inesperado');
    }
    return Promise.reject(error);
  }
);
```

---

## 🆘 SOPORTE

### ¿Tienes dudas?

1. **Primero**: Revisa los 4 documentos en orden
2. **Segundo**: Busca en el documento específico (Ctrl+F)
3. **Tercero**: Contacta al equipo:
   - 📧 Email: backend-team@empresa.com
   - 💬 Slack: #drilling-reports-dev
   - 📅 Daily Standup: Lunes-Viernes 9:00 AM

### Reportar Problemas

Si encuentras errores o inconsistencias en la documentación:
1. Crea un issue en el repositorio
2. Incluye:
   - 📄 Documento afectado
   - 📍 Sección específica
   - 🐛 Descripción del problema
   - 💡 Sugerencia (opcional)

---

## 📚 RECURSOS ADICIONALES

### Documentación de Backend
- ✅ `DRILLING_REPORTS_FINAL_10_10_REPORT.md` - Reporte técnico del backend
- ✅ `DRILLING_REPORTS_IMPLEMENTATION_PLAN.md` - Plan de implementación
- ✅ `FINAL_CORRECTIONS_REPORT.md` - Correcciones finales

### Diagramas
Los diagramas de flujo están incluidos en:
- Parte 2: Flujo de trabajo completo
- Parte 4: Casos de uso detallados

### Ejemplos de Código
Todos los documentos incluyen:
- ✅ Ejemplos TypeScript
- ✅ Ejemplos de peticiones HTTP
- ✅ Ejemplos de validaciones
- ✅ Ejemplos de componentes React

---

## 🎯 PRÓXIMOS PASOS

### Esta Semana
1. [ ] Leer los 4 documentos completos
2. [ ] Configurar ambiente de desarrollo
3. [ ] Revisar mock-ups (si existen)
4. [ ] Agendar reunión de kick-off

### Próxima Semana
1. [ ] Implementar setup inicial (Fase 1)
2. [ ] Crear servicios de API (Fase 2)
3. [ ] Desarrollar componentes base (Fase 3)
4. [ ] Primera demo interna

---

## ✨ CONCLUSIÓN

**Tienes TODO lo que necesitas para implementar este módulo exitosamente:**

✅ **31 páginas** de especificación técnica  
✅ **12 endpoints** completamente documentados  
✅ **5 casos de uso** con flujos detallados  
✅ **4 pantallas principales** con layouts  
✅ **100+ validaciones** específicas  
✅ **8 criterios de aceptación** claros  
✅ **Estimación realista** de esfuerzo  
✅ **Ejemplos de código** funcionales  

**¡Estamos listos para comenzar! 🚀**

Si tienes alguna pregunta, no dudes en contactarnos.

---

*Generado por Backend Team - 2025-10-15*  
*Versión: 1.0*  
*Estado: ✅ Aprobado y Listo para Desarrollo*

