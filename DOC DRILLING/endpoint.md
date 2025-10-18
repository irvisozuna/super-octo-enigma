📊 RESUMEN FINAL DE ENDPOINTS
🏗️ PROJECTS API - 20 endpoints
GET    /api/drilling/projects                    # Listar proyectos
POST   /api/drilling/projects                    # Crear proyecto
GET    /api/drilling/projects/{id}               # Ver proyecto
PUT    /api/drilling/projects/{id}               # Actualizar proyecto
DELETE /api/drilling/projects/{id}               # Eliminar proyecto
POST   /api/drilling/projects/{id}/start         # Iniciar proyecto
POST   /api/drilling/projects/{id}/complete      # Completar proyecto
POST   /api/drilling/projects/{id}/suspend       # Suspender proyecto
POST   /api/drilling/projects/{id}/cancel        # Cancelar proyecto
POST   /api/drilling/projects/{id}/resume        # Reanudar proyecto
POST   /api/drilling/projects/{id}/personnel     # Asignar personal
DELETE /api/drilling/projects/{id}/personnel/{employeeId} # Quitar personal
GET    /api/drilling/projects/{id}/personnel     # Ver personal
POST   /api/drilling/projects/{id}/costs         # Agregar costo
GET    /api/drilling/projects/{id}/costs         # Ver costos
PUT    /api/drilling/projects/{id}/budget        # Actualizar presupuesto
POST   /api/drilling/projects/{id}/wells         # Agregar pozo
DELETE /api/drilling/projects/{id}/wells/{wellId} # Quitar pozo
GET    /api/drilling/projects/{id}/wells         # Ver pozos
GET    /api/drilling/projects/{id}/status-history # Historial de estado

🕳️ WELLS API - 17 endpoints
GET    /api/drilling/tools                       # Listar herramientas
POST   /api/drilling/tools                       # Crear herramienta
GET    /api/drilling/tools/{id}                  # Ver herramienta
PUT    /api/drilling/tools/{id}                  # Actualizar herramienta
DELETE /api/drilling/tools/{id}                  # Eliminar herramienta
POST   /api/drilling/tools/{id}/assign           # Asignar herramienta
POST   /api/drilling/tools/{id}/return           # Devolver herramienta
POST   /api/drilling/tools/{id}/maintenance      # Enviar a mantenimiento
POST   /api/drilling/tools/{id}/maintenance/complete # Completar mantenimiento
POST   /api/drilling/tools/{id}/damage           # Reportar daño
POST   /api/drilling/tools/{id}/lost             # Reportar pérdida
POST   /api/drilling/tools/{id}/retire           # Retirar herramienta
GET    /api/drilling/tools/status/available       # Herramientas disponibles
GET    /api/drilling/tools/status/in-use          # Herramientas en uso
GET    /api/drilling/tools/maintenance/needed    # Herramientas que necesitan mantenimiento

📊 DRILLING REPORTS API - 12 endpoints
GET    /api/drilling/reports                     # Listar reportes
POST   /api/drilling/reports                     # Crear reporte
GET    /api/drilling/reports/{id}                # Ver reporte
DELETE /api/drilling/reports/{id}                # Eliminar reporte
POST   /api/drilling/reports/{id}/activities     # Agregar actividad
POST   /api/drilling/reports/{id}/consumptions   # Registrar consumo
POST   /api/drilling/reports/{id}/tool-assignments # Asignar herramienta
POST   /api/drilling/reports/{id}/complete       # Completar reporte
POST   /api/drilling/reports/{id}/approve        # Aprobar reporte
GET    /api/drilling/reports/by-project/{projectId} # Por proyecto
GET    /api/drilling/reports/by-well/{wellId}    # Por pozo
GET    /api/drilling/reports/pending-approval    # Pendientes de aprobación
