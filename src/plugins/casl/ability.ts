import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'generate' | 'operate' | 'use'

// Sujetos del módulo de reportes: gruesos a propósito (la granularidad por reporte la aplica el servidor)
export type SubjectsReportes = 'reportes' | 'tableros' | 'documentos' | 'reportes-admin' | 'reportes-fuentes'

// Sujetos del monitoreo de lecturas: ver, operar (alertas, re-lecturas) y administrar; el alcance por gerencia lo aplica el servidor
export type SubjectsMonitoreo = 'monitoreo' | 'monitoreo-operar' | 'monitoreo-admin'

export type Subjects = 'Post' | 'Comment' | 'all' | 'Users' | 'Profile' | 'Rebilling' | 'Evidence' | 'asistente' | SubjectsReportes | SubjectsMonitoreo

// inverted: regla "no puede" (con el asistente apagado, admin recibe "manage all" y "no use asistente")
export interface Rule { action: Actions; subject: Subjects; inverted?: boolean }

export const ability = createMongoAbility<[Actions, Subjects]>()
