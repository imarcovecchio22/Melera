import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  generateImageUrls,
  ValidationError,
  HctiError,
} = require("../../../../melera-templates/generate");

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.GENERATE_WEBHOOK_SECRET;
  if (expectedSecret) {
    const receivedSecret = req.headers.get("x-webhook-secret");
    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  try {
    const { image_url, story_image_url } = await generateImageUrls(body);
    return NextResponse.json({
      image_url,
      story_image_url,
      filename: `${body.fecha}_${body.estilo}-${body.tipo}.png`,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof HctiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 502 }
      );
    }
    console.error("Error generando imagen IG:", error);
    return NextResponse.json(
      { error: `Error interno: ${error?.message}` },
      { status: 500 }
    );
  }
}
