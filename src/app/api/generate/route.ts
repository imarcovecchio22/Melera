import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  buildImageUrls,
  ValidationError,
} = require("../../../../melera-templates/generate");

export const runtime = "nodejs";
export const maxDuration = 60;

// Pide una URL y confirma que devuelve una imagen (de paso la deja en la caché de la CDN).
async function warmImage(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) {
    const detail = await res.text().catch(() => "");
    throw new Error(`No se pudo renderizar ${url} (${res.status}): ${detail.slice(0, 300)}`);
  }
  await res.arrayBuffer();
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.GENERATE_WEBHOOK_SECRET;
  if (expectedSecret) {
    const receivedSecret = req.headers.get("x-webhook-secret");
    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  // Make lo manda como formulario (así Gemini puede escribir comillas o saltos de línea
  // sin romper el JSON); también se acepta JSON.
  const contentType = req.headers.get("content-type") || "";
  const body = contentType.includes("application/x-www-form-urlencoded")
    ? Object.fromEntries(
        Array.from((await req.formData().catch(() => new FormData())).entries()).map(
          ([key, value]) => [key, String(value)]
        )
      )
    : await req.json().catch(() => null);
  if (!body || !Object.keys(body).length) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  let urls: { image_url: string; story_image_url: string };
  try {
    const baseUrl = process.env.PUBLIC_BASE_URL || req.nextUrl.origin;
    urls = buildImageUrls(body, baseUrl);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error generando URLs IG:", error);
    return NextResponse.json({ error: `Error interno: ${error?.message}` }, { status: 500 });
  }

  try {
    await Promise.all([warmImage(urls.image_url), warmImage(urls.story_image_url)]);
  } catch (error: any) {
    console.error("Error renderizando imagen IG:", error);
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({
    ...urls,
    filename: `${body.fecha}_${body.estilo}-${body.tipo}.jpg`,
  });
}
