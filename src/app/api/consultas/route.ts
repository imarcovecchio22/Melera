import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consultaSchema } from "@/lib/validation";
import { notifyNuevaConsulta } from "@/lib/consultas";

// Menos que esto desde que se abrió el formulario = lo completó un bot.
const TIEMPO_MINIMO_MS = 3000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "No pudimos leer tu consulta. Intentá de nuevo." },
      { status: 400 }
    );
  }

  const parsed = consultaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos del formulario." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Anti-spam: al bot le decimos que salió bien, pero no se guarda nada.
  if (data.empresa.trim() !== "" || data.tiempo < TIEMPO_MINIMO_MS) {
    return NextResponse.json({ ok: true });
  }

  const consulta = await prisma.consulta.create({
    data: {
      nombre: data.nombre,
      canal: data.canal,
      instagram: data.canal === "instagram" ? `@${data.instagram}` : null,
      email: data.canal === "email" ? data.email : null,
      mensaje: data.mensaje,
      origen: data.origen || null,
    },
  });

  try {
    await notifyNuevaConsulta(consulta);
  } catch (error) {
    console.error("Error notificando consulta nueva a Make:", error);
  }

  return NextResponse.json({ ok: true });
}
