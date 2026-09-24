# Melera

Tienda online de miel artesanal — landing, ficha de producto, checkout con MercadoPago, sección de consultas y panel de administración de pedidos, stock y consultas. Incluye además el generador de imágenes de Instagram que usa la automatización de Make (ver `melera-templates/README.md`).

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
- Panel `/admin` protegido: pedidos (estado, detalle, origen), stock y consultas (link directo a ig.me / mailto, marcar respondida, archivar). Fechas en hora de Argentina
- `/api/generate` + `/api/img/...`: imágenes de feed y story para Instagram, renderizadas con Chromium en Vercel

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

`NEXTAUTH_SECRET` es obligatoria en producción: sin ella el login de `/admin` falla después de validar usuario y contraseña (el middleware tampoco puede verificar la sesión). Después de cargar o cambiar una variable en Vercel hay que hacer **Redeploy**: los deploys que ya existen no la toman.

Ver `.env.example` para el detalle completo.

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `prisma generate` + build de producción |
| `npm start` | Levanta el build de producción |
| `npx prisma migrate dev --name <nombre>` | Crea una migración nueva a partir de cambios en `schema.prisma` (contra una base de desarrollo) |
| `npx prisma migrate deploy` | Aplica las migraciones pendientes (producción) |
| `npm run db:push` | Sincroniza el schema sin migraciones — ya no se usa desde 2026-09-24 |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Carga datos de ejemplo |

## Base de datos

Desde 2026-09-24 el esquema se maneja con migraciones (`prisma/migrations`). `0_init` es la foto del esquema que existía antes (creado con `db push`) y en Neon se marcó como aplicada con `prisma migrate resolve --applied 0_init`. Los cambios nuevos van como migraciones: crear con `migrate dev` y aplicar en producción con `migrate deploy` **antes** de hacer push del código que las usa.

## Deploy

Pensado para desplegarse en [Vercel](https://vercel.com/) conectando este repo. Configurar las variables de entorno de la tabla anterior en el proyecto de Vercel, usando credenciales reales de Neon y MercadoPago (no las de test).

> Nota: mientras `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` sean valores de test, el checkout no procesa pagos reales.
