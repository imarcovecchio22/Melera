# Melera

Tienda online de miel artesanal — landing, ficha de producto, checkout con MercadoPago y panel de administración de pedidos y stock.

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
- Panel `/admin` protegido: gestión de pedidos (estado, detalle) y stock

## Desarrollo local

### Requisitos

- Node.js 20+
- Una base PostgreSQL accesible (local vía Docker o remota)

### Setup

```bash
npm install
cp .env.example .env.local   # completar con tus valores, ver tabla abajo
npx prisma db push           # crea las tablas en la base indicada por DATABASE_URL
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

Ver `.env.example` para el detalle completo.

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `prisma generate` + build de producción |
| `npm start` | Levanta el build de producción |
| `npm run db:push` | Sincroniza el schema de Prisma con la base |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Carga datos de ejemplo |

## Deploy

Pensado para desplegarse en [Vercel](https://vercel.com/) conectando este repo. Configurar las variables de entorno de la tabla anterior en el proyecto de Vercel, usando credenciales reales de Neon y MercadoPago (no las de test).

> Nota: mientras `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` sean valores de test, el checkout no procesa pagos reales.
