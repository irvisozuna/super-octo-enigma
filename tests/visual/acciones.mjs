/**
 * Acciones de navegación compartidas por las capturas y el chequeo de accesibilidad (Playwright).
 */
/** Pestaña n de la ficha de contrato (0 = información general). */
export function abrirPestana(n) {
  return async page => {
    await buscarContrato(page)
    await page.getByRole('tab').nth(n).click()
    await page.waitForTimeout(3000)
  }
}

/** Abre un diálogo de la ficha por el nombre accesible del botón (regex) o por selector. */
export function abrirDialogoSoporte({ nombre, selector }, espera = 2500) {
  return async page => {
    await buscarContrato(page)

    const boton = nombre ? page.getByRole('button', { name: nombre }).first() : page.locator(selector).first()

    await boton.click()
    await page.waitForTimeout(espera)
  }
}

export async function buscarContrato(page) {
  await page.locator('.v-field input').first().fill('10802150')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await page.waitForSelector('.v-tab', { timeout: 20000 })
  await page.waitForTimeout(2500)
}

export async function abrirJornada(page) {
  await page.locator('#monitoreo-lecturistas tbody tr').first().click()
  await page.waitForTimeout(3500)
}

export async function abrirSector(page) {
  await page.evaluate(() => {
    const raiz = document.querySelector('.monitor-dia')
    const estado = raiz?.__vueParentComponent?.setupState
    const primero = estado?.sectores?.[0]
    if (estado?.irASectorPorId && primero)
      estado.irASectorPorId(Number(primero.id ?? primero.sector_id))
  })
  await page.waitForTimeout(3500)
}
