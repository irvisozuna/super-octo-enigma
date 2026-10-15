# Ejemplo de dataset

Copia esta estructura a `../dataset/` (ignorada por git) con las fotos y transcripciones reales:

```
dataset/
├── images/
│   └── 9999.jpg        ← nombre = folio impreso en la hoja
└── truth/
    └── 9999.json       ← ver 9999.json en esta carpeta (datos ficticios)
```

`truth/9999.json` muestra la forma completa de una transcripción, con datos inventados y los comodines `$any` y `$skip`.
