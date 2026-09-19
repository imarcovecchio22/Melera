'use strict';

require('dotenv').config();

const express = require('express');
const { generateImage, ValidationError, HctiError } = require('./generate');

const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  try {
    const result = await generateImage(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof HctiError) {
      return res.status(err.statusCode || 502).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: `Error interno: ${err.message}` });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Melera IG image generator escuchando en http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/generate`);
});
