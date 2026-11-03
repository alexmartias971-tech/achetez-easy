// Relais du catalogue pour l'aperçu Vercel.
// Équivalent JavaScript de api/vehicules.php : le navigateur n'interroge que
// cette fonction (même domaine que l'aperçu), jamais le back-office directement.
// Seuls les champs utiles à l'affichage sont renvoyés ; les prix d'achat
// fournisseur présents dans les options sont retirés.

// Adresse du catalogue fournie par la variable d'environnement CATALOGUE_SOURCE
// (définie dans les réglages Vercel) : elle n'apparaît pas dans le dépôt.
const SOURCE = process.env.CATALOGUE_SOURCE || '';
const TERRITORIES = { GP: 'GP', GF: 'GF', Guadeloupe: 'GP', Guyane: 'GF' };
const PHOTO = /^\/?photos\.php\?p=[A-Za-z0-9%._/-]{1,300}$/;
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const TTL = 10 * 60 * 1000;
const cache = new Map();

const text = (v, max = 200) => {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  return String(v)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);
};

function list(value, maxItems, maxLength, strip = false) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    let s = text(item, maxLength);
    if (strip) s = s.replace(/\s*\[[\d\s.,]*\]\s*$/, '').trim();
    if (s) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function photos(value, max) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const url of value) {
    if (typeof url === 'string' && PHOTO.test(url)) out.push('/' + url.replace(/^\/+/, ''));
    if (out.length >= max) break;
  }
  return out;
}

function clean(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const price = Number(raw.price);
  if (!ID.test(id) || !Number.isFinite(price) || price <= 0) return null;
  return {
    id,
    make: text(raw.make, 60),
    model: text(raw.model, 80),
    version: text(raw.version, 160),
    trim: text(raw.trim, 80),
    color: text(raw.color, 80),
    energy: text(raw.energy, 60),
    gearbox: text(raw.gearbox, 60),
    power: text(raw.power, 10),
    mileage: text(raw.mileage, 10),
    firstDate: text(raw.firstDate, 20),
    warranty: text(raw.warranty, 10),
    co2: text(raw.co2, 10),
    cylinder: text(raw.cylinder, 10),
    category: text(raw.category, 40),
    price: Math.round(price * 100) / 100,
    photos: photos(raw.photos, 30),
    equipments: list(raw.equipments || raw.equipment, 200, 400),
    options: list(raw.options, 120, 300, true),
    packs: list(raw.packs, 60, 300, true),
  };
}

const summary = (v) => ({
  id: v.id, make: v.make, model: v.model, version: v.version, trim: v.trim,
  energy: v.energy, gearbox: v.gearbox, mileage: v.mileage, category: v.category,
  price: v.price, photos: v.photos.slice(0, 2),
});

async function load(code) {
  const hit = cache.get(code);
  if (hit && Date.now() - hit.time < TTL) return hit;
  if (!SOURCE) return hit || null;
  const sep = SOURCE.includes('?') ? '&' : '?';
  try {
    const res = await fetch(`${SOURCE}${sep}territory=${encodeURIComponent(code)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data || data.territory !== code || !Array.isArray(data.vehicles)) throw new Error('invalide');
    const vehicles = data.vehicles.map(clean).filter(Boolean);
    if (!vehicles.length) throw new Error('vide');
    const fresh = { time: Date.now(), vehicles };
    cache.set(code, fresh);
    return fresh;
  } catch (err) {
    return hit || null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const send = (status, payload, maxAge) => {
    res.statusCode = status;
    res.setHeader('Cache-Control', status === 200 && maxAge ? `public, max-age=${maxAge}` : 'no-store');
    res.end(JSON.stringify(payload));
  };

  const query = new URL(req.url, 'https://preview').searchParams;
  const code = TERRITORIES[query.get('territoire') || ''];
  if (!code) return send(400, { error: 'Territoire invalide' });
  const view = query.get('vue') || 'complet';
  if (view !== 'complet' && view !== 'resume') return send(400, { error: 'Vue invalide' });
  const id = query.get('id');
  if (id !== null && !ID.test(id)) return send(400, { error: 'Référence invalide' });

  const data = await load(code);
  if (!data) {
    res.setHeader('Retry-After', '120');
    return send(503, { error: 'Catalogue momentanément indisponible' });
  }
  const updated = new Date(data.time).toISOString();
  if (id !== null) {
    const vehicle = data.vehicles.find((v) => v.id === id);
    return vehicle
      ? send(200, { territory: code, updated, vehicle }, 300)
      : send(404, { error: 'Véhicule introuvable' });
  }
  const vehicles = view === 'resume' ? data.vehicles.map(summary) : data.vehicles;
  return send(200, { territory: code, updated, count: vehicles.length, vehicles }, 300);
};
