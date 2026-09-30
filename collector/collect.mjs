// Vantaan hoitourakan keliaineiston keruu – ajetaan GitHub Actionsissa kerran tunnissa.
// Tallentaa jokaiselta urakan tiesääasemalta mittaukset, lähimmän tiekohdan tienpintaennusteen,
// Ilmatieteen laitoksen ennusteen (+2, +6, +12 h) sekä tiedon suolauksesta/aurauksesta lähellä asemaa.
// Lähteet: Fintraffic / Digitraffic ja Ilmatieteen laitos (CC BY 4.0).
import fs from 'node:fs/promises';

const DT = 'https://tie.digitraffic.fi';
const HDR = {headers: {'Digitraffic-User': 'Vantaa-urakka-keliennuste', 'Accept-Encoding': 'gzip'}};
const CONTRACT = 301;
const BBOX = [24.55, 60.15, 25.45, 60.50];
const FMI_POINT = '60.30,24.97';
const COLS = ['t','st','tr','ta','td','tf','salt','water','snow','ice','fric','keli','warn','ws','seg','fc_obs','fc2','fc4','fc6','fc12','c2','c4','c6','c12',
  'f2_t','f2_td','f2_p','f2_cc','f2_sym','f6_t','f6_td','f6_p','f6_cc','f6_sym','f12_t','f12_td','f12_p','f12_cc','f12_sym','salted1h','plowed1h'];
const PLOW = ['PLOUGHING_AND_SLUSH_REMOVAL','PLOUGHING_OF_SLUSH_DITCH','LOWERING_OF_SNOWBANKS','REMOVAL_OF_BULGE_ICE','TRANSFER_OF_SNOW'];

const M_LAT = 111320, M_LON = 111320 * Math.cos(60.3 * Math.PI / 180);
const iso = t => new Date(t).toISOString().replace(/\.\d+Z$/, 'Z');

export async function collectRows(get, getText, cachedStations){
  // 1. Urakan asemat (välimuisti 7 vrk)
  let stations = cachedStations;
  if(!stations){
    const list = await get(DT + '/api/weather/v1/stations');
    const cand = list.features.filter(f => { const [x, y] = f.geometry.coordinates; return x >= BBOX[0] && x <= BBOX[2] && y >= BBOX[1] && y <= BBOX[3] && f.properties.collectionStatus === 'GATHERING'; });
    const det = await Promise.all(cand.map(f => get(DT + '/api/weather/v1/stations/' + f.id).catch(() => null)));
    stations = det.filter(d => d && d.properties.roadAddress && d.properties.roadAddress.contractAreaCode === CONTRACT)
      .map(d => ({id: d.id, name: (d.properties.names && d.properties.names.fi) || d.properties.name, road: d.properties.roadAddress.roadNumber, lon: d.geometry.coordinates[0], lat: d.geometry.coordinates[1]}));
  }
  const ids = new Set(stations.map(s => s.id));
  // 2. Mittaukset, tiesääennusteet, FMI, toteumat
  const bb = 'xMin=' + BBOX[0] + '&yMin=' + BBOX[1] + '&xMax=' + BBOX[2] + '&yMax=' + BBOX[3];
  const now = Date.now();
  const [data, secs, fcs, fmiTxt, routes] = await Promise.all([
    get(DT + '/api/weather/v1/stations/data'),
    get(DT + '/api/weather/v1/forecast-sections?' + bb).catch(() => null),
    get(DT + '/api/weather/v1/forecast-sections/forecasts?' + bb).catch(() => null),
    getText('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::edited::weather::scandinavia::point::simple&latlon=' + FMI_POINT
      + '&parameters=Temperature,DewPoint,Precipitation1h,TotalCloudCover,WeatherSymbol3&timestep=60&endtime=' + iso(now + 13 * 36e5)).catch(() => ''),
    get(DT + '/api/maintenance/v1/tracking/routes?domain=state-roads&' + bb + '&endFrom=' + iso(now - 70 * 60e3) + '&endBefore=' + iso(now)
      + ['SALTING', ...PLOW].map(t => '&taskId=' + t).join('')).catch(() => null)
  ]);
  // FMI
  const fmi = {};
  for(const m of fmiTxt.matchAll(/<BsWfs:Time>([^<]+)<\/BsWfs:Time>\s*<BsWfs:ParameterName>([^<]+)<\/BsWfs:ParameterName>\s*<BsWfs:ParameterValue>([^<]*)</g)){
    const t = new Date(m[1]).getTime(); (fmi[t] = fmi[t] || {})[m[2]] = parseFloat(m[3]); }
  const fmiAt = lead => { const t = Math.floor((now + lead * 36e5) / 36e5) * 36e5; return fmi[t] || fmi[t + 36e5] || {}; };
  // tiekohtien geometria ja ennusteet
  const geo = {}; for(const f of (secs && secs.features) || []){ const g = f.geometry; if(!g) continue; geo[f.id] = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates]; }
  const fcById = {}; for(const s of (fcs && fcs.forecastSections) || []) fcById[s.id] = s.forecasts || [];
  const segDist = (p, a, b) => { const ax = (a[0]-p[0])*M_LON, ay = (a[1]-p[1])*M_LAT, bx = (b[0]-p[0])*M_LON, by = (b[1]-p[1])*M_LAT, dx = bx-ax, dy = by-ay, l = dx*dx+dy*dy;
    const t = l ? Math.max(0, Math.min(1, -(ax*dx+ay*dy)/l)) : 0; return Math.hypot(ax + t*dx, ay + t*dy); };
  const distTo = (p, lines) => { let m = Infinity; for(const l of lines) for(let i = 0; i < l.length - 1; i++) m = Math.min(m, segDist(p, l[i], l[i+1])); return m; };
  const reason = f => { const r = f && f.forecastConditionReason; if(!r) return ''; return r.freezingRainCondition ? 'ICE' : (r.roadCondition && r.roadCondition !== 'DRY' && r.roadCondition !== 'MOIST' && r.roadCondition !== 'WET' ? r.roadCondition : (r.frictionCondition || '')); };
  // toteumat
  const works = ((routes && routes.features) || []).map(f => { const g = f.geometry; const pts = !g ? [] : g.type === 'Point' ? [g.coordinates] : g.type === 'LineString' ? g.coordinates : g.coordinates.flat();
    return {tasks: (f.properties && f.properties.tasks) || [], pts}; });
  const near = (st, pred) => works.some(w => w.tasks.some(pred) && w.pts.some(c => Math.hypot((c[0]-st.lon)*M_LON, (c[1]-st.lat)*M_LAT) <= 500));
  // 3. rivit asemittain
  const rows = [];
  for(const s of (data.stations || [])){
    if(!ids.has(s.id)) continue; const st = stations.find(x => x.id === s.id);
    const v = {}; for(const x of s.sensorValues || []) v[x.name] = x.value;
    const lanes = [1,2,3,4].filter(n => v['TIE_' + n] != null); if(!lanes.length) continue;
    const lane = lanes.reduce((a, n) => v['TIE_' + n] < v['TIE_' + a] ? n : a, lanes[0]);
    const keli = [v['KELI_' + lane], ...[1,2,3,4].map(n => v['KELI_' + n])].find(x => x != null && x > 0) ?? null;
    const warn = Math.max(...[1,2,3,4].map(n => v['VAROITUS_' + n]).filter(x => x != null), -1);
    const fr = ['KITKA1_LUKU','KITKA2_LUKU'].map(k => v[k]).filter(x => x != null);
    let seg = null, sd = Infinity; for(const [id, lines] of Object.entries(geo)){ if(!fcById[id]) continue; const d = distTo([st.lon, st.lat], lines); if(d < sd){ sd = d; seg = id; } }
    if(sd > 3000) seg = null;
    const F = seg ? fcById[seg] : []; const by = name => F.find(f => f.forecastName === name) || null;
    const obs = F.find(f => f.type === 'OBSERVATION');
    const f2 = fmiAt(2), f6 = fmiAt(6), f12 = fmiAt(12);
    const r = {t: iso(now), st: s.id, tr: v['TIE_' + lane], ta: v.ILMA, td: v.KASTEPISTE, tf: v['JÄÄTYMISPISTE_' + lane] ?? v.JÄÄTYMISPISTE_1 ?? null,
      salt: v['SUOLAN_MÄÄRÄ_' + lane] ?? v.SUOLAN_MÄÄRÄ_1 ?? null, water: v.VEDEN_MÄÄRÄ1 ?? v.VEDEN_MÄÄRÄ2 ?? null, snow: v.LUMEN_MÄÄRÄ1 ?? v.LUMEN_MÄÄRÄ2 ?? null,
      ice: v.JÄÄN_MÄÄRÄ1 ?? v.JÄÄN_MÄÄRÄ2 ?? null, fric: fr.length ? Math.min(...fr) : null, keli, warn: warn < 0 ? null : warn, ws: v.KESKITUULI ?? null,
      seg, fc_obs: obs ? obs.roadTemperature : null,
      fc2: by('2h') && by('2h').roadTemperature, fc4: by('4h') && by('4h').roadTemperature, fc6: by('6h') && by('6h').roadTemperature, fc12: by('12h') && by('12h').roadTemperature,
      c2: reason(by('2h')), c4: reason(by('4h')), c6: reason(by('6h')), c12: reason(by('12h')),
      f2_t: f2.Temperature, f2_td: f2.DewPoint, f2_p: f2.Precipitation1h, f2_cc: f2.TotalCloudCover, f2_sym: f2.WeatherSymbol3,
      f6_t: f6.Temperature, f6_td: f6.DewPoint, f6_p: f6.Precipitation1h, f6_cc: f6.TotalCloudCover, f6_sym: f6.WeatherSymbol3,
      f12_t: f12.Temperature, f12_td: f12.DewPoint, f12_p: f12.Precipitation1h, f12_cc: f12.TotalCloudCover, f12_sym: f12.WeatherSymbol3,
      salted1h: near(st, t => t === 'SALTING') ? 1 : 0, plowed1h: near(st, t => PLOW.includes(t)) ? 1 : 0};
    rows.push(r);
  }
  return {stations, rows};
}

export const toCsvLine = r => COLS.map(k => { const x = r[k]; return x == null || (typeof x === 'number' && isNaN(x)) ? '' : String(x).replace(/[,\n]/g, ' '); }).join(',');
export {COLS};

async function main(){
  const get = u => fetch(u, HDR).then(r => { if(!r.ok) throw new Error(u + ' → HTTP ' + r.status); return r.json(); });
  const getText = u => fetch(u).then(r => { if(!r.ok) throw new Error(u + ' → HTTP ' + r.status); return r.text(); });
  await fs.mkdir('data', {recursive: true});
  let cached = null;
  try{ const m = JSON.parse(await fs.readFile('data/stations.json', 'utf8')); if(Date.now() - m.t < 7 * 864e5) cached = m.stations; }catch(e){}
  const {stations, rows} = await collectRows(get, getText, cached);
  if(!cached) await fs.writeFile('data/stations.json', JSON.stringify({t: Date.now(), stations}, null, 1));
  const month = new Date().toISOString().slice(0, 7), file = 'data/obs-' + month + '.csv';
  let exists = true; try{ await fs.access(file); }catch(e){ exists = false; }
  await fs.appendFile(file, (exists ? '' : COLS.join(',') + '\n') + rows.map(toCsvLine).join('\n') + (rows.length ? '\n' : ''));
  let idx = {months: []}; try{ idx = JSON.parse(await fs.readFile('data/index.json', 'utf8')); }catch(e){}
  if(!idx.months.includes(month)) idx.months.push(month);
  idx.updated = new Date().toISOString(); idx.stations = stations.length; idx.lastRows = rows.length;
  await fs.writeFile('data/index.json', JSON.stringify(idx, null, 1));
  console.log('Tallennettu ' + rows.length + ' riviä → ' + file);
}
if(process.argv[1] && process.argv[1].endsWith('collect.mjs')) main().catch(e => { console.error(e); process.exit(1); });
