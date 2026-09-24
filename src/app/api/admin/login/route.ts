import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
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

  if (usuario !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const token = await createSessionToken(usuario);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
