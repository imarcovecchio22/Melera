import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consultaSchema } from "@/lib/validation";
import { notifyNuevaConsulta } from "@/lib/consultas";
import { errorMessage, logEvent } from "@/lib/logs";
import { clientIp, demasiadosIntentos } from "@/lib/security";

// Menos que esto desde que se abrió el formulario = lo completó un bot.
const TIEMPO_MINIMO_MS = 3000;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (
    await demasiadosIntentos({ tipo: "consulta", mensajeEmpiezaCon: "Consulta #", ip, maximo: 5, ventanaMinutos: 10 })
  ) {
    await logEvent("consulta", "Consulta bloqueada: demasiadas desde la misma IP", { nivel: "warn", detalle: { ip } });
    return NextResponse.json(
      { ok: false, error: "Recibimos varias consultas seguidas. Esperá unos minutos y volvé a intentar." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "No pudimos leer tu consulta. Intentá de nuevo." },
      { status: 400 }
    );
  }

  const parsed = consultaSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Revisá los datos del formulario.";
    await logEvent("consulta", `Consulta rechazada: ${error}`, { nivel: "warn" });
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  const data = parsed.data;

  // Anti-spam: al bot le decimos que salió bien, pero no se guarda nada.
  if (data.empresa.trim() !== "" || data.tiempo < TIEMPO_MINIMO_MS) {
    await logEvent("consulta", "Spam bloqueado (no se guardó)", {
      nivel: "warn",
      detalle: {
        motivo: data.empresa.trim() !== "" ? "honeypot completo" : `enviado en ${data.tiempo} ms`,
        nombre: data.nombre,
        ip,
      },
    });
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

  await logEvent("consulta", `Consulta #${consulta.id} de ${consulta.nombre}`, {
    detalle: {
      canal: consulta.canal,
      contacto: consulta.instagram ?? consulta.email,
      origen: consulta.origen,
      ip,
    },
  });

  try {
    const enviado = await notifyNuevaConsulta(consulta);
    await logEvent(
      "telegram",
      enviado
        ? `Aviso de consulta #${consulta.id} enviado`
        : `Aviso de consulta #${consulta.id} no enviado: falta configurar el bot`,
      { nivel: enviado ? "info" : "warn" }
    );
  } catch (error) {
    await logEvent("telegram", `Falló el aviso de consulta #${consulta.id}`, {
      nivel: "error",
      detalle: { error: errorMessage(error) },
    });
  }

  return NextResponse.json({ ok: true });
}
