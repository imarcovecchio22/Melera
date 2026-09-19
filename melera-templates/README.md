# Melera — Templates v2

6 templates HTML (2 estilos × 3 tipos) listos para htmlcsstoimage.com

## Archivos

| Archivo | Estilo | Tipo |
|---|---|---|
| `organico-presentacion.html` | Orgánico/artesanal | Presentación de marca |
| `organico-producto.html` | Orgánico/artesanal | Producto destacado |
| `organico-dato.html` | Orgánico/artesanal | Dato curioso |
| `geo-presentacion.html` | Moderno/geométrico | Presentación de marca |
| `geo-producto.html` | Moderno/geométrico | Producto destacado |
| `geo-dato.html` | Moderno/geométrico | Dato curioso |

---

## Variables por tipo

### Presentación (ambos estilos)
| Variable | Ejemplo |
|---|---|
| `{{tagline}}` | `miel artesanal` |
| `{{titulo}}` | `Pura, natural.` |
| `{{subtitulo}}` | `desde las colmenas del norte` |
| `{{tag_inferior}}` | `cosecha 2024` |

### Producto (ambos estilos)
| Variable | Ejemplo |
|---|---|
| `{{categoria}}` | `variedad floral` |
| `{{nombre_producto}}` | `Miel de azahar` |
| `{{descripcion}}` | `Suave y aromática, perfecta para el desayuno` |
| `{{caracteristica_1}}` | `100% natural, sin aditivos` |
| `{{caracteristica_2}}` | `Cosecha artesanal` |
| `{{caracteristica_3}}` | `Frasco de vidrio reciclable` |
| `{{imagen_url}}` | `https://...` |
| `{{precio}}` | `$4.500` |
| `{{presentacion}}` | `frasco 500g` |
| `{{cta}}` | `disponible en DM` |

### Dato curioso (ambos estilos)
| Variable | Ejemplo |
|---|---|
| `{{intro_label}}` | `¿sabías que...` |
| `{{numero}}` | `50.000` |
| `{{sufijo}}` | `+` |
| `{{unidad}}` | `abejas por colmena` |
| `{{texto_dato}}` | `trabajan toda su vida para producir apenas una cucharadita de miel` |
| `{{hashtags}}` | `#mielartesanal #melera #apicultura` |

---

## Columna "estilo" en Google Sheet

Agregar columna `estilo` con valores `organico` o `geo`.
En Make, el nombre del template se construye así:

```
{{estilo}}-{{tipo}}.html
```

Ejemplo: `organico-producto.html`, `geo-dato.html`

## Parámetros para htmlcsstoimage
```json
{
  "html": "<contenido del template con variables reemplazadas>",
  "viewport_width": 1080,
  "viewport_height": 1080,
  "selector": "body",
  "google_fonts": "Playfair Display:400,400i,700|Lato:300,400|Space Grotesk:300,400,600,700"
}
```
