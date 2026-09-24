'use strict';

const fs = require('fs');

// En Vercel (Linux) usa el Chromium de @sparticuz/chromium; en local, Chrome/Edge instalado
// (o el que indique CHROME_PATH).
const LOCAL_BROWSERS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

let browserPromise;

async function launchBrowser() {
  const { default: puppeteer } = await import('puppeteer-core');

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const { default: chromium } = await import('@sparticuz/chromium');
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const executablePath = LOCAL_BROWSERS.find((p) => fs.existsSync(p));
  if (!executablePath) {
    throw new Error('No se encontró Chrome/Edge local. Definí CHROME_PATH.');
  }
  return puppeteer.launch({ executablePath, headless: true });
}

// Reutiliza el navegador mientras la función siga "caliente".
async function getBrowser() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser && browser.connected) return browser;
  }
  browserPromise = launchBrowser();
  return browserPromise;
}

async function renderHtmlToJpeg(html, { width, height }) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 });
    // fuentes cargadas + script que achica textos largos
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 300));
    });
    return Buffer.from(await page.screenshot({ type: 'jpeg', quality: 92 }));
  } finally {
    await page.close().catch(() => {});
  }
}

async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = undefined;
  if (browser) await browser.close().catch(() => {});
}

module.exports = { renderHtmlToJpeg, closeBrowser };
