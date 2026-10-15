# Captura de reportes de perforación con IA

**Objetivo:** que el personal tome una foto del *Reporte de Perforación Diamantina* llenado a mano en campo y el sistema cree el reporte en **borrador** con los datos ya capturados. Una persona revisa, corrige lo marcado y completa.

**Estado:** Fase 1 lista para desplegar (backend + front, probada localmente). Fase 0 medida con 3 modelos (Opus 5.5: 97.5% de campos correctos y 0 errores sin resaltar); falta revisar la transcripción de referencia y crecer el dataset. Última actualización: 2026-10-15.

---

## 1. Por qué es viable

- **Formato fijo.** Siempre es la misma hoja impresa de CDK Drilling, así que se extrae contra un esquema fijo en lugar de hacer OCR libre.
- **Folio impreso** (No. en rojo): sirve como llave para no importar dos veces la misma hoja.
- **Los datos se validan solos.** Prof. final − inicial = metros perforados = suma de corridas; las horas de cada actividad cuadran con su rango; las horas suman las trabajadas; la prof. inicial de un turno es la final del anterior. Un error de lectura de la IA o del capturista se detecta sin mirar la foto.
- **El módulo ya existe.** `DrillingReportsModule` (front) y `app/Modules/Drilling` (back) ya tienen el estado `draft` y las sub-entidades (actividades, consumos, herramientas, accesorios, casing, aditivos, mediciones direccionales).

## 2. Retos observados en las fotos reales

| Reto | Ejemplo | Quién lo resuelve |
|---|---|---|
| Letra a mano, fotos inclinadas, otras hojas asomándose detrás | todas | IA (se le indica transcribir solo la hoja principal) |
| El mismo pozo escrito distinto | `VP026-14A`, `VPO 26-14A`, `VPO-26-14-A` | Backend: relación con catálogo (fase 2) |
| Equipos y nombres con variantes | `H300` / `GD H300`, apellidos abreviados | Backend: relación con catálogo (fase 2) |
| Turno sin estándar | `Noche`, `1`, `A`, `B` vs. `day/night/mixed` | Backend: tabla de conversión (**pendiente de definir**) |
| Horas sin am/pm | `11:30 → 01:00` | Backend: el turno inicia a las 07:00, se infiere |
| Fracciones | `1½`, `½`, `2h` | IA (las convierte a decimal) |
| Datos sueltos en texto libre | "Medición 90 MTS / AZ 15.11 / V −60.76" | IA (los pone en `perforacion_notas`) → backend los pasa a mediciones direccionales |
| **Errores del capturista en campo** | folio 1381: dice 3.60 m perforados (son 3.00); 7:00–9:30 anotado como 1½ h (son 2½) | Validaciones → se marcan para revisión |

## 3. Arquitectura propuesta

```
[Front] "Capturar desde foto" (1..N fotos)
   → POST /drilling-reports/ai-imports    (guarda la imagen y encola)
[Job Laravel]
   1. Preprocesar: HEIC→JPEG, lado mayor ~2000 px
   2. IA con visión; esquema JSON espejo de la hoja en el prompt + validación y 1 reintento
   3. Normalizar en PHP: catálogos (pozo, equipo, personal), turno, am/pm, fracciones
   4. Validar reglas de negocio → advertencias por campo
   5. Crear DrillingReport en status=draft + sub-entidades
   6. Guardar registro de importación (imagen, JSON crudo, modelo, costo, advertencias)
[Front] Pantalla de revisión: foto a un lado, formulario al otro,
        campos en amarillo/rojo → el usuario corrige y completa
```

Decisiones:

1. **Separar "leer" de "interpretar".** La IA transcribe lo escrito tal cual (`tools/ai-capture-eval/src/schema.ts`). IDs, conversiones y reglas los aplica el backend. Así un error es trazable y la IA no inventa IDs.
2. **Nunca se completa ni se aprueba en automático.** Siempre queda en `draft`.
3. **Proveedor de IA intercambiable.** Una interfaz (`FormExtractorPort`) con un adaptador por proveedor, todos con el mismo esquema. Se empieza con Claude; Gemini/OpenAI se comparan después con la misma herramienta.
4. **Modelo barato primero, fuerte si hace falta** (a evaluar): si las validaciones fallan o hay campos dudosos, se reprocesa con un modelo más capaz.

## 4. Fases

Cada fase es un commit a la rama `simo` (front) y, cuando aplique, a `DynamicReportModule` (back). Ambas ramas se despliegan solas a producción (sección 7).

| Fase | Qué | Estado |
|---|---|---|
| **0** | Herramienta de evaluación + transcripciones de referencia + validaciones. Medir precisión y costo por hoja con Claude | ✅ Medido (falta revisión humana del dataset) |
| **1** | Endpoint + Job + extracción + borrador + pantalla de revisión con la foto al lado | 🟡 Lista para desplegar |
| 2 | Relación con catálogos + validaciones entre reportes en el backend | ⚪ Pendiente |
| 3 | Varias hojas a la vez + captura desde el celular con escáner de documentos | ⚪ Pendiente |

### Fase 0: detalle

Herramienta en [`tools/ai-capture-eval/`](../../tools/ai-capture-eval/README.md):

- `src/schema.ts`: esquema de extracción, espejo literal de la hoja.
- `src/prompt.ts`: instrucciones de transcripción.
- `src/extract.ts`: llamada a Claude (visión, esquema en el prompt, validación y reintento) y costo por hoja.
- `src/json-check.ts`: validador mínimo de JSON Schema para la respuesta.
- `src/validate.ts`: reglas de negocio de una hoja y entre hojas del mismo pozo. Se reusarán en el backend.
- `src/score.ts`: comparación campo por campo (correctos, mal leídos, omitidos, **inventados**).
- `npm run check-truth`: revisa el dataset sin IA. `npm run eval`: corre la evaluación.

Dataset inicial: 6 hojas reales (folios 1350, 1358, 1376, 1381, 1382, 1383). Transcripción de referencia hecha por Claude a partir de las fotos; **falta que una persona la revise** (`_meta.reviewed_by_human`). El dataset **no está en el repo** porque el repo es público y las hojas traen nombres del personal.

Lo que ya mostró `check-truth` sobre las hojas reales, sin IA:

- Folio 1381: metros perforados no cuadran (3.60 vs 3.00), una actividad con horas mal anotadas, las horas suman 11 en vez de 12 y el total quedó en blanco.
- Folio 1350: total de horas en blanco.
- Entre los folios 1358 (termina en 93 m) y 1376 (empieza en 114 m) del mismo pozo falta una hoja.

Criterio para pasar a fase 1 (propuesto): ≥ 90% de campos correctos, **0 inventados en campos numéricos** y que la IA detecte los mismos hallazgos de validación que la transcripción verificada. Antes de dar el número por bueno, crecer el dataset a 30–50 hojas.

#### Resultados

| Fecha | Modelo | Effort | Hojas | Correctos | Inventados | Costo/hoja | Latencia | Notas |
|---|---|---|---|---|---|---|---|---|
| 2026-10-15 | `claude-opus-5-5` | medium | 6 | **97.5%** (469/481) | 6 (ver abajo) | $0.087 | 24 s | Transcripción de referencia aún sin revisar por una persona |
| 2026-10-15 | `claude-sonnet-5-5` | medium | 6 | 95.4% (459/481) | 7 | $0.036 | 11 s | Mismo dataset |
| 2026-10-15 | `claude-haiku-5-5` | medium | 6 | 94.8% (456/481) | 2 | $0.003 | 20 s | Mismo dataset |

**Comparación de modelos.** Lo que importa no es solo el % sino cuántos errores quedan **sin resaltar**: los que no marcó la IA como dudosos ni detectó una validación, y que por eso un revisor dejaría pasar.

| Modelo | Errores* | Sin resaltar | Errores en números | Costo por 1,000 hojas |
|---|---|---|---|---|
| Opus 5.5 | 10 | **0** | 1 (resaltado) | ~$87 |
| Sonnet 5.5 | 21 | 2 (un nombre; una profundidad en aceros) | 6 | ~$36 |
| Haiku 5.5 | 27 | 1 (un nombre) | 5 (todos resaltados) | ~$3 |

\* Sin contar los accesorios puestos en otra columna, que fallaron igual en los tres modelos.

- **Opus** es el único sin errores sin resaltar y con los números prácticamente perfectos.
- **Sonnet** "corrigió" un error real del capturista: en el folio 1381 escribió 3 m perforados donde la hoja dice 3.60, lo que esconde el hallazgo de validación. También leyó mal la prof. inicial del 1382 (194 en vez de 197).
- **Haiku** cuesta ~26 veces menos que Opus, pero falla más en letra cursiva y en horas: 4 horas mal leídas en el 1382, aunque las validaciones las detectaron todas. Además inventó palabras ("Traslado a dolomeras").
- **Recomendación con lo medido hasta ahora:** usar Opus. A ~9 ¢ por hoja, el costo es menor que el tiempo de revisión que ahorra. Volver a comparar con 30–50 hojas antes de decidir, y probar la combinación "Haiku primero, Opus si las validaciones fallan".

Lectura del primer resultado:

- **Lo numérico salió perfecto:** tablas de perforación (124/124), actividades con horas (152/152), profundidades, parámetros, consumos y totales al 100%.
- **Las validaciones encontraron lo mismo con lo que leyó la IA que con la transcripción verificada:** los 6 hallazgos de los folios 1350 y 1381.
- **Errores reales de lectura (6):** nombres en letra cursiva (operador del 1358), `VPO` leído como `VPD` y `14A` como `14-D` (1358), equipo `H300` leído como `HD00` (1376), un dígito de un número de serie (1376) y la inclinación `34-98` dejada en blanco (1382). **La IA marcó todos como dudosos**, así que la pantalla de revisión los resaltaría. Además, la relación con catálogos (fase 2) corregiría pozo, equipo y número de serie.
- **Los 6 "inventados" no son datos inventados:** son datos reales puestos en otra columna. En el 1376, los accesorios quedaron en la columna "Acces." en lugar de "Observaciones". En el número de serie `13445/12`, que cruza la línea entre columnas, la IA separó `13445` en "No. Serie" y `12` en "Serie/Color", y puede que tenga razón. Hay que decidir cuál lectura es la correcta al revisar la transcripción de referencia.
- **Costo:** ~9 ¢ por hoja, arriba del estimado inicial de 5–8 ¢.
- **El hallazgo entre hojas no apareció con la lectura de la IA:** como leyó mal el número de pozo del 1358, no lo agrupó con el 1376. Es otra razón para relacionar con el catálogo de pozos antes de validar.

**Limitación técnica encontrada:** la salida estructurada de la API (`output_config.format`) no acepta un esquema del tamaño de esta hoja. Primero rechaza más de 16 campos nullable y, ya sin nullables, responde "compiled grammar is too large". La solución que funcionó: el esquema va en el prompt, todo como texto (`""` = vacío), se valida la respuesta en código (`src/json-check.ts`) y se reintenta una vez si no cumple. El backend (fase 1) debe hacer lo mismo.

## 5. Costos de referencia (2026-10)

Precio por millón de tokens (entrada/salida). Estimado con ~2–3k tokens de entrada por imagen y ~2–3k de salida (incluye razonamiento).

| Modelo | Precio | Por hoja (estimado) |
|---|---|---|
| Claude Opus 5.5 | $4 / $20 | ~5–8 ¢ |
| Claude Sonnet 5.5 | $2 / $10 | ~3–4 ¢ |
| Claude Haiku 5.5 | $0.10 / $0.50 | ~0.2 ¢ |

La Batch API cuesta 50% menos si no se necesita el resultado al momento. El costo real por hoja sale en cada reporte de evaluación.

### Fase 1: detalle

**Flujo:** en el detalle del proyecto, pestaña Reportes → **Capturar desde foto** → se suben 1..10 fotos del pozo del proyecto → cada foto se procesa en la cola (~30 s) → se crea un reporte en **borrador** por foto → **Revisar** abre el asistente de edición con la foto al lado (zoom, giro, arrastre), las advertencias agrupadas por paso (con botón "Ir al paso") y lo que la hoja dice pero no se cargó solo.

**Backend** (`main_skeleton`, módulo `Drilling`):

| Pieza | Archivo |
|---|---|
| Endpoints `POST/GET /api/drilling/reports/ai-imports`, `GET …/{id}/image` | `Infrastructure/Controllers/DrillingAiImportController.php` |
| Tabla `drilling_ai_imports` (foto, vista previa JPEG, transcripción, advertencias, mapeo, costo) | `Database/migrations/2026_10_15_000001_…` |
| Job en cola (1 intento, 300 s) | `Application/Jobs/ProcessDrillingAiImportJob.php` |
| Orquestación: HEIC→JPEG, IA, mapeo, borrador | `Application/UseCases/AiCapture/ProcessAiImportUseCase.php` |
| Adaptador de Claude (esquema en el prompt + validación + reintento) | `Infrastructure/Services/AiCapture/ClaudeSheetExtractor.php` |
| Esquema, prompt, validaciones, reloj de turno, tipos de actividad, mapeo | `Application/Services/AiCapture/*` |
| Configuración (modelo, effort, mapa de turnos, precios) | `Config/module.php` → `ai_capture` |

**Qué se carga solo al borrador:** fecha, turno, RPM/pull down, horómetro (si es válido), actividades (tipo, horas, hora 24 h, descripción), consumos de petróleo, observaciones y profundidades de perforación.

**Qué NO se carga solo (queda para revisión):** operador, ayudantes y equipo (falta relacionar con catálogos, fase 2), aceros (crear el reporte con herramientas registra su desgaste de inmediato, aun en borrador), corridas de perforación (no hay entidad en el backend), accesorios, firmas y mediciones direccionales escritas como nota.

**Seguridad:** consultas filtradas explícitamente por empresa; límite de 10 cargas por minuto por usuario; solo se decodifican JPEG/PNG/WebP/HEIC detectados por sus bytes iniciales, con límites de memoria y de píxeles; los errores internos no se muestran al usuario.

**Permisos:** se declaró `import DrillingReport`, pero no se exige: en producción las asignaciones de rol guardan `model_type = "AppModelsUser"` (sin diagonales), así que ningún permiso de Spatie aplica a ningún usuario. Hay que corregir esos datos antes de poder exigir permisos en cualquier ruta del módulo.

**Pruebas:** backend 43 pruebas unitarias (esquema, validaciones, reloj, clasificador, mapeo, detección de formato) + prueba real con una hoja (Opus 5.5 desde PHP: $0.07, 20 s). Front: 7 pruebas (store y panel). Build de producción OK. Sin MySQL local no se probó de punta a punta el job con base de datos.

**Pasos de despliegue (en orden):**

1. Push del backend a `DynamicReportModule` (la Action hace `git pull` + `composer install`).
2. En el servidor: agregar `ANTHROPIC_API_KEY` al `.env`, `php artisan config:clear` y `php artisan migrate --force` (no hay otras migraciones pendientes).
3. Reiniciar el worker de colas (`php artisan queue:restart`) para que cargue el job nuevo: el deploy no lo hace.
4. Push del front a `simo` (sin `[skip ci]`: se publica en `cdkapp.xelesta.mx`).

## 6. Pendientes de decisión

1. **Turno:** ¿"A" y "1" = día, "B" y "Noche" = noche? ¿O "1/2" y "A/B" son cuadrillas distintas? **Mientras tanto** la fase 1 usa A/1/D = día y B/2/N/Noche = noche (configurable en `Config/module.php`), y siempre avisa en la revisión cómo interpretó el turno.
2. **Tipo de actividad:** cómo se clasifican "voladura", "traslado", "midiendo barreno", "esperando empaques" en `drilling | maintenance | waiting | mobilization | …`.
3. **Tabla PERFORACIÓN** (desde, hasta, m, recuperación, tipo de roca, dureza): confirmar si existe entidad en el backend o hay que crearla.
## 7. Despliegue (verificado en el servidor el 2026-10-15)

Servidor `server.nautiluz.mx` (148.135.39.191), SSH por el puerto 22. Es el mismo servidor del CRM de Galex.

| Pieza | Repo / rama | Cómo se despliega | Dónde corre |
|---|---|---|---|
| Frontend | `super-octo-enigma` / **`simo`** | Push a `simo` → GitHub Action `deploy-simo.yml`: `pnpm install --no-frozen-lockfile`, build y `scp` de `dist/` | `/var/www/docker/simo/frontend/dist`, servido por el contenedor `simo_web` (Caddy) → `cdkapp.xelesta.mx` |
| Backend | `main_skeleton` / **`DynamicReportModule`** | Push a `DynamicReportModule` → GitHub Action `deploy.yml` (SSH + `git pull`) | `/var/www/docker/simo`, contenedores `simo_app`, `simo_queue`, `simo_scheduler` → `cdkapi.xelesta.mx` |

Entrada: Apache (443) → Traefik (`:18080`) → contenedores.

⚠️ **Todo push a `simo` reconstruye y publica el frontend en producción**, aunque el commit solo toque documentación. Como el install no usa el lockfile congelado, un rebuild puede traer versiones nuevas de dependencias. Los commits que no cambian la app (como la fase 0) llevan `[skip ci]` para no disparar el despliegue.

## 8. Bitácora

- **2026-10-15:** Análisis de 6 fotos reales y del módulo existente. Propuesta de arquitectura. Fase 0: herramienta de evaluación, esquema, validaciones y transcripciones de referencia. Revisión del servidor: despliegue documentado en la sección 7.
- **2026-10-15:** Primera evaluación con Opus 5.5 (effort medium): 97.5% de campos correctos, $0.087 por hoja. La salida estructurada no admite el esquema; se cambió a esquema en el prompt + validación.
- **2026-10-15:** Comparación con Sonnet 5.5 (95.4%, $0.036 por hoja) y Haiku 5.5 (94.8%, $0.003 por hoja). Opus es el único sin errores sin resaltar.
- **2026-10-15:** Fase 1 implementada (backend + front) y probada localmente. Una revisión de seguridad automática encontró 4 puntos (autorización, imágenes gigantes, formatos de imagen inseguros, fuga de mensajes de error), todos corregidos antes del push.
