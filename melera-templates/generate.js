'use strict';

const fs = require('fs');
const path = require('path');

function resolveTemplatesDir() {
  if (fs.existsSync(path.join(__dirname, 'organico-presentacion.html'))) {
    return __dirname;
  }
  return path.join(process.cwd(), 'melera-templates');
}

const TEMPLATES_DIR = resolveTemplatesDir();
const OUTPUT_DIR = path.join(__dirname, 'output');
const HCTI_ENDPOINT = 'https://hcti.io/v1/image';

const ESTILOS = ['organico', 'geo'];
const TIPOS = ['presentacion', 'producto', 'dato'];

const REQUIRED_FIELDS = {
  presentacion: ['fecha', 'tagline', 'titulo', 'texto'],
  producto: ['fecha', 'imagen_url', 'nombre_producto', 'caracteristicas', 'precio'],
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

  return out;
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class HctiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'HctiError';
    this.statusCode = statusCode || 502;
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

async function callHcti(html, formato = 'feed') {
  const userId = process.env.HCTI_USER_ID;
  const apiKey = process.env.HCTI_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      'Faltan las variables de entorno HCTI_USER_ID y/o HCTI_API_KEY.'
    );
  }

  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');

  let response;
  try {
    response = await fetch(HCTI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        html,
        ...FORMATOS[formato],
        selector: 'body',
        // da tiempo a que carguen las fuentes y corra el script que achica textos largos
        ms_delay: 500,
        google_fonts: 'Fraunces:400,400i,500i,600,700|Poppins:400,500,600',
      }),
    });
  } catch (err) {
    throw new HctiError(`No se pudo conectar con htmlcsstoimage.com: ${err.message}`);
  }

  const bodyText = await response.text();
  let bodyJson;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = null;
  }

  if (!response.ok) {
    const detail = bodyJson?.error || bodyJson?.message || bodyText || response.statusText;
    throw new HctiError(
      `htmlcsstoimage.com devolvió un error (${response.status}): ${detail}`,
      response.status
    );
  }

  if (!bodyJson?.url) {
    throw new HctiError('La respuesta de htmlcsstoimage.com no incluyó una URL de imagen.');
  }

  return bodyJson.url;
}

async function downloadImage(imageUrl, filePath) {
  let response;
  try {
    response = await fetch(imageUrl);
  } catch (err) {
    throw new HctiError(`No se pudo descargar la imagen generada: ${err.message}`);
  }
  if (!response.ok) {
    throw new HctiError(
      `No se pudo descargar la imagen generada (${response.status} ${response.statusText}).`
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
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

async function generateImageUrl(data, formato = 'feed') {
  return callHcti(buildHtml(data), formato);
}

// Genera feed (1080x1350) y story (1080x1920) con la misma plantilla.
async function generateImageUrls(data) {
  const html = buildHtml(data);
  const [imageUrl, storyImageUrl] = await Promise.all([
    callHcti(html, 'feed'),
    callHcti(html, 'story'),
  ]);
  return { image_url: imageUrl, story_image_url: storyImageUrl };
}

async function generateImage(data) {
  const urls = await generateImageUrls(data);
  const base = `${data.fecha}_${data.estilo}-${data.tipo}`;
  await downloadImage(urls.image_url, path.join(OUTPUT_DIR, `${base}.png`));
  await downloadImage(urls.story_image_url, path.join(OUTPUT_DIR, `${base}_story.png`));
  return { ...urls, filename: `${base}.png`, story_filename: `${base}_story.png` };
}

module.exports = {
  generateImage,
  generateImageUrl,
  generateImageUrls,
  normalizeData,
  validateData,
  renderTemplate,
  loadTemplate,
  ValidationError,
  HctiError,
};

if (require.main === module) {
  require('dotenv').config();

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
      process.exit(1);
    });
}
