import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-5";
const MAX_TURNS = 20;

function buildSystemPrompt() {
  const whatsapp = process.env.WHATSAPP_NUMBER;
  const whatsappLine = whatsapp
    ? `- WhatsApp de contacto: ${whatsapp}`
    : "- WhatsApp de contacto: consultá en la web";

  return `Sos el asistente virtual de Melera, una marca de miel artesanal de Tomás Jofré, Buenos Aires. Respondés preguntas de clientes de forma amigable, breve y en español rioplatense informal (tuteás). Solo respondés preguntas relacionadas con Melera y la miel. Si te preguntan algo que no tiene que ver, redirigís amablemente.

Información que conocés:
- Producto: Miel Artesanal 500g, frasco de vidrio, $6.500
- Elaboración: producida por Apícola Mercedes en Tomás Jofré, Bs As. 100% artesanal, sin aditivos, sin procesos industriales, sin azúcar agregada, sin conservantes. Las abejas recolectan néctar de flores silvestres de la zona.
- Envíos: Mercado Envíos para compras por Mercado Libre. Para compras directas: Correo Argentino al interior del país, Rappi para envíos en CABA el mismo día. El costo de envío lo paga el cliente.
- Pago: Mercado Pago, transferencia bancaria/CVU, efectivo solo en retiro personal.
- Retiro personal: disponible, se coordina por WhatsApp.
- Compras mayoristas: disponibles, se consultan por WhatsApp.
${whatsappLine}
- Sitio web: melera.vercel.app
- Para comprar: redirigí siempre a la página de producto en melera.vercel.app/producto o al WhatsApp.

Si no sabés algo, decís que se comuniquen por WhatsApp.`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("El asistente no está configurado todavía.", { status: 500 });
  }

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages)) throw new Error("invalid body");
    messages = body.messages
      .filter(
        (m: unknown): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string"
      )
      .slice(-MAX_TURNS);
  } catch {
    return new Response("Solicitud inválida.", { status: 400 });
  }

  if (messages.length === 0) {
    return new Response("Solicitud inválida.", { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const anthropicStream = client.messages.stream({
          model: MODEL,
          max_tokens: 500,
          system: buildSystemPrompt(),
          messages,
        });

        anthropicStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (err) {
        console.error("Error en /api/chat:", err);
        controller.enqueue(
          encoder.encode("Uy, tuvimos un problema para responder. Probá de nuevo en un rato o escribinos por WhatsApp.")
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
