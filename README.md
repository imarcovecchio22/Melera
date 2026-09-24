# Melera

Tienda online de miel artesanal — landing, ficha de producto, checkout con MercadoPago, sección de consultas, avisos por Telegram y panel de administración de pedidos, stock, consultas y logs. También maneja la publicación en Instagram de punta a punta (cronograma, textos con Gemini, imágenes, aprobación por Telegram y publicación con la API de Meta), sin Make ni Buffer.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) ORM + PostgreSQL ([Neon](https://neon.tech/) en producción)
- [MercadoPago Checkout Pro](https://www.mercadopago.com.ar/developers)
- Autenticación de admin vía JWT (`jose`) en cookie `httpOnly`

## Funcionalidades

- Landing con presentación del producto y sección "Quiénes somos"
- Página de producto y checkout con selector de cantidad
- Integración con MercadoPago (Checkout Pro) y webhook de confirmación de pago
- `/consultas`: preguntas frecuentes (precio real desde la base) + formulario mobile-first para quien llega desde Instagram/ManyChat (responder por Instagram o email, anti-spam con honeypot y tiempo mínimo). Cada consulta se guarda y se avisa por Telegram
- `?origen=` (ej. `instagram` desde los botones de ManyChat) se guarda en las consultas y en los pedidos que pasan por `/producto` → Comprar → checkout
- Avisos por Telegram de pedidos pagados y consultas nuevas, directo desde la web al bot (`src/lib/telegram.ts`, sin Make). Diagnóstico en `GET/POST /api/admin/telegram` (dice si el bot está configurado y manda un mensaje de prueba)
- Panel `/admin` protegido: pedidos (estado, detalle, origen), stock, consultas (link directo a ig.me / mailto, marcar respondida, archivar) y **logs**. Fechas en hora de Argentina
- `/admin/logs`: registro de eventos de la web (pedidos, pagos, consultas, avisos de Telegram, logins y cambios del admin, imágenes de Instagram) con filtros en la URL: `?nivel=error`, `?tipo=pago`, `?q=texto`, `?pagina=2`. Se guarda 90 días. Para registrar algo nuevo: `logEvent(tipo, mensaje, { nivel, detalle })` de `src/lib/logs.ts` (nunca lanza error)
- `/api/generate` + `/api/img/...`: imágenes de feed y story para Instagram, renderizadas con Chromium en Vercel (plantillas en `melera-templates/`)
- **Instagram** (`/admin/instagram`): cronograma de posts en la base. Todos los días (Vercel Cron, 9–10 h Argentina) se generan los pendientes y llegan a Telegram con 4 botones (Feed, Historia, Feed + Historia, Descartar). Al tocar uno se publica directo con la Graph API de Meta. Ver "Instagram" más abajo
- **Respuestas automáticas de Instagram** (`/admin/autorespuestas`, reemplazan a ManyChat): reglas por palabra clave para DMs y comentarios, con botones de link, Probador y registro de los mensajes recibidos. Ver "Respuestas automáticas" más abajo
- `/privacidad`: política de privacidad (Meta la pide para pasar la app a Live)

## Desarrollo local

### Requisitos

- Node.js 22.17+ (lo exige `@sparticuz/chromium`; en Vercel el proyecto usa Node 24.x — no fijar `engines.node` en `package.json`)
- Una base PostgreSQL accesible (local vía Docker o remota)

### Setup

```bash
npm install
cp .env.example .env.local   # completar con tus valores, ver tabla abajo
npx prisma migrate deploy    # aplica las migraciones de prisma/migrations
npm run dev                  # http://localhost:3000
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL (Neon en producción) |
| `MP_ACCESS_TOKEN` | Access token de MercadoPago (server-side) |
| `MP_PUBLIC_KEY` | Public key de MercadoPago (client-side) |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Credenciales de acceso al panel `/admin` |
| `NEXTAUTH_SECRET` | Secreto para firmar el JWT de sesión de admin |
| `NEXTAUTH_URL` | URL base del sitio (usada en la sesión) |
| `WHATSAPP_NUMBER` | Número de contacto para el botón de WhatsApp (código de país, sin `+`) |
| `NEXT_PUBLIC_BASE_URL` | URL pública del sitio, usada en los redirects de MercadoPago |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram que avisa pedidos pagados y consultas nuevas (opcional; sin él no se avisa) |
| `TELEGRAM_CHAT_ID` | Chat donde llegan esos avisos (`6219737981`, el mismo de la automatización de Instagram) |
| `GEMINI_API_KEY` | API key de Gemini para el chat de atención (widget flotante) |
| `GENERATE_WEBHOOK_SECRET` | Secreto que Make manda en `x-webhook-secret` a `/api/generate`; también firma las URLs de `/api/img` |
| `IMAGE_SIGNING_SECRET` | Opcional: secreto propio para firmar las URLs de `/api/img` (si no está, usa `GENERATE_WEBHOOK_SECRET`) |
| `META_PAGE_TOKEN` | Token de la página de Facebook vinculada a Instagram (publica feed e historias). Vence cada ~60 días |
| `META_IG_USER_ID` | Id de la cuenta de Instagram (`17841431194977725`) |
| `TELEGRAM_WEBHOOK_SECRET` | Clave que Telegram manda en cada toque de botón (16+ caracteres: letras, números, `_` o `-`) |
| `CRON_SECRET` | Clave con la que Vercel Cron llama a `/api/cron/instagram` y `/api/cron/instagram-token` |
| `IG_APP_ID` / `IG_APP_SECRET` | App de Instagram (Instagram Login) de las respuestas automáticas. El secreto valida la firma del webhook |
| `IG_WEBHOOK_VERIFY_TOKEN` | Texto al azar que se carga también en Meta al configurar el webhook |
| `IG_ACCESS_TOKEN` / `IG_USER_ID` | Token de larga duración e id de @melera.miel para responder. Después se renueva solo y vive en la tabla `InstagramToken` |
| `IG_DRY_RUN` | `true` = hace todo menos publicar en Instagram (para probar) |
| `GEMINI_COPY_MODEL` | Opcional: modelo de Gemini para los textos (por defecto `gemini-flash-lite-latest`) |

`NEXTAUTH_SECRET` es obligatoria en producción: sin ella el login de `/admin` falla después de validar usuario y contraseña (el middleware tampoco puede verificar la sesión). Después de cargar o cambiar una variable en Vercel hay que hacer **Redeploy**: los deploys que ya existen no la toman.

Ver `.env.example` para el detalle completo.

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas automáticas (vitest, carpeta `tests/`) |
| `npm run build` | `prisma generate` + build de producción |
| `npm start` | Levanta el build de producción |
| `npx prisma migrate dev --name <nombre>` | Crea una migración nueva a partir de cambios en `schema.prisma` (contra una base de desarrollo) |
| `npx prisma migrate deploy` | Aplica las migraciones pendientes (producción) |
| `npm run db:push` | Sincroniza el schema sin migraciones — ya no se usa desde 2026-09-24 |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Carga datos de ejemplo |

## Instagram

- **Cargar posts:** `/admin/instagram` (fecha, tipo, estilo, tema; en productos también nombre, precio y foto). Cada post pasa por `pendiente → generando → esperando_aprobacion → publicando → publicado` (o `descartado` / `error`). Cada cambio de estado es atómico, así que no hay doble publicación.
- **Generación:** `/api/cron/instagram` (Vercel Cron, `vercel.json`) toma hasta 3 pendientes por corrida. También avisa por Telegram si el token de Meta vence en 7 días o menos. Desde el admin se puede generar al momento.
- **Aprobación:** Telegram llama a `/api/telegram/webhook` (clave secreta, solo el chat de Melera). Para que los botones lleguen a esta web hay que tocar una vez **"Conectar el bot a esta web"** en `/admin/instagram`.
- **Código:** `src/lib/instagram/`. Los errores quedan en `/admin/logs?tipo=instagram` y llegan por Telegram.
- **Previews:** el cron solo corre en producción. Para probar los botones en una preview, activar *Protection Bypass for Automation* en Vercel y usar `IG_DRY_RUN=true`.

## Respuestas automáticas

- **Configuración en Meta:** paso a paso en [`docs/instagram-setup.md`](docs/instagram-setup.md), incluido el orden para dejar ManyChat sin respuestas dobles.
- **Webhook:** `/api/instagram/webhook` valida la firma `X-Hub-Signature-256`, responde 200 enseguida y procesa en segundo plano. Cada mensaje o comentario se registra en `InstagramEvento` por su id (un reintento de Meta no responde dos veces). No repite la misma regla a la misma persona por 12 h.
- **Coincidencia:** sin tildes, mayúsculas ni signos, por palabra completa ("info" no coincide con "informal"). Gana la regla activa de mayor prioridad. `$PRECIO` en la respuesta se reemplaza por el precio actual del producto.
- **Token:** `/api/cron/instagram-token` (diario) lo renueva cuando le quedan menos de 15 días; si falla, avisa por Telegram. Con 5 errores seguidos al responder también avisa.
- **Código:** `src/lib/instagram/reglas.ts` (coincidencia, sin servidor: la usa también el Probador), `webhook.ts` (firma y lectura del aviso), `autorespuestas.ts` (procesamiento), `mensajes.ts` y `token.ts` (API de Instagram).

## Seguridad

- Login del admin: comparación de claves resistente a ataques de tiempo y bloqueo de 15 min tras 5 intentos fallidos por IP.
- `/api/admin/*` rechaza cambios que vengan de otro origen (CSRF). Headers de seguridad en todo el sitio.
- Límites: 5 consultas por IP cada 10 min; largo máximo de los mensajes del chat.
- Las URLs que carga el servidor (fotos de producto) tienen que ser https públicas. Al dibujar imágenes, Chromium solo puede cargar fuentes de Google e imágenes https públicas.
- Pendiente: pasar a Next.js 16 (Next 14.2 tiene avisos de seguridad que solo se corrigen en la 16) y actualizar `mercadopago`.

## Base de datos

Desde 2026-09-24 el esquema se maneja con migraciones (`prisma/migrations`). `0_init` es la foto del esquema que existía antes (creado con `db push`) y en Neon se marcó como aplicada con `prisma migrate resolve --applied 0_init`. Los cambios nuevos van como migraciones: crear con `migrate dev` y aplicar en producción con `migrate deploy` **antes** de hacer push del código que las usa.

## Deploy

Pensado para desplegarse en [Vercel](https://vercel.com/) conectando este repo. Configurar las variables de entorno de la tabla anterior en el proyecto de Vercel, usando credenciales reales de Neon y MercadoPago (no las de test).

> Nota: mientras `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` sean valores de test, el checkout no procesa pagos reales.
