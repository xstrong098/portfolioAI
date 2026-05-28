const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const sharp = require('sharp');
const Work = require('../models/Work');

/* estrae la palette colori dall'immagine usando sharp */
async function extractColorPalette(imgPath) {
  try {
    /* rimpicciolisco a 100x100 così non processo milioni di pixel */
    const { data } = await sharp(imgPath)
      .resize(100, 100, { fit: 'inside' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = [];
    for (let i = 0; i < data.length; i += 3) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    /* campiono un pixel ogni 20 per velocizzare */
    const sampled = pixels.filter((_, i) => i % 20 === 0);

    /* raggruppo colori simili arrotondando a multipli di 32 */
    const buckets = {};
    sampled.forEach(([r, g, b]) => {
      const rk = Math.round(r / 32) * 32;
      const gk = Math.round(g / 32) * 32;
      const bk = Math.round(b / 32) * 32;
      const key = `${rk},${gk},${bk}`;
      if (!buckets[key]) buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
      buckets[key].count++;
      buckets[key].r += r;
      buckets[key].g += g;
      buckets[key].b += b;
    });

    /* prendo i 5 colori più frequenti */
    const sorted = Object.values(buckets).sort((a, b) => b.count - a.count).slice(0, 5);
    return sorted.map(({ count, r, g, b }) => {
      const avg_r = Math.round(r / count);
      const avg_g = Math.round(g / count);
      const avg_b = Math.round(b / count);
      return '#' + [avg_r, avg_g, avg_b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');
    });
  } catch (e) {
    console.error('Palette extraction error:', e.message);
    /* palette di fallback se qualcosa va storto */
    return ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#F5F5F5'];
  }
}

/* genera la descrizione testuale con claude */
async function callClaudeText(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.content?.[0]?.text || null;
}

/* genera la descrizione di fallback senza chiamare l'ai */
function generateFallbackDescription(work) {
  const styles = {
    'Minimalist': 'caratterizzata da linee pulite ed essenzialità compositiva',
    'Brutalist': 'con un approccio grezzo e diretto alla comunicazione visiva',
    'Art Deco': "che evoca il lusso geometrico degli anni '20 e '30",
    'Swiss Style': 'nel rigore tipografico della scuola svizzera',
    'Maximalist': "nell'abbondanza cromatica e compositiva",
  };
  const styleDesc = styles[work.style_category] || "con un'identità visiva distintiva";
  return `Opera di design grafico ${styleDesc}. Realizzata con ${work.tools_used || 'strumenti professionali'}, questa composizione esprime la visione creativa del designer attraverso scelte formali precise e intenzionali.`;
}

function generateFallbackTags(work) {
  const base = ['graphic design', 'digital art', 'creative work'];
  if (work.style_category) base.unshift(work.style_category.toLowerCase());
  if (work.tools_used) work.tools_used.split(',').forEach(t => base.push(t.trim().toLowerCase()));
  return base.slice(0, 5).join(', ');
}

/* controller per le api */
const apiController = {

  async analyzeWork(req, res) {
    try {
      const work = await Work.findOwned(req.params.workId, req.session.user.id);
      if (!work) return res.status(404).json({ error: 'Opera non trovata' });

      const imgPath = path.join(__dirname, '../public', work.image_path);
      if (!fs.existsSync(imgPath)) return res.status(404).json({ error: 'File immagine non trovato' });

      let aiDescription = '';
      let aiTags = '';

      const colorPalette = await extractColorPalette(imgPath);

      /* mando l'immagine a claude per la descrizione */
      try {
        const imageData = fs.readFileSync(imgPath);
        const base64Image = imageData.toString('base64');
        const ext = path.extname(work.image_path).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.gif') mimeType = 'image/gif';

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } },
                {
                  type: 'text',
                  text: `Sei un critico d'arte e designer professionista. Analizza questa opera grafica e rispondi SOLO con un JSON valido (nessun testo prima o dopo):
{"description": "descrizione professionale in italiano di 2-3 frasi evocative", "tags": "tag1, tag2, tag3, tag4, tag5"}
La descrizione deve essere professionale. I tag devono descrivere stile, colori, tecnica e tema.`
                }
              ]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.content?.[0]?.text || '';
          try {
            const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
            if (parsed.description) aiDescription = parsed.description;
            if (parsed.tags) aiTags = parsed.tags;
          } catch (e) {
            if (text) aiDescription = text.substring(0, 300);
          }
        }
      } catch (apiErr) {
        console.error('Claude API error:', apiErr.message);
      }

      if (!aiDescription) {
        aiDescription = generateFallbackDescription(work);
        aiTags = generateFallbackTags(work);
      }

      await Work.updateAiData(work.id, { aiDescription, aiTags, colorPalette });
      res.json({ success: true, description: aiDescription, tags: aiTags, palette: colorPalette });

    } catch (err) {
      console.error('Analysis error:', err);
      res.status(500).json({ error: "Errore durante l'analisi" });
    }
  },

  async generateDescription(req, res) {
    const { title, style_category, tools_used, tags } = req.body;
    try {
      const text = await callClaudeText(`Genera una descrizione professionale (2-3 frasi) per un'opera grafica:
- Titolo: ${title}
- Stile: ${style_category || 'Non specificato'}
- Strumenti: ${tools_used || 'Non specificato'}
- Tag: ${tags || 'graphic design'}
Rispondi solo con la descrizione in italiano, nessun altro testo.`);

      if (text) return res.json({ success: true, description: text });
    } catch (e) {
      console.error('Generate description error:', e.message);
    }

    /* fallback se l'ai non risponde */
    res.json({
      success: true,
      description: `Un'opera che esprime la creatività del designer attraverso ${style_category || 'un approccio unico'}, realizzata con ${tools_used || 'strumenti professionali'}.`
    });
  },

  async searchWorks(req, res) {
    try {
      const works = await Work.search(req.query);
      res.json({ works });
    } catch (err) {
      res.status(500).json({ error: 'Errore di ricerca' });
    }
  }
};

module.exports = apiController;
