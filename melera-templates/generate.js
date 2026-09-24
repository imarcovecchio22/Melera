'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { renderHtmlToJpeg } = require('./render');

function resolveTemplatesDir() {
  if (fs.existsSync(path.join(__dirname, 'organico-presentacion.html'))) {
    return __dirname;
  }
  return path.join(process.cwd(), 'melera-templates');
}

const TEMPLATES_DIR = resolveTemplatesDir();
const OUTPUT_DIR = path.join(__dirname, 'output');

const ESTILOS = ['organico', 'geo'];
const TIPOS = ['presentacion', 'producto', 'dato'];

const REQUIRED_FIELDS = {
  presentacion: ['fecha', 'tagline', 'titulo', 'texto'],
  producto: ['fecha', 'imagen_url', 'nombre_producto', 'precio'],
  dato: ['fecha', 'numero', 'texto_dato'],
};

// Tamaños de render: la misma plantilla se adapta sola a cada formato.
const FORMATOS = {
  feed: { viewport_width: 1080, viewport_height: 1350 },
  story: { viewport_width: 1080, viewport_height: 1920 },
};

// Campos que aceptan <em>/<i> (cursiva color miel) y <br>.
const RICH_FIELDS = ['titulo', 'nombre_producto'];

// Adapta los nombres de campo viejos de la Sheet/Make a los de las plantillas nuevas.
function normalizeData(data) {
  const out = { ...data };
  const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';

  if (!has(out.texto) && has(out.subtitulo)) out.texto = out.subtitulo;

  if (!has(out.caracteristicas)) {
    out.caracteristicas = ['caracteristica_1', 'caracteristica_2', 'caracteristica_3']
      .map((k) => out[k])
      .filter(has)
      .join('|');
  }

  if (has(out.numero) && has(out.sufijo) && !String(out.numero).endsWith(out.sufijo)) {
    out.numero = `${out.numero}${out.sufijo}`;
  }

  if (has(out.precio)) out.precio = formatPrecio(out.precio);

  // el precio ya va grande abajo: no lo repitas como etiqueta
  if (has(out.caracteristicas)) {
    const precioDigits = digitsOf(out.precio);
    out.caracteristicas = String(out.caracteristicas)
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s && !s.includes('$') && !(precioDigits && digitsOf(s) === precioDigits))
      .join('|');
  }

  return out;
}

function digitsOf(value) {
  return String(value || '').replace(/\D/g, '');
}

// "6500" / "6.500" / 6500 -> "$6.500"; si ya trae "$" u otro texto, se deja como está.
function formatPrecio(value) {
  const s = String(value).trim();
  if (!/^[\d.\s]+$/.test(s)) return s;
  return `$${digitsOf(s).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class SignatureError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SignatureError';
    this.statusCode = 403;
  }
}

function validateData(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('El body debe ser un objeto JSON.');
  }

  const { tipo, estilo } = data;
  if (!tipo) {
    throw new ValidationError('Falta el campo "tipo".');
  }
  if (!TIPOS.includes(tipo)) {
    throw new ValidationError(`Tipo "${tipo}" inválido. Debe ser uno de: ${TIPOS.join(', ')}.`);
  }
  if (!estilo) {
    throw new ValidationError('Falta el campo "estilo".');
  }
  if (!ESTILOS.includes(estilo)) {
    throw new ValidationError(
      `Estilo "${estilo}" inválido. Debe ser uno de: ${ESTILOS.join(', ')}.`
    );
  }

  const required = REQUIRED_FIELDS[tipo];
  const missing = required.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new ValidationError(
      `Faltan variables requeridas para el tipo "${tipo}": ${missing.join(', ')}.`
    );
  }
}

function loadTemplate(estilo, tipo) {
  const fileName = `${estilo}-${tipo}.html`;
  const filePath = path.join(TEMPLATES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el template "${fileName}" en ${TEMPLATES_DIR}.`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Escapa todo y después rehabilita solo <em>, <i> y <br>.
function escapeRichHtml(value) {
  return escapeHtml(value)
    .replace(/&lt;(\/?)(em|i)&gt;/gi, '<$1$2>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>');
}

// imagen_url va dentro de url('...') en el CSS: ahí no se decodifican entidades,
// así que solo se sacan los caracteres que podrían romper la regla.
function sanitizeCssUrl(value) {
  return String(value).replace(/['"()\\<>\s]/g, (c) => encodeURIComponent(c));
}

function renderTemplate(html, data) {
  let rendered = html.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (match, varName, truthyBlock, falsyBlock) => {
      return data[varName] ? truthyBlock : falsyBlock || '';
    }
  );

  rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = data[varName];
    if (value === undefined || value === null) return '';
    if (varName === 'imagen_url') return sanitizeCssUrl(value);
    if (RICH_FIELDS.includes(varName)) return escapeRichHtml(value);
    return escapeHtml(value);
  });

  return rendered;
}

// Campos que viajan en la URL de la imagen (el resto no se muestra en las plantillas).
const TOKEN_FIELDS = [
  'tipo', 'estilo', 'fecha',
  'tagline', 'titulo', 'texto', 'cta',
  'numero', 'texto_dato',
  'imagen_url', 'nombre_producto', 'caracteristicas', 'precio',
];

function getSigningSecret() {
  const secret = process.env.IMAGE_SIGNING_SECRET || process.env.GENERATE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Falta IMAGE_SIGNING_SECRET (o GENERATE_WEBHOOK_SECRET) para firmar las URLs.');
  }
  return secret;
}

function sign(payload) {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url')
    .slice(0, 22);
}

// Datos del post -> "<json comprimido>.<firma>", para usar en /api/img/<formato>/<token>.jpg
function createImageToken(data) {
  const normalized = normalizeData(data);
  validateData(normalized);
  const picked = {};
  for (const key of TOKEN_FIELDS) {
    if (normalized[key] !== undefined && normalized[key] !== null && normalized[key] !== '') {
      picked[key] = String(normalized[key]);
    }
  }
  const payload = zlib.deflateRawSync(Buffer.from(JSON.stringify(picked))).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readImageToken(token) {
  // tolera ".jpg" agregados al final (el escenario de stories le suma uno)
  const clean = String(token).replace(/(\.jpe?g)+$/i, '');
  const [payload, signature] = clean.split('.');
  if (!payload || !signature) throw new SignatureError('Token inválido.');
  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new SignatureError('Firma inválida.');
  }
  return JSON.parse(zlib.inflateRawSync(Buffer.from(payload, 'base64url')).toString('utf8'));
}

let logoSrc;
// Logo embebido como data URI (logo.png junto a las plantillas).
function getLogoSrc() {
  if (logoSrc === undefined) {
    const logoPath = path.join(TEMPLATES_DIR, 'logo.png');
    logoSrc = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
      : '';
  }
  return logoSrc;
}

function buildHtml(data) {
  const normalized = { ...normalizeData(data), logo_src: getLogoSrc() };
  validateData(normalized);
  const template = loadTemplate(normalized.estilo, normalized.tipo);
  return renderTemplate(template, normalized);
}

function renderImage(data, formato = 'feed') {
  if (!FORMATOS[formato]) throw new ValidationError(`Formato "${formato}" inválido.`);
  const html = buildHtml(data);
  const { viewport_width: width, viewport_height: height } = FORMATOS[formato];
  return renderHtmlToJpeg(html, { width, height });
}

// URLs públicas de feed (1080x1350) y story (1080x1920) para estos datos.
function buildImageUrls(data, baseUrl) {
  const token = createImageToken(data);
  const base = baseUrl.replace(/\/$/, '');
  return {
    image_url: `${base}/api/img/feed/${token}.jpg`,
    story_image_url: `${base}/api/img/story/${token}.jpg`,
  };
}

// Uso local: guarda feed y story en output/.
async function generateImage(data) {
  const base = `${data.fecha}_${data.estilo}-${data.tipo}`;
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = {};
  for (const formato of Object.keys(FORMATOS)) {
    const filename = formato === 'feed' ? `${base}.jpg` : `${base}_${formato}.jpg`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), await renderImage(data, formato));
    files[formato] = filename;
  }
  return files;
}

module.exports = {
  FORMATOS,
  buildImageUrls,
  createImageToken,
  readImageToken,
  renderImage,
  generateImage,
  normalizeData,
  validateData,
  renderTemplate,
  loadTemplate,
  ValidationError,
  SignatureError,
};

if (require.main === module) {

  const arg = process.argv[2];
  if (!arg) {
    console.error('Uso: node generate.js <archivo.json>  |  node generate.js \'{"tipo": ...}\'');
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.existsSync(arg) ? fs.readFileSync(arg, 'utf8') : arg;
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`No se pudo leer/parsear el JSON de entrada: ${err.message}`);
    process.exit(1);
  }

  generateImage(data)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    })
    .finally(() => require('./render').closeBrowser());
}
