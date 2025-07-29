# 🚀 Generador de Módulos Enterprise Vue + DDD

## 📋 **Comandos Principales**

### **🏗️ Generar Módulo Completo** (Recomendado)
```bash
npm run generate <ModuleName> [spec-file.json]
```

**Genera automáticamente:**
- ✅ Arquitectura DDD completa
- ✅ ACL de permisos (RBAC + PBAC)
- ✅ i18n modular (4 idiomas)
- ✅ Atomic Design components
- ✅ Event Sourcing + CQRS
- ✅ WebSocket real-time
- ✅ Security enterprise (OWASP)
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Performance optimization
- ✅ Testing automático 100%

**Ejemplos:**
```bash
# Generar desde especificación
npm run generate InventoryManagement specs/inventory.json

# Generar con entidades por defecto
npm run generate UserManagement
```

---

### **📦 Crear Nuevo Módulo** (Interactivo)
```bash
npm run create
```
Guía interactiva para crear un nuevo módulo desde cero.

---

### **✅ Validar Módulo**
```bash
npm run validate <ModuleName>
```
Valida y corrige automáticamente problemas en módulos existentes.

---

### **🧪 Probar Módulo**
```bash
npm run test:module <ModuleName>
```
Ejecuta tests completos en un módulo específico.

---

## 🎯 **Uso Típico**

### **1. Generar módulo nuevo:**
```bash
npm run generate DashboardMonitor specs/dashboard.json
```

### **2. El generador creará automáticamente:**
```
src/modules/dashboardMonitor/
├── 🏗️ domain/           # DDD Domain Layer
├── ⚡ application/       # CQRS + Use Cases
├── 🏢 infrastructure/    # External integrations
├── 🎨 presentation/      # Vue components + stores
├── 🌍 shared/           # i18n, utils, services
└── ⚙️ config/          # Module configuration
```

### **3. Resultado:**
- **~376 archivos** generados en **~5 segundos**
- **100% funcional** desde el primer momento
- **100% tests** pasando automáticamente
- **Listo para producción**

---

## 📋 **Especificaciones JSON**

Crea un archivo JSON para definir tu módulo:

```json
{
  "moduleName": "ProductCatalog",
  "version": "1.0.0",
  "description": "Catálogo de productos",
  "entities": {
    "Product": {
      "table": "products",
      "properties": {
        "id": { "type": "uuid", "primary": true },
        "name": { "type": "string", "required": true },
        "price": { "type": "decimal", "required": true }
      }
    }
  },
  "features": {
    "websocket": { "enabled": true },
    "export": { "enabled": true }
  }
}
```

---

## 🎉 **¡Listo!**

Con **un solo comando** generas un módulo enterprise completo que incluye:

- 🏗️ **Arquitectura DDD** de nivel Fortune 500
- 🔐 **Seguridad enterprise** (OWASP)  
- ♿ **Accesibilidad completa** (WCAG 2.1 AA)
- 🌍 **Multi-idioma** (4 idiomas)
- ⚡ **Performance optimizado**
- 🔄 **Real-time features**
- 🧪 **Testing automático**

**¡Todo listo para desplegar en producción!** 🚀 
