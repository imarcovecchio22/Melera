/**
 * Chequeo de URLs que va a cargar el servidor (sin dependencias, se puede usar en cualquier lado).
 */
const HOSTS_PRIVADOS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /\.internal$/i,
  /\.local$/i,
];

/**
 * true si la URL es https y apunta a un host público. Se usa para URLs que carga
 * el servidor (fotos de producto), así nadie puede hacer que Vercel pida
 * direcciones internas.
 */
export function esUrlPublicaHttps(valor: string) {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  return !HOSTS_PRIVADOS.some((re) => re.test(url.hostname));
}
