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
  presentacion: ['fecha', 'tagline', 'titulo', 'subtitulo', 'tag_inferior'],
  producto: [
    'fecha',
    'categoria',
    'nombre_producto',
    'descripcion',
    'caracteristica_1',
    'caracteristica_2',
    'caracteristica_3',
    'precio',
    'presentacion',
    'cta',
  ],
  dato: ['fecha', 'intro_label', 'numero', 'sufijo', 'unidad', 'texto_dato', 'hashtags'],
};

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

function renderTemplate(html, data) {
  let rendered = html.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (match, varName, truthyBlock, falsyBlock) => {
      return data[varName] ? truthyBlock : falsyBlock || '';
    }
  );

  rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = data[varName];
    return value === undefined || value === null ? '' : escapeHtml(value);
  });

  return rendered;
}

async function callHcti(html) {
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
        viewport_width: 1080,
        viewport_height: 1080,
        selector: 'body',
        google_fonts:
          'Playfair Display:400,400i,700|Lato:300,400|Space Grotesk:300,400,600,700',
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

async function generateImageUrl(data) {
  validateData(data);
  const template = loadTemplate(data.estilo, data.tipo);
  const html = renderTemplate(template, data);
  return callHcti(html);
}

async function generateImage(data) {
  const imageUrl = await generateImageUrl(data);
  const filename = `${data.fecha}_${data.estilo}-${data.tipo}.png`;
  const filePath = path.join(OUTPUT_DIR, filename);
  await downloadImage(imageUrl, filePath);
  return { image_url: imageUrl, filename };
}

module.exports = {
  generateImage,
  generateImageUrl,
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
