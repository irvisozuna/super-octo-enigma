#!/usr/bin/env node
/**
 * Revisión de accesibilidad (WCAG 2.1 AA) de las pantallas del sistema de diseño con axe-core, inyectado desde CDN en
 * la página abierta con Playwright y la sesión local por token (mismas variables que capturas.mjs).
 *
 *   DS_CANAL=chrome DS_TOKEN_FILE=… node tests/visual/accesibilidad.mjs --solo monitor,alertas
 *
 * Imprime las violaciones por impacto y nodo; termina con código 1 si hay violaciones serias o críticas.
 */
import fs from 'node:fs'
import process from 'node:process'
import { chromium } from 'playwright'

const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map(s => s.trim().split(/\s+/)))
const baseUrl = process.env.DS_BASE_URL ?? 'http://localhost:5173'
const apiUrl = process.env.DS_API_URL ?? 'http://localhost:8090/api'
const token = process.env.DS_TOKEN ?? (process.env.DS_TOKEN_FILE ? fs.readFileSync(process.env.DS_TOKEN_FILE, 'utf8').trim() : null)
const solo = args.solo ? String(args.solo).split(',') : null
const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js'

if (!token) {
  console.error('Falta DS_TOKEN o DS_TOKEN_FILE.')
  process.exit(1)
}

const PANTALLAS = [
  { id: 'monitor-hoy', ruta: '/monitoreo?dia=2026-09-15&periodo=185', espera: 6000 },
  { id: 'monitor-detalle-lectura', ruta: '/monitoreo?vista=periodo&periodo=186&sector=330&contrato=40350', espera: 6000 },
  { id: 'alertas', ruta: '/monitoreo/alertas', espera: 4000 },
  { id: 'guia-ds', ruta: '/_ds', espera: 3000 },
]

async function iniciarSesion(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })

  const cabeceras = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  const sesion = await (await fetch(`${apiUrl}/auth/user`, { headers: cabeceras })).json()
  const habilidades = await fetch(`${apiUrl}/reporting/me/abilities`, { headers: cabeceras }).then(r => r.json()).catch(() => ({}))
  const cookies = { accessToken: token, userData: sesion.user, userAbilityRules: [...(sesion.userAbilityRules ?? []), ...(habilidades.userAbilityRules ?? [])], profile: sesion.profile, company: sesion.company }

  await page.evaluate(c => {
    for (const [k, v] of Object.entries(c))
      document.cookie = `${k}=${encodeURIComponent(JSON.stringify(v))}; path=/`
  }, cookies)
}

async function main() {
  const navegador = await chromium.launch(process.env.DS_CANAL ? { channel: process.env.DS_CANAL } : {})
  const context = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-MX' })
  const page = await context.newPage()

  await iniciarSesion(page)

  let graves = 0
  for (const pantalla of PANTALLAS.filter(p => !solo || solo.some(s => p.id.includes(s)))) {
    await page.goto(`${baseUrl}${pantalla.ruta}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(pantalla.espera)
    await page.addScriptTag({ url: AXE })

    // Se excluye el lienzo del mapa (WebGL de terceros) y se evalúa el resto con las reglas WCAG 2.1 A/AA
    const resultado = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, exclude: [['.maplibregl-canvas-container'], ['.mapa-monitoreo__lienzo']] })
    })

    const violaciones = resultado.violations
    const porImpacto = violaciones.reduce((acc, v) => ({ ...acc, [v.impact]: (acc[v.impact] ?? 0) + v.nodes.length }), {})

    graves += (porImpacto.critical ?? 0) + (porImpacto.serious ?? 0)
    console.log(`\n${pantalla.id}: ${violaciones.length} reglas con violaciones · nodos por impacto ${JSON.stringify(porImpacto)} · ${resultado.passes.length} reglas cumplidas`)
    for (const v of violaciones) {
      console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`)
      for (const n of v.nodes.slice(0, 3))
        console.log(`      ${n.target.join(' ')}${n.failureSummary ? ` · ${n.failureSummary.split('\n')[1]?.trim() ?? ''}` : ''}`)
    }
  }
  await navegador.close()
  console.log(`\nNodos con violaciones serias o críticas: ${graves}`)
  process.exit(graves ? 1 : 0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
