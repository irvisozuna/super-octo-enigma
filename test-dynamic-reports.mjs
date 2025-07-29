import { generateFromSpec } from './scripts/generateModule/specGenerator.mjs'

// Generar el módulo desde la especificación
await generateFromSpec('specs/dynamic-reports.json')
