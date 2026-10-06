import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'generate'

// Sujetos del módulo de reportes: gruesos a propósito (la granularidad por reporte la aplica el servidor)
export type SubjectsReportes = 'reportes' | 'tableros' | 'documentos' | 'reportes-admin' | 'reportes-fuentes'

export type Subjects = 'Post' | 'Comment' | 'all' | 'Users' | 'Profile' | 'Rebilling' | 'Evidence' | SubjectsReportes

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
