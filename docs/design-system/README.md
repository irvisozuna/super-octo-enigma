# Aquasoft Design System 1.0 · guía de uso

Dirección visual aprobada el 2026-10-07 (**Enterprise Clean UI**): marca `#3154E8`, fondo `#F7F9FC`, superficies blancas con
borde sutil, Inter, base 14 px / secundaria 13 px / mínimo 12 px, espaciado en múltiplos de 4 px, botones en formato oración,
una sola acción primaria por contexto, tablas de 44 px (densas 36–40), paneles de 520 px (640–720 para información compleja).
Plan completo: `~/Project/xelesta/oomsapas/AQUASOFT-DESIGN-SYSTEM-PLAN.md`. Guía viva en la aplicación: `/_ds`.

## Dónde vive cada cosa

| Capa | Archivo | Qué contiene |
|---|---|---|
| Colores (claro y oscuro) | `src/styles/tokens/colores.json` | semánticos (`primary`…), superficies, bordes y **estados del negocio** (`toma-*`, `sector-*`, `alerta-*`, `senal-*`), cada uno con `on-*` y `-darken-1`. Es la fuente única: `plugins/vuetify/theme.ts` la carga. |
| Primitivos | `src/styles/tokens/_primitivos.scss` | `--as-fs-*` (tipografía), `--as-sp-*` (espaciado), `--as-radio-*`, `--as-borde`, `--as-sombra-*`, anchos de panel/diálogo/filtro, alturas de fila, movimiento. |
| Utilidades | `src/styles/tokens/_utilidades.scss` | `.as-num` (dígitos tabulares), `.as-tarjeta`, `.as-sobrelinea`, `.as-secundario`, `.as-etiqueta` + `.as-valor`, `.as-datos`/`.as-dato`, `.as-seccion`, `.as-punto`, `.as-acento-*`. |
| Estados → token | `src/utils/estados.ts` | `TOKEN_TOMA`, `TOKEN_SECTOR`, `TOKEN_SEVERIDAD`, `TOKEN_LECTURISTA`, `tokenSenal()`, `tokenAvance()`, `tokenMeta()`, mapas de alertas, re-lecturas, propuestas, tarifa fija, exportaciones. |
| Formato | `src/utils/formato/` | `entero`, `decimal`, `moneda`, `porcentaje`, `compacto`, `conSigno`, `fecha`, `fechaCorta`, `fechaLarga`, `hora`, `fechaHora`, `duracion`, `tiempoRelativo`, `haceCuanto`, `porFormato`. es-MX, zona de OOMSAPAS, «—» para vacíos. |
| Tokens en JS | `src/composables/useTokensTema.ts` | `hex('toma-leida')`, `rgba()`, `alCambiar()` para MapLibre, ApexCharts y SVG. |
| Alias de Vuetify | `plugins/vuetify/{index,defaults}.ts` | `AsBtnPrimario` (flat), `AsBtnSecundario` (tonal), `AsBtnTerciario` (texto), `AsBtnIcono`, `AsChipEstado`, `AsCampoFiltro`. |
| Componentes | `src/components/as/` | `AsEncabezadoPagina`, `AsBarraFiltros`, `AsPanelLateral`, `AsDialogo` (+ `useDialogo`), `AsIndicador`, `AsEstado`, `AsTablaDatos`. Se registran solos. |
| Avisos y descargas | `src/composables/useNotificacion.ts`, `useDescarga.ts` | un solo snackbar; Blob → archivo con estado. |

## Reglas rápidas

- **Nada de hex ni `rgb()` fijo** fuera de `colores.json`: usa `color="toma-leida"`, clases `bg-*`/`text-*` o `rgb(var(--v-theme-…))`.
  En JS (mapa, gráficas) usa `useTokensTema().hex()`.
- **Nada de `font-size` ni anchos en px** en componentes: `var(--as-fs-*)`, clases tipográficas, `var(--as-ancho-filtro-*)`,
  `var(--as-panel-*)`; anchos de celda en `ch`.
- **Cifras**: siempre `src/utils/formato` (o `n()`/`d()` de i18n, que usan la misma convención) y la clase `.as-num` en columnas
  numéricas. `AsTablaDatos` lo hace solo según el `formato` de la columna.
- **Un botón primario por contexto** (`AsBtnPrimario` o `variant="flat" color="primary"`); el resto tonal, texto u outlined.
  Rojo solo para destruir. Formato oración (el tema ya quita las mayúsculas).
- **Botones de solo icono** llevan `aria-label` o `title` (regla ESLint `as-boton-icono-con-etiqueta`).
- **Estados**: toda tabla, panel o tarjeta muestra `AsEstado` para cargando, vacío, error (con reintentar) y sin permiso.
  Nunca `console.error` sin aviso al usuario: `useNotificacion().error(e)`.
- **Paneles**: `AsPanelLateral` con `tamano` `md` (520) por defecto; `lg`/`xl` solo para información compleja; el cuerpo se
  desplaza y el pie fijo lleva la acción principal cuando la hay.

## Scripts

```bash
npm run ds:audit                                          # métricas del código (añade --scope, --baseline, --umbrales, --out)
node scripts/ds-contraste.mjs                             # AA de los tokens en claro y oscuro
DS_CANAL=chrome DS_TOKEN_FILE=… npm run ds:capturas -- --etiqueta <nombre>   # capturas de 20 pantallas
npm run ds:comparar -- --antes base --despues <nombre>    # HTML lado a lado en tests/visual/capturas/
DS_CANAL=chrome DS_TOKEN_FILE=… node tests/visual/accesibilidad.mjs           # axe (WCAG 2.1 AA) en el piloto
npm run lint && npm run lint:estilos                      # guardarraíles (hex, !important, px en font-size: aviso hasta la fase 2.5)
```

## Estado

- Fase 0 (cimientos) y fase 1 (piloto: Monitor de lecturas, Alertas, DetalleSector, DetalleLectura, JornadaLecturista) hechas
  en la rama `design-system` el 2026-10-07. Métricas: `metricas-base.json` → `metricas-piloto.json`.
- Piloto aprobado por Irvis el 2026-10-07. Fase 2.1 (2026-10-08): el resto de Monitoreo (Re-lecturas, Ranking, Coordenadas,
  Destinatarios, Umbrales, Gerencias por usuario, Calendario; Pantalla grande solo tokens y formato) sobre `As*`. Métricas:
  `metricas-fase2-1-antes.json` → `metricas-fase2-1-despues.json`; comparación `tests/visual/capturas/comparacion-base-fase2-1.html`.
- Siguen 2.2 Soporte (mapa a MapLibre), 2.3 Reportes, 2.4 CRUD, 2.5 defaults globales y 2.6 poda de demos.
- Fase 3: modo oscuro para todos (hoy solo administradores), quiosco sobre tokens, logotipo para fondo oscuro.
