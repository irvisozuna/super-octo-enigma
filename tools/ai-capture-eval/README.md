# ai-capture-eval — Fase 0 de captura con IA

Mide qué tan bien un modelo de IA lee el **Reporte de Perforación Diamantina** (formato impreso de CDK Drilling) a partir de una foto, antes de construir la funcionalidad en la app.

Contexto y plan completo: [`DOC DRILLING/AI_CAPTURE/PLAN.md`](../../DOC%20DRILLING/AI_CAPTURE/PLAN.md).

Es una herramienta aparte: no forma parte del build de la app ni de sus dependencias.

## Qué hace

1. Manda cada foto a Claude con el esquema de [`src/schema.ts`](src/schema.ts) en el prompt. La respuesta se valida con [`src/json-check.ts`](src/json-check.ts) y, si no cumple, se reintenta una vez. La salida estructurada de la API (`output_config.format`) no sirve aquí: rechaza un esquema de este tamaño ("compiled grammar is too large").
2. Compara campo por campo contra la transcripción verificada por una persona (`dataset/truth/`).
3. Corre las reglas de negocio de [`src/validate.ts`](src/validate.ts) (profundidades, horas, continuidad entre hojas) sobre lo que leyó la IA.
4. Escribe `results/<fecha>_<modelo>_<effort>/report.md` con el % de campos correctos, cuántos inventó, el costo por hoja y el detalle de cada error.

## ⚠️ El dataset no va en git

El repo es **público** y las hojas traen nombres del personal y datos del cliente. `dataset/` y `results/` están en `.gitignore`. Guarda el dataset en un lugar privado (Drive del equipo, por ejemplo) y cópialo aquí para correr la evaluación.

Formato (ver [`dataset.example/`](dataset.example)):

```
dataset/
├── images/<folio>.heic|jpg|png   ← foto tal cual la toman en campo
└── truth/<folio>.json            ← transcripción verificada, misma forma que src/schema.ts
```

En la transcripción se pueden usar dos comodines en cualquier valor:

- `{ "$any": ["Refugio Ibarra", "Refugio Ybarra"] }`: cualquiera de esas lecturas cuenta como correcta.
- `{ "$skip": "ilegible" }`: el campo no se califica.

`_meta.reviewed_by_human` indica si una persona ya revisó la transcripción contra la foto. **Las primeras 6 las transcribió Claude y deben revisarse** antes de confiar en los resultados.

## Uso

```bash
cd tools/ai-capture-eval
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env   # no se sube (está en .gitignore)

npm run check-truth                           # revisa el dataset sin llamar a la IA
npm run eval                                  # Opus 5.5, effort medium (valores por defecto)
npm run eval -- --model claude-sonnet-5-5 --effort high
npm run eval -- --only 1381,1382              # solo algunas hojas
```

Las fotos HEIC de iPhone se convierten a JPEG con `sips`, así que hace falta macOS. En otro sistema, convierte las fotos a JPEG antes.

## Cómo leer el reporte

- **Campos correctos**: sobre los campos que tienen dato en la hoja. Las casillas vacías no cuentan, porque inflarían el porcentaje.
- **Inventados**: la IA puso un valor donde la hoja está vacía. Es el error más peligroso y debe tender a cero.
- **Hallazgos de validación (IA / verdad)**: si la IA leyó bien, encuentra los mismos errores del capturista que la transcripción verificada.
- Textos libres (descripciones, observaciones, nombres): cuentan como correctos con una similitud de al menos 80%, después de quitar acentos y mayúsculas.
