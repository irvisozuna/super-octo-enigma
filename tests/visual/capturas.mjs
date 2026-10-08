#!/usr/bin/env node
/**
 * Capturas de referencia del sistema de diseño (Aquasoft Design System 1.0).
 *
 * Abre la aplicación en Chromium (Playwright), inicia sesión con el usuario local y guarda una captura a página completa
 * de cada pantalla, en uno o varios anchos. Se usa antes y después de cada fase para comparar.
 *
 *   DS_PASSWORD_FILE=/ruta/al/archivo node tests/visual/capturas.mjs --etiqueta base
 *   DS_PASSWORD=... node tests/visual/capturas.mjs --etiqueta despues --solo monitor,alertas
 *
 * Variables: DS_BASE_URL (http://localhost:5173), DS_API_URL (http://localhost:8090/api), DS_TOKEN o DS_TOKEN_FILE (token
 * local; recomendado), o bien DS_USUARIO (admin_oomsapas) con DS_PASSWORD o DS_PASSWORD_FILE,
 * DS_TEMA (light | dark), DS_CANAL (chrome | msedge para usar el navegador instalado). Salida: tests/visual/capturas/<etiqueta>/<pantalla>@<ancho>.png + manifest.json.
 * La carpeta de capturas está ignorada por git: las imágenes se revisan en local y se adjuntan a Linear.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import { abrirDialogoSoporte, abrirJornada, abrirPestana, abrirSector, buscarContrato } from './acciones.mjs'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const args = leerArgs(process.argv.slice(2))
const etiqueta = args.etiqueta ?? 'base'
const baseUrl = process.env.DS_BASE_URL ?? 'http://localhost:5173'
const apiUrl = process.env.DS_API_URL ?? 'http://localhost:8090/api'
const usuario = process.env.DS_USUARIO ?? 'admin_oomsapas'
const password = process.env.DS_PASSWORD ?? (process.env.DS_PASSWORD_FILE ? fs.readFileSync(process.env.DS_PASSWORD_FILE, 'utf8').trim() : null)
const token = process.env.DS_TOKEN ?? (process.env.DS_TOKEN_FILE ? fs.readFileSync(process.env.DS_TOKEN_FILE, 'utf8').trim() : null)
const tema = process.env.DS_TEMA ?? 'light'
const solo = args.solo ? String(args.solo).split(',') : null
const destino = path.join(RAIZ, 'tests/visual/capturas', etiqueta)

if (!password && !token) {
  console.error('Falta DS_TOKEN / DS_TOKEN_FILE (token local de la API) o DS_PASSWORD / DS_PASSWORD_FILE.')
  process.exit(1)
}

const ANCHO_BASE = 1440
const ANCHOS_PILOTO = [1440, 1280]

/** Abre el panel de un lecturista en el Monitor del día. */

/** Abre el detalle del primer sector del Monitor del día. */

/** Busca un contrato en la pantalla de Soporte. */

const PANTALLAS = [
  { id: 'inicio-soporte', ruta: '/' },
  { id: 'soporte-contrato', ruta: '/', acciones: buscarContrato },
  { id: 'soporte-facturacion', ruta: '/', acciones: abrirPestana(1) },
  { id: 'soporte-pagos', ruta: '/', acciones: abrirPestana(2) },
  { id: 'soporte-lecturas', ruta: '/', acciones: abrirPestana(3) },
  { id: 'soporte-ordenes', ruta: '/', acciones: abrirPestana(4) },
  { id: 'soporte-convenios', ruta: '/', acciones: abrirPestana(5) },
  { id: 'soporte-ajustes', ruta: '/', acciones: abrirPestana(6) },
  { id: 'soporte-notas', ruta: '/', acciones: abrirPestana(7) },
  { id: 'soporte-busqueda', ruta: '/', acciones: abrirDialogoSoporte({ nombre: /b[uú]squeda avanzada/i }, 4000) },
  { id: 'soporte-nota', ruta: '/', acciones: abrirDialogoSoporte({ nombre: /agregar nota/i }) },
  { id: 'soporte-cargo', ruta: '/', acciones: abrirDialogoSoporte({ nombre: /agregar cargo/i }, 3500) },
  { id: 'soporte-orden', ruta: '/', acciones: abrirDialogoSoporte({ nombre: /orden de trabajo/i }, 3500) },
  { id: 'soporte-saldo', ruta: '/', acciones: abrirDialogoSoporte({ nombre: /estado de cuenta/i }, 6000) },
  { id: 'soporte-fiscales', ruta: '/', acciones: abrirDialogoSoporte({ selector: 'button:has(.tabler-edit)' }, 3500) },
  { id: 'soporte-mapa', ruta: '/', acciones: abrirDialogoSoporte({ selector: 'button:has(.tabler-map-pin)' }, 4000) },
  { id: 'monitor-hoy', ruta: '/monitoreo?dia=2026-09-15&periodo=185', piloto: true, espera: 5000 },
  { id: 'monitor-periodo', ruta: '/monitoreo?vista=periodo&periodo=186', piloto: true, espera: 5000 },
  { id: 'monitor-detalle-lectura', ruta: '/monitoreo?vista=periodo&periodo=186&sector=330&contrato=40350', piloto: true, espera: 6000 },
  { id: 'monitor-jornada', ruta: '/monitoreo?dia=2026-09-15&periodo=185&lecturista=568', piloto: true, espera: 5000, acciones: abrirJornada },
  { id: 'monitor-detalle-sector', ruta: '/monitoreo?dia=2026-09-15&periodo=185', piloto: true, espera: 5000, acciones: abrirSector },
  { id: 'alertas', ruta: '/monitoreo/alertas', piloto: true },
  { id: 'ranking', ruta: '/monitoreo/ranking' },
  { id: 'relecturas', ruta: '/monitoreo/relecturas' },
  { id: 'coordenadas', ruta: '/monitoreo/coordenadas' },
  { id: 'calendario', ruta: '/monitoreo/admin/calendario' },
  { id: 'umbrales', ruta: '/monitoreo/admin/configuracion' },
  { id: 'destinatarios', ruta: '/monitoreo/admin/destinatarios' },
  { id: 'alcances', ruta: '/monitoreo/admin/alcances' },
  { id: 'quiosco', ruta: '/monitoreo/quiosco', espera: 6000 },
  { id: 'reportes-indice', ruta: '/reportes' },
  { id: 'reporte-visor', ruta: '/reportes/refacturacion_por_lectura', espera: 4000 },
  { id: 'tablero-lecturas', ruta: '/reportes/tableros/lecturas', espera: 4000 },
  { id: 'exportaciones', ruta: '/reportes/exportaciones' },
  { id: 'mandatos', ruta: '/paymentmandates' },
  { id: 'plantillas', ruta: '/templates' },
]

const CSS_SIN_ANIMACION = `
  *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
  .maplibregl-map canvas { image-rendering: auto; }
`

/**
 * Con DS_TOKEN: arma las mismas cookies que deja el formulario de acceso (accessToken, userData, userAbilityRules,
 * profile, company) a partir de la API local; así no depende de la validación de credenciales contra Aquasoft Comercial.
 * Sin token: usa el formulario con usuario y contraseña.
 */
async function iniciarSesion(context) {
  const page = await context.newPage()

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  if (token) {
    const cabeceras = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    const sesion = await (await fetch(`${apiUrl}/auth/user`, { headers: cabeceras })).json()
    if (!sesion?.user)
      throw new Error('El token local no es válido: /auth/user no devolvió usuario')
    const habilidades = await fetch(`${apiUrl}/reporting/me/abilities`, { headers: cabeceras }).then(r => r.json()).catch(() => ({}))
    const reglas = [...(sesion.userAbilityRules ?? []), ...(habilidades.userAbilityRules ?? [])]
    const cookies = { accessToken: token, userData: sesion.user, userAbilityRules: reglas, profile: sesion.profile, company: sesion.company }

    await page.evaluate(c => {
      for (const [k, v] of Object.entries(c))
        document.cookie = `${k}=${encodeURIComponent(JSON.stringify(v))}; path=/`
    }, cookies)
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  }
  else {
    await page.locator('input[type="text"]').first().fill(usuario)
    await page.locator('input[type="password"]').first().fill(password)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30000 })
  }
  await page.waitForTimeout(1500)

  // Tema fijo para que las capturas sean comparables
  await page.evaluate(t => {
    document.cookie = `theme=${t}; path=/`
  }, tema)
  await page.close()
}

async function capturar(context, pantalla, ancho) {
  const page = await context.newPage()

  await page.setViewportSize({ width: ancho, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${baseUrl}${pantalla.ruta}`, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: CSS_SIN_ANIMACION })
  await page.waitForTimeout(pantalla.espera ?? 2500)
  if (pantalla.acciones) {
    try {
      await pantalla.acciones(page)
    }
    catch (e) {
      console.warn(`  ⚠ ${pantalla.id}: la acción falló (${e.message.split('\n')[0]}); se captura el estado alcanzado`)
    }
  }
  const archivo = path.join(destino, `${pantalla.id}@${ancho}.png`)

  await page.screenshot({ path: archivo, fullPage: true })

  const alto = await page.evaluate(() => document.documentElement.scrollHeight)

  await page.close()

  return { id: pantalla.id, ancho, alto, archivo: path.relative(RAIZ, archivo) }
}

async function main() {
  fs.mkdirSync(destino, { recursive: true })

  // DS_CANAL=chrome usa el Chrome instalado en el equipo (sin descargar el Chromium de Playwright)
  const navegador = await chromium.launch(process.env.DS_CANAL ? { channel: process.env.DS_CANAL } : {})
  const context = await navegador.newContext({ viewport: { width: ANCHO_BASE, height: 900 }, locale: 'es-MX', timezoneId: 'America/Mazatlan' })

  await iniciarSesion(context)

  const pantallas = PANTALLAS.filter(p => !solo || solo.some(s => p.id.includes(s)))
  const resultados = []
  const inicio = Date.now()
  for (const pantalla of pantallas) {
    const anchos = pantalla.piloto ? ANCHOS_PILOTO : [ANCHO_BASE]
    for (const ancho of anchos) {
      process.stdout.write(`  ${pantalla.id}@${ancho} … `)
      try {
        const r = await capturar(context, pantalla, ancho)

        resultados.push(r)
        console.log(`ok (${r.alto} px de alto)`)
      }
      catch (e) {
        console.log(`ERROR ${e.message.split('\n')[0]}`)
        resultados.push({ id: pantalla.id, ancho, error: e.message.split('\n')[0] })
      }
    }
  }
  await navegador.close()

  // Con --solo se conservan en el manifiesto las capturas anteriores de las pantallas que no se repitieron
  const rutaManifest = path.join(destino, 'manifest.json')
  const previas = solo && fs.existsSync(rutaManifest) ? JSON.parse(fs.readFileSync(rutaManifest, 'utf8')).capturas ?? [] : []
  const conservadas = previas.filter(c => !resultados.some(r => r.id === c.id && r.ancho === c.ancho))
  const manifest = { etiqueta, generadoEl: new Date().toISOString(), baseUrl, tema, segundos: Math.round((Date.now() - inicio) / 1000), capturas: [...conservadas, ...resultados] }

  fs.writeFileSync(rutaManifest, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`\n${resultados.filter(r => !r.error).length} capturas en ${path.relative(RAIZ, destino)} (${manifest.segundos} s)`)
}

function leerArgs(lista) {
  const r = {}
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].startsWith('--')) {
      const clave = lista[i].slice(2)

      r[clave] = lista[i + 1] && !lista[i + 1].startsWith('--') ? lista[++i] : true
    }
  }

  return r
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
