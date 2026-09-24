-- Regla equivalente a la de ManyChat. Se crea DESACTIVADA para que no contesten los dos
-- a la vez: se activa desde /admin/autorespuestas en el momento de desconectar ManyChat.
-- $PRECIO se reemplaza por el precio del producto al momento de responder.
INSERT INTO "AutoRespuesta" ("nombre", "palabrasClave", "coincidencia", "canal", "respuesta", "botones", "respuestaPublicaComentario", "prioridad", "activa", "updatedAt")
VALUES (
  'Bienvenida (como ManyChat)',
  ARRAY['miel', 'precio', 'comprar', 'pedido', 'info'],
  'contiene',
  'ambos',
  '¡Hola! 🐝 Gracias por escribirle a Melera. Tenemos miel artesanal pura de Tomás Jofré, frasco de 500 g a $PRECIO. ¿En qué te ayudamos?',
  '[{"titulo": "🍯 Quiero comprar", "url": "https://melera.vercel.app/producto?origen=instagram"}, {"titulo": "💬 Tengo una consulta", "url": "https://melera.vercel.app/consultas?origen=instagram"}]'::jsonb,
  '¡Te mandamos un DM! 🐝',
  10,
  false,
  CURRENT_TIMESTAMP
);
