import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { logEvent } from "@/lib/logs";
import { clientIp, demasiadosIntentos, safeEqual } from "@/lib/security";

const MAX_FALLIDOS = 5;
const VENTANA_MINUTOS = 15;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (
    await demasiadosIntentos({
      tipo: "admin",
      mensajeEmpiezaCon: "Login fallido",
      ip,
      maximo: MAX_FALLIDOS,
      ventanaMinutos: VENTANA_MINUTOS,
    })
  ) {
    await logEvent("admin", "Login bloqueado por demasiados intentos", { nivel: "warn", detalle: { ip } });
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Probá de nuevo en ${VENTANA_MINUTOS} minutos.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const usuario = body?.usuario;
  const password = body?.password;

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "El servidor no tiene configuradas las credenciales de admin." },
      { status: 500 }
    );
  }

  // Sin esto la sesión no se puede firmar y la ruta devolvía un 500 vacío.
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { error: "El servidor no tiene configurada la variable NEXTAUTH_SECRET." },
      { status: 500 }
    );
  }

  // Se evalúan las dos comparaciones siempre, para no revelar cuál falló por el tiempo.
  const usuarioOk = safeEqual(usuario, ADMIN_USER);
  const passwordOk = safeEqual(password, ADMIN_PASSWORD);
  if (!usuarioOk || !passwordOk) {
    await logEvent("admin", "Login fallido", {
      nivel: "warn",
      detalle: { usuario: String(usuario ?? "").slice(0, 80), ip },
    });
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const token = await createSessionToken(usuario);
  await setSessionCookie(token);
  await logEvent("admin", `Login de ${usuario}`, { detalle: { ip } });

  return NextResponse.json({ ok: true });
}
