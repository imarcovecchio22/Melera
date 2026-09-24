# Melera — Templates IG v3

6 plantillas HTML (2 estilos × 3 tipos) que se renderizan con htmlcsstoimage.com.
Cada plantilla sirve para **feed y story**: el diseño se adapta solo según el tamaño de render.

| Formato | Tamaño | Uso |
|---|---|---|
| Feed | 1080 × 1350 (4:5) | Post que se publica vía Buffer |
| Story | 1080 × 1920 (9:16) | Story que se publica vía Graph API de Meta |

## Archivos

| Archivo | Qué es |
|---|---|
| `organico-{presentacion,dato,producto}.html` | Estilo orgánico: fondo oscuro, gotas de miel, logo en círculo crema |
| `geo-{presentacion,dato,producto}.html` | Estilo geométrico: fondo crema, hexágonos, logo directo |
| `logo.png` | Logo Melera (abeja + hexágono + wordmark). `generate.js` lo inyecta como data URI en `{{logo_src}}` |
| `generate.js` | Rellena la plantilla y llama a htmlcsstoimage (feed y story en paralelo) |

Tipografías: Fraunces + Poppins (Google Fonts, `<link>` en el `<head>`).

## Variables por tipo

### Presentación
| Variable | Ejemplo |
|---|---|
| `{{tagline}}` | `miel artesanal` (va en mayúsculas arriba del título) |
| `{{titulo}}` | `Pura, <em>natural</em>` |
| `{{texto}}` | `Desde nuestras colmenas a tu mesa.` |
| `{{cta}}` | `Escribinos por DM` |

### Dato curioso
| Variable | Ejemplo |
|---|---|
| `{{numero}}` | `50.000+` |
| `{{texto_dato}}` | `abejas pueden vivir en una sola colmena` |
| `{{tagline}}` | `la magia de la colmena` |

El encabezado "¿Sabías que?" es fijo en la plantilla.

### Producto
| Variable | Ejemplo |
|---|---|
| `{{imagen_url}}` | URL pública de la foto (Imgur, Drive público, etc.) |
| `{{nombre_producto}}` | `Miel <em>cremosa</em>` |
| `{{caracteristicas}}` | `Artesanal\|Certificada\|500 g` (separadas por `\|`, se muestran como etiquetas) |
| `{{precio}}` | `$4.500` |

### Reglas
- `{{titulo}}` y `{{nombre_producto}}` aceptan `<em>…</em>` / `<i>…</i>` (cursiva color miel) y `<br>`. El resto del HTML se escapa.
- Los textos largos se achican solos (script al final de cada plantilla); por eso se renderiza con `ms_delay: 500`.
- `{{logo_src}}` lo completa `generate.js`; no hay que mandarlo.

### Compatibilidad con la Sheet "Cronograma"
`generate.js` (`normalizeData`) traduce los nombres de columna que ya usa Make:

| Sheet / Make | Plantilla |
|---|---|
| `subtitulo` | `texto` |
| `caracteristica_1..3` | `caracteristicas` (unidas con `\|`) |
| `numero` + `sufijo` | `numero` |

`tag_inferior`, `intro_label`, `unidad`, `descripcion`, `categoria`, `presentacion` y `hashtags` ya no se muestran en la imagen.

## Endpoint

`POST https://melera.vercel.app/api/generate` con header `x-webhook-secret`. Body: `tipo`, `estilo`, `fecha` + las variables del tipo.

```json
{
  "image_url": "https://hcti.io/v1/image/...",        // feed 1080x1350
  "story_image_url": "https://hcti.io/v1/image/...",  // story 1080x1920
  "filename": "2026-09-23_organico-dato.png"
}
```

Cada llamada consume **2 imágenes** de la cuota de htmlcsstoimage (una por formato).
Si se repite exactamente el mismo HTML, hcti devuelve la imagen cacheada sin cobrar.

## Uso local

```bash
node generate.js ejemplo.json
# o
node generate.js '{"tipo":"dato","estilo":"geo","fecha":"2026-09-23","numero":"50.000+","texto_dato":"abejas en una colmena","tagline":"la magia de la colmena"}'
```

Guarda feed y story en `output/`. Necesita `HCTI_USER_ID` y `HCTI_API_KEY` en `.env`.

Para previsualizar sin gastar cuota: abrir el HTML en Chrome con la ventana en 1080×1350 o 1080×1920 (o `chrome --headless=new --window-size=1080,1350 --screenshot=out.png archivo.html`).

## Parámetros enviados a htmlcsstoimage

```json
{
  "html": "<plantilla con variables reemplazadas>",
  "viewport_width": 1080,
  "viewport_height": 1350,
  "selector": "body",
  "ms_delay": 500,
  "google_fonts": "Fraunces:400,400i,500i,600,700|Poppins:400,500,600"
}
```
(`viewport_height: 1920` para la story.)
