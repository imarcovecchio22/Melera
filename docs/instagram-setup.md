# Respuestas automáticas de Instagram: configuración en Meta

Paso a paso de lo que hay que hacer **a mano** en Meta for Developers para que la web responda sola los DMs y comentarios de @melera.miel (reemplazando a ManyChat). El código ya está: webhook en `/api/instagram/webhook`, reglas en `/admin/autorespuestas`, renovación del token en el cron diario `/api/cron/instagram-token`.

> **Estado (2026-09-24):** pasos 1 a 8 hechos. La app está en Live, el webhook verificado, la regla #1 activa y ManyChat suspendido. Los DMs funcionan sin App Review (probado con una cuenta sin rol en la app). Los secretos se rotaron después de la configuración. Pendiente solo el paso 9 (comentarios), sin apuro.

Esto usa la **Instagram API con Instagram Login** (`graph.instagram.com`). Es independiente de la publicación de posts, que sigue usando el token de página de Facebook (`META_PAGE_TOKEN`): nada de esto la toca.

> Documentación de Meta consultada en septiembre de 2026 (Graph API v25.0). Si alguna pantalla del panel cambió de nombre, buscá el equivalente.

## Lo importante primero: la revisión de Meta

| Qué | Qué pide Meta | Qué significa para Melera |
|---|---|---|
| **DMs** (`messages`) | Acceso estándar si la app atiende **tu propia cuenta**; la app tiene que estar en modo **Live** | En principio **no hace falta App Review**. Hay que confirmarlo en la práctica (paso 7). |
| **Comentarios** (`comments`) | **Acceso avanzado** para recibir el webhook de comentarios | Requiere App Review (con un video mostrando el uso) y **Verificación del negocio**. Sin eso, los comentarios no llegan y la web solo responde DMs. |

Hay una contradicción en la documentación: la página del webhook marca "Advanced Access / Business Verification: Required" en general, y la de mensajería dice que alcanza con el acceso estándar para una cuenta propia. Por eso el paso 7 es una prueba real **antes** de apagar ManyChat: mientras tanto ManyChat sigue respondiendo y no se pierde nada.

## 1. Crear la app

1. Entrá a <https://developers.facebook.com/apps> con la cuenta de Facebook que administra Melera → **Crear app**.
2. Caso de uso: **"Administrar mensajes y contenido en Instagram"** (Instagram API). Tipo: **Negocio**.
3. Nombre sugerido: `Melera Respuestas`. Recomiendo una app **nueva** y no la que ya publica los posts: así cualquier cambio de modo o de revisión no puede afectar la publicación.

## 2. Datos de la app → variables

En el caso de uso de Instagram → **Configuración de la API con inicio de sesión con Instagram**:

- **Identificador de la app de Instagram** → `IG_APP_ID`
- **Clave secreta de la app de Instagram** → `IG_APP_SECRET` (ojo: es la de *Instagram*, no la "clave secreta de la app" de Configuración básica; con la otra, la firma del webhook no valida y todo da 401)

## 3. Conectar @melera.miel y sacar el token

1. En la misma pantalla, **Generar tokens de acceso** → **Agregar cuenta** → iniciá sesión con @melera.miel y aceptá los permisos (`instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`).
2. Copiá el **token** que aparece → `IG_ACCESS_TOKEN` (es de larga duración, 60 días; después la web lo renueva sola).
3. Copiá el **id de la cuenta** que aparece al lado del nombre → `IG_USER_ID`.
4. En la app de Instagram (celular): **Configuración → Mensajes y respuestas a historias → Controles de mensajes → Herramientas conectadas → Permitir acceso a los mensajes** tiene que estar **activado** (sin esto no llegan los DMs).

## 4. Variables en Vercel

En Vercel → Settings → Environment Variables, para **Production y Preview**:

| Variable | Valor |
|---|---|
| `IG_APP_ID` | del paso 2 |
| `IG_APP_SECRET` | del paso 2 |
| `IG_WEBHOOK_VERIFY_TOKEN` | un texto largo al azar que inventás vos (se usa en el paso 5) |
| `IG_ACCESS_TOKEN` | del paso 3 |
| `IG_USER_ID` | del paso 3 |

`CRON_SECRET`, `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` ya existen. Después de cargarlas, **Redeploy**. En `/admin/autorespuestas` el aviso de "faltan variables" tiene que desaparecer.

## 5. Webhook

En el caso de uso de Instagram → **Configurar webhooks**:

1. **URL de devolución de llamada:** `https://melera.vercel.app/api/instagram/webhook` (la muestra también `/admin/autorespuestas`).
2. **Token de verificación:** el mismo `IG_WEBHOOK_VERIFY_TOKEN`.
3. **Verificar y guardar.** Si falla, revisá que la variable esté en Production y que hayas hecho el redeploy.
4. Suscribite a los campos **`messages`** y **`comments`**.
5. En la lista de cuentas, activá la **suscripción a webhooks** de @melera.miel.

## 6. Pasar la app a Live

1. En **Configuración básica** de la app: **URL de la política de privacidad** = `https://melera.vercel.app/privacidad`. Si pide URL de eliminación de datos o instrucciones: `https://melera.vercel.app/privacidad#borrar-datos`. Categoría: Compras.
2. Cambiá el modo de **Desarrollo** a **Live** (switch arriba del panel).

## 7. Prueba real (con ManyChat todavía encendido)

La regla "Bienvenida (como ManyChat)" viene **desactivada**, así que la web registra los mensajes pero no contesta: ManyChat sigue siendo el que responde.

1. Pedile a alguien **que no tenga ningún rol en la app** que le mande un DM a @melera.miel con la palabra "precio".
2. En `/admin/autorespuestas` → **Últimos mensajes recibidos** tiene que aparecer el DM como "Sin coincidencia".
   - **Aparece** → los DMs funcionan sin revisión. Seguí con el paso 8.
   - **No aparece** (y en `/admin/logs` no hay errores) → Meta no entrega mensajes de terceros sin acceso avanzado. Hay que pedir App Review para `instagram_business_manage_messages` (paso 9) y **no** apagar ManyChat todavía.
3. Lo mismo con un comentario en un post. Lo esperable es que **no** llegue hasta tener acceso avanzado.

## 8. Pasar de ManyChat a la web sin quedar sin respuestas ni con respuestas dobles

1. En `/admin/autorespuestas`, revisá la regla con el **Probador** ("hola, cuánto sale la miel?" → tiene que mostrar el texto con el precio y los dos botones).
2. En ManyChat, **pausá la automatización por palabra clave** (o desconectá Instagram de ManyChat: Settings → Instagram → Disconnect).
3. **Enseguida**, en `/admin/autorespuestas`, **activá** la regla.
4. Pedile a alguien que mande "precio" por DM: tiene que llegar una sola respuesta, con los botones, y figurar como "Respondido".
5. Si algo sale mal, desactivá la regla y volvé a encender ManyChat: es reversible en un minuto.

Entre el paso 2 y el 3 puede pasar un minuto sin respuestas automáticas. Es preferible a que respondan los dos.

## 9. (Si hace falta) App Review y Verificación del negocio

Para comentarios (y para DMs si la prueba del paso 7 falla):

1. **Verificación del negocio** en el Business Manager de Melera (documentación del emprendimiento: CUIT/monotributo, un comprobante con el nombre y la dirección). Puede tardar días.
2. **App Review** → pedir **acceso avanzado** para `instagram_business_manage_messages` y `instagram_business_manage_comments`, con un video corto mostrando: alguien comenta o manda "precio" → llega la respuesta automática → la regla en `/admin/autorespuestas`.
3. Mientras está en revisión, ManyChat sigue respondiendo los comentarios (se puede dejar ManyChat solo para comentarios y la web para los DMs, siempre que no haya reglas de DM encendidas en los dos).

## Mantenimiento

- **Token:** el cron diario lo renueva cuando le quedan menos de 15 días. Si falla, llega un aviso por Telegram. También se puede renovar desde `/admin/autorespuestas` con "Renovar ahora". Si se venció del todo, generá uno nuevo (paso 3), cargalo en `IG_ACCESS_TOKEN` y hacé redeploy: la web detecta que cambió y lo toma.
- **Límite entre respuestas:** a una misma cuenta no se le repite la misma regla por 2 h (aparece como "Ignorado"). Para probar varias veces seguidas desde la misma cuenta, tocá **"Reiniciar límite (para pruebas)"** en la tabla de mensajes recibidos.
- **Errores:** con 5 respuestas fallidas seguidas llega un aviso por Telegram. El detalle de cada error está en la tabla de mensajes recibidos y en `/admin/logs`.
- **Límites de Meta que respeta la web:** los DMs se responden dentro de las 24 h del mensaje; a un comentario se le manda **un solo** DM privado, dentro de los 7 días.
