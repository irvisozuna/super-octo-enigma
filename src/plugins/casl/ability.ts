import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'generate' | 'operate'

// Sujetos del módulo de reportes: gruesos a propósito (la granularidad por reporte la aplica el servidor)
export type SubjectsReportes = 'reportes' | 'tableros' | 'documentos' | 'reportes-admin' | 'reportes-fuentes'

// Sujetos del monitoreo de lecturas: ver, operar (alertas, re-lecturas) y administrar; el alcance por gerencia lo aplica el servidor
export type SubjectsMonitoreo = 'monitoreo' | 'monitoreo-operar' | 'monitoreo-admin'

export type Subjects = 'Post' | 'Comment' | 'all' | 'Users' | 'Profile' | 'Rebilling' | 'Evidence' | SubjectsReportes | SubjectsMonitoreo

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
