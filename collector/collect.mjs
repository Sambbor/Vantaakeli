// Vantaan hoitourakan keliaineiston keruu – ajetaan GitHub Actionsissa 30 min välein.
// Tallentaa asemittain mittaukset, lähimmän tiekohdan tienpintaennusteen, FMI:n ennusteen (+2/+6/+12 h),
// ajan viimeisestä suolauksesta ja aurauksesta (500 m säteellä, 24 h) sekä saman liukkausennusteen kuin kelisivu.
// Kerran tunnissa tallennetaan lisäksi kaikkien urakan tiekohtien tiesääennusteet. Lopuksi lasketaan data/learn.json.
// Lähteet: Fintraffic / Digitraffic ja Ilmatieteen laitos (CC BY 4.0).

// ===== LIUKKAUSSÄÄNNÖT (sama koodi sivulla ja keruussa – muuta molempiin ja nosta RULES_VERSION) =====
// v2 (talvitesti 2.10.2026): märkä tie kuivuu kastepiste-eron mukaan (kostea yö ei kuivaa tietä), vain vesisade tai
// lämpimälle tielle sulava lumi kastelee, havaittu liukkaus jatkuu ennusteessa, kuuran riski pienenee kovalla pakkasella,
// aseman Sade-varoitus (4) ei enää tarkoita liukasta havaintoa.
// v3 (11.10.2026): jää tiellä vasta ≥ 0,1 mm ja lumi > 0,2 mm vain, kun tienpinta ≤ +1 °C (anturin nollatason kohina, esim. jää 0,01 mm +11 °C:ssa).
const RULES_VERSION = 'v3';
const clamp01 = v => Math.max(0, Math.min(1, v));
const DT_SLIP = {FROST:0.6, ICE:0.85, PARTLY_ICY:0.7, SNOW:0.6, SLUSH:0.6, SNOW_AND_ICE:0.85, SLIPPERY:0.7, VERY_SLIPPERY:0.9};
function dtSlip(f){ const r = f && f.forecastConditionReason; if(!r) return 0;
  return Math.max(DT_SLIP[r.roadCondition]||0, DT_SLIP[r.frictionCondition]||0, r.freezingRainCondition ? 0.9 : 0, r.winterSlipperiness ? 0.6 : 0); }
// Riskikomponentit yhdelle tunnille. x = {tr, td, tf, moist, snow, frz, precip, ws, dt, obs}
function slipRisk(x){
  const c = [];
  if(x.tr == null || isNaN(x.tr)) return {p:null, why:'ei tienpintatietoa', parts:c};
  const m = x.tr - (x.tf || 0);
  if(x.obs > 0.02) c.push([x.obs, 'havaittu liukkaus']);
  if(x.frz && x.tr <= 0.5) c.push([1, 'jäätävä sade']);
  if(x.snow >= 0.05) c.push([clamp01(0.4 + x.snow/0.6) * (x.tr <= 2 ? 1 : 0.6), x.tr > 0.5 ? 'lumi / sohjo' : 'lumisade']);
  if(x.moist > 0){ const p = x.moist * clamp01((1 - m)/1.5); if(p > 0.02) c.push([p, 'märkä tie jäätyy']); }
  if(x.tr <= 0.5 && x.td != null && !isNaN(x.td)){ const cold = x.tr >= -8 ? 1 : clamp01(1 - (-8 - x.tr)/12);
    const p = clamp01((x.td - x.tr + 0.8)/1.3) * (m <= 0.3 ? 1 : 0.3) * (x.precip ? 0.5 : 1) * (x.ws != null && x.ws >= 5 ? 0.6 : 1) * cold; if(p > 0.02) c.push([p, 'kuura']); }
  if(x.dt) c.push([x.dt, 'tiesääennuste (Digitraffic)']);
  const best = c.reduce((a,b)=>b[0]>a[0]?b:a, [0, '']);
  return {p:best[0], why:best[1], parts:c};
}
const hourHel = t => Number(new Date(t).toLocaleString('fi-FI', {hour:'2-digit', hour12:false, timeZone:'Europe/Helsinki'})) % 24;
const isNight = t => { const h = hourHel(t); return h >= 18 || h < 8; };
function snowFrac(r){ const sym = Math.round(r.WeatherSymbol3), T = r.Temperature;
  return (sym>=41 && sym<=53) ? 1 : (sym>=71 && sym<=83) ? 0.5 : (sym>=21 && sym<=33) ? 0 : (T<=0 ? 1 : T<=1.5 ? 0.5 : 0); }
function snowRate(r){ const P = r.Precipitation1h || 0; if(P <= 0) return 0; return P * snowFrac(r) * (r.Temperature <= -5 ? 1.5 : 1); }
const rainSym = s => s >= 21 && s <= 33;
// Märän tien kuivuminen (1/h): ei juuri kuivu, kun tienpinta on kastepisteessä; nopeasti, kun ero on yli 3 °C. Jäätynyt kuivuu hitaammin.
function dryRate(tr, td){ const k = (tr == null || td == null || isNaN(td)) ? 0.25 : 1/12 + (1/2.5 - 1/12) * clamp01((tr - td - 0.5)/2.5); return tr != null && tr < 0 ? k * 0.5 : k; }
// Aseman liukkaussarja. o = {now, rows: FMI-tunnit, trNow, fc: tiekohdan ennusteet (Digitraffic), tf0, wetNow, slipNow: liukasta nyt (havainto), dewNow, bias: opittu korjaus}
function slipSeriesCore(o){
  const {now, rows, trNow, tf0, wetNow, dewNow, bias} = o;
  const fcs = (o.fc||[]).filter(f=>f.roadTemperature!=null).map(f=>({t: f.type==='OBSERVATION' ? now : new Date(f.time).getTime(), v:f.roadTemperature, f})).sort((a,b)=>a.t-b.t);
  const segObs = fcs.length ? fcs[0].v : null;
  const off0 = (trNow!=null && segObs!=null) ? trNow - segObs : 0;
  const base = trNow ?? segObs;
  const tdOff0 = (dewNow!=null && rows[0] && rows[0].DewPoint!=null) ? dewNow - rows[0].DewPoint : 0;
  const interp = t => { if(fcs.length < 2) return null; if(t > fcs[fcs.length-1].t + 30*60e3) return null;
    for(let i=1;i<fcs.length;i++){ const a = fcs[i-1], b = fcs[i]; if(t <= b.t) return a.v + (b.v-a.v)*Math.max(0,(t-a.t))/(b.t-a.t || 1); } return fcs[fcs.length-1].v; };
  const fcList = (o.fc||[]).filter(f=>f.type!=='OBSERVATION');
  const fObs = (o.fc||[]).find(f=>f.type==='OBSERVATION');
  let cumP = 0, wet = wetNow || 0, lead0 = 0, obsOn = !!o.slipNow; const out = [];
  rows.forEach((r, h) => {
    const t = new Date(r.t).getTime(), lead = Math.max(0, (t - now)/36e5);
    const P = r.Precipitation1h || 0; cumP += P;
    let tr = interp(t), ext = false, corr = 0;
    if(tr != null){ tr += off0 * Math.max(0, 1 - lead/12); }
    else if(base != null){ ext = true; tr = r.Temperature - ((r.TotalCloudCover ?? 100) < 30 && isNight(t) ? 1.5 : 0.3); }
    if(tr != null && bias && !ext){ const b = bias[isNight(t) ? 'night' : 'day']; if(b && b.n >= 12){ corr = b.mean * Math.min(1, lead/6); tr += corr; } }
    const td = r.DewPoint != null ? r.DewPoint + tdOff0 * Math.max(0, 1 - lead/6) : null;
    // märkyys: kuivuu tunti tunnilta, vesisade (tai lämpimällä tiellä sulava lumi) kastelee
    wet *= Math.exp(-dryRate(tr, td) * (lead - lead0)); lead0 = lead;
    const liq = tr != null && tr > 0.5 ? P : P * (1 - snowFrac(r));
    if(liq >= 0.05) wet = 1;
    const tf = (tf0||0) * Math.exp(-(lead/10) - cumP/1.5);
    if(tr != null && tr > 1) obsOn = false;   // havaittu liukkaus sulaa
    const fNear = fcList.find(f=>Math.abs(new Date(f.time).getTime() - t) <= 60*60e3);
    const x = {tr, td, tf, moist: wet, snow: snowRate(r), frz: rainSym(Math.round(r.WeatherSymbol3)) && P >= 0.05, precip: P >= 0.05, ws: r.WindSpeedMS,
      dt: lead < 1 ? dtSlip(fObs) : dtSlip(fNear), obs: obsOn ? Math.exp(-lead/4) : 0};
    const res = slipRisk(x);
    out.push({t, lead, ext, x, corr, ...res, idx: res.p == null ? null : Math.round(res.p*100)});
  });
  return out;
}
// VAROITUS: 0 OK, 1 Varo, 2 Häly, 3 Kuura, 4 Sade – vakavuusjärjestys ei ole numerojärjestys (Sade on pelkkä sadetieto)
const WARN_RANK = {0:0, 4:1, 1:2, 3:3, 2:4};
const obsSlippery = o => [5,6,7,9].includes(o.keli) || o.warn === 2 || o.warn === 3 || (o.fric != null && o.fric < 0.45)
  || ((o.tr == null || o.tr <= 1) && ((o.ice||0) >= 0.1 || (o.snow||0) > 0.2));
const WET_KELI = [2,3,4,8,9];
// ===== /LIUKKAUSSÄÄNNÖT =====

const DT = 'https://tie.digitraffic.fi';
const HDR = {headers: {'Digitraffic-User': 'Vantaa-urakka-keliennuste', 'Accept-Encoding': 'gzip'}};
const CONTRACT = 301;
const BBOX = [24.55, 60.15, 25.45, 60.50];
const FMI_POINT = '60.30,24.97';
// Urakan tiet, joiden tiesääennustekohdat tallennetaan tieosittaista oppimista varten (vt 7 osaan 4 asti)
const SEG_ROADS = new Set([3,4,7,45,50,100,101,103,130,135,138,140,145,148,152,170,1371,1375,1494,1521,1533]);
const COLS = ['t','st','tr','ta','td','tf','salt','water','snow','ice','fric','keli','warn','ws','seg','fc_obs','fc2','fc4','fc6','fc12','c2','c4','c6','c12',
  'f2_t','f2_td','f2_p','f2_cc','f2_sym','f6_t','f6_td','f6_p','f6_cc','f6_sym','f12_t','f12_td','f12_p','f12_cc','f12_sym',
  'salt_min','plow_min','idx2','idx6','idx12','why2','why6','why12','rv',
  // pidemmän tielämpöarvion oppimista varten: FMI +24 h sekä MEPS-mallin tämän tunnin pilvisyys, säteily ja maanpinnan lämpötila
  'f24_t','f24_cc','mp_cc','mp_rg','mp_rlw','mp_tg'];
const SEG_COLS = ['t','seg','road','obs_tr','obs_c','fc2','fc4','fc6','fc12','c2','c4','c6','c12','st','st_d'];
const SAND = ['LINE_SANDING', 'SPOT_SANDING'];
const PLOW = ['PLOUGHING_AND_SLUSH_REMOVAL','PLOUGHING_OF_SLUSH_DITCH','LOWERING_OF_SNOWBANKS','REMOVAL_OF_BULGE_ICE','TRANSFER_OF_SNOW'];
const M_LAT = 111320, M_LON = 111320 * Math.cos(60.3 * Math.PI / 180);
const iso = t => new Date(t).toISOString().replace(/\.\d+Z$/, 'Z');
const segDist = (p, a, b) => { const ax = (a[0]-p[0])*M_LON, ay = (a[1]-p[1])*M_LAT, bx = (b[0]-p[0])*M_LON, by = (b[1]-p[1])*M_LAT, dx = bx-ax, dy = by-ay, l = dx*dx+dy*dy;
  const t = l ? Math.max(0, Math.min(1, -(ax*dx+ay*dy)/l)) : 0; return Math.hypot(ax + t*dx, ay + t*dy); };
const distTo = (p, lines) => { let m = Infinity; for(const l of lines){ if(l.length === 1) m = Math.min(m, segDist(p, l[0], l[0])); for(let i = 0; i < l.length - 1; i++) m = Math.min(m, segDist(p, l[i], l[i+1])); } return m; };
const reason = f => { const r = f && f.forecastConditionReason; if(!r) return ''; return r.freezingRainCondition ? 'ICE' : (r.roadCondition && !['DRY','MOIST','WET'].includes(r.roadCondition) ? r.roadCondition : (r.frictionCondition || '')); };
const r1 = v => v == null || isNaN(v) ? null : Math.round(v * 10) / 10;

// ---- Norjan ilmatieteen laitoksen ennuste (MET Norway, CC BY 4.0) Vantaan pisteeseen → data/met.json, sivu lukee sen.
// Käyttöehdot: tunnistettava User-Agent ja välimuisti, siksi haku tehdään täällä enintään kerran 50 minuutissa eikä selaimesta.
const MET_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=60.3&lon=24.97';
const MET_UA = 'Vantaa-urakka-keliennuste/1 github.com/Sambbor/Vantaakeli';
const MET_COLS = ['t','updated','m6_t','m6_t10','m6_t90','m6_p','m12_t','m12_t10','m12_t90','m12_p','m24_t','m24_t10','m24_t90','m24_p'];
export function metRows(j){
  const out = [];
  for(const x of (j.properties && j.properties.timeseries) || []){
    const d = x.data.instant.details, n1h = x.data.next_1_hours, n6 = x.data.next_6_hours; if(d.air_temperature == null) continue;
    const n = n1h || n6, nd = (n && n.details) || {};
    out.push({t: x.time, h: n1h ? 1 : 6, T: d.air_temperature, T10: d.air_temperature_percentile_10 ?? null, T90: d.air_temperature_percentile_90 ?? null,
      Td: d.dew_point_temperature ?? null, ws: d.wind_speed ?? null, gust: d.wind_speed_of_gust ?? null, cc: d.cloud_area_fraction ?? null,
      P: nd.precipitation_amount ?? null, Pmin: nd.precipitation_amount_min ?? null, Pmax: nd.precipitation_amount_max ?? null, pop: nd.probability_of_precipitation ?? null,
      sym: (n && n.summary && n.summary.symbol_code) || null});
  }
  return out;
}
async function collectMet(fs, hourly){
  let old = null; try{ old = JSON.parse(await fs.readFile('data/met.json', 'utf8')); }catch(e){}
  if(!hourly && old && Date.now() - new Date(old.fetched).getTime() < 50 * 60e3) return old;   // tunnin ensimmäinen ajo hakee aina, toinen vain jos edellinen jäi väliin
  const r = await fetch(MET_URL, {headers: {'User-Agent': MET_UA}}); if(!r.ok) throw new Error('MET HTTP ' + r.status);
  const j = await r.json(), rows = metRows(j).filter(x => new Date(x.t).getTime() <= Date.now() + 72 * 36e5);
  const M = {fetched: new Date().toISOString(), updated: j.properties.meta.updated_at, source: 'MET Norway Locationforecast 2.0 (CC BY 4.0)', rows};
  await fs.writeFile('data/met.json', JSON.stringify(M));
  if(hourly){   // talteen +6/+12/+24 h, jotta mallien osuvuutta voidaan verrata talven aikana
    const now = Date.now(), at = L => rows.find(x => Math.abs(new Date(x.t).getTime() - (now + L * 36e5)) <= 30 * 60e3) || {};
    const row = {t: iso(now), updated: M.updated};
    for(const L of [6, 12, 24]){ const x = at(L); row['m'+L+'_t'] = x.T; row['m'+L+'_t10'] = x.T10; row['m'+L+'_t90'] = x.T90; row['m'+L+'_p'] = x.P; }
    await appendCsv(fs, 'data/met-' + new Date().toISOString().slice(0, 7) + '.csv', MET_COLS, [row]);
  }
  return M;
}

// ---- MEPS- ja ECMWF-mallien lämpötilaennusteet +6/+12/+24 h talteen kerran tunnissa → data/models-YYYY-MM.csv.
// Näillä verrataan talven aikana, mikä malli osuu Vantaalla parhaiten ja miten tielämpö seuraa kutakin mallia.
const MODEL_COLS = ['t','meps6_t','meps12_t','meps24_t','ec6_t','ec12_t','ec24_t'];
export function modelAt(txt, target){   // lähin kelvollinen arvo enintään 90 min päästä
  let best = null;
  for(const m of (txt || '').matchAll(/<BsWfs:Time>([^<]+)<\/BsWfs:Time>\s*<BsWfs:ParameterName>Temperature<\/BsWfs:ParameterName>\s*<BsWfs:ParameterValue>([^<]*)</g)){
    const v = parseFloat(m[2]), d = Math.abs(new Date(m[1]).getTime() - target); if(isNaN(v) || d > 90 * 60e3) continue;
    if(!best || d < best.d) best = {d, v}; }
  return best ? best.v : null;
}
async function collectModels(fs, getText){
  const now = Date.now(), q = id => 'https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=' + id + '&latlon=' + FMI_POINT
    + '&parameters=Temperature&timestep=60&endtime=' + iso(now + 26 * 36e5);
  const [meps, ec] = await Promise.all([getText(q('fmi::forecast::meps::surface::point::simple')).catch(() => ''), getText(q('ecmwf::forecast::surface::point::simple')).catch(() => '')]);
  const row = {t: iso(now)};
  for(const L of [6, 12, 24]){ row['meps' + L + '_t'] = modelAt(meps, now + L * 36e5); row['ec' + L + '_t'] = modelAt(ec, now + L * 36e5); }
  if(MODEL_COLS.slice(1).every(k => row[k] == null)) throw new Error('ei arvoja');
  await appendCsv(fs, 'data/models-' + new Date().toISOString().slice(0, 7) + '.csv', MODEL_COLS, [row]);
}

// ---- Yön yhteenveto (klo 18–08 Suomen aikaa) → data/night.json ja valmiista öistä data/nights/YYYY-MM-DD.json
const helUtc = (y, m, d, h) => [2, 3].map(o => Date.UTC(y, m - 1, d, h - o)).find(t => hourHel(t) === h) ?? Date.UTC(y, m - 1, d, h - 2);
const helDate = t => new Date(t).toLocaleDateString('sv-SE', {timeZone: 'Europe/Helsinki'});   // YYYY-MM-DD
export function nightSummary(all, stations, works, camEvents, now){
  const hNow = hourHel(now), evening = helDate(hNow < 18 ? now - 18 * 36e5 : now);   // illan päivämäärä
  const [y, m, d] = evening.split('-').map(Number), from = helUtc(y, m, d, 18), next = helDate(from + 12 * 36e5).split('-').map(Number), to = helUtc(next[0], next[1], next[2], 8);
  const rows = all.filter(o => o.tt >= from - 13 * 36e5 && o.tt <= to + 36e5);
  const inN = o => o.tt >= from && o.tt <= to, out = [];
  let falseH = new Set();
  for(const st of stations){
    const a = rows.filter(o => o.st === st.id).sort((p, q) => p.tt - q.tt), n = a.filter(inN); if(!n.length) continue;
    const trs = n.filter(o => o.tr != null), mn = trs.reduce((b, o) => !b || o.tr < b.tr ? o : b, null), ta = n.filter(o => o.ta != null).map(o => o.ta);
    const slip = n.filter(o => obsSlippery(o)), first = slip[0] || null;
    let lead = null, dt = false;
    if(first){
      for(const L of [12, 6, 2]){ if(a.some(o => Math.abs(o.tt + L * 36e5 - first.tt) <= 45 * 60e3 && o['idx' + L] != null && o['idx' + L] >= 50)){ lead = L; break; } }
      dt = a.some(o => o.tt < first.tt && o.tt >= first.tt - 13 * 36e5 && ['c2', 'c6', 'c12'].some(k => o[k] && o[k] !== ''));
    }
    for(const o of a) for(const L of [2, 6]){ const tgt = o.tt + L * 36e5; if(tgt < from || tgt > to || o['idx' + L] == null || o['idx' + L] < 50) continue;
      if(!a.some(x => Math.abs(x.tt - tgt) <= 60 * 60e3 && obsSlippery(x))) falseH.add(st.id + '|' + Math.floor(tgt / 36e5)); }
    out.push({id: st.id, name: st.name, road: st.road, n: n.length, trMin: mn ? mn.tr : null, trMinT: mn ? iso(mn.tt) : null, taMin: ta.length ? Math.min(...ta) : null,
      slipFirst: first ? iso(first.tt) : null, slipRows: slip.length, keli: first ? first.keli : null, lead, dtWarned: dt,
      saltMin: n.some(o => o.salt_min != null && o.salt_min <= 30) });
  }
  const W = {salt: [], plow: [], sand: []};
  for(const w of works || []){ if(w.end < from || w.end > to) continue;
    if(w.tasks.includes('SALTING')) W.salt.push(w.end); if(w.tasks.some(t => PLOW.includes(t))) W.plow.push(w.end); if(w.tasks.some(t => SAND.includes(t))) W.sand.push(w.end); }
  const wk = a => a.length ? {n: a.length, first: iso(Math.min(...a)), last: iso(Math.max(...a))} : {n: 0};
  const ev = (camEvents || []).filter(e => e.night === evening);
  const slipSt = out.filter(s => s.slipFirst), coldest = out.filter(s => s.trMin != null).sort((p, q) => p.trMin - q.trMin)[0] || null;
  return {night: evening, from: iso(from), to: iso(to), complete: now >= to, updated: iso(now), rv: RULES_VERSION, stations: out,
    summary: {stations: out.length, coldest: coldest && {name: coldest.name, tr: coldest.trMin, t: coldest.trMinT}, slipStations: slipSt.length,
      warned: slipSt.filter(s => s.lead != null).length, missed: slipSt.filter(s => s.lead == null).length, falseHours: falseH.size},
    works: {salt: wk(W.salt), plow: wk(W.plow), sand: wk(W.sand), note: 'Harja-toteumat 24 h ajalta, vain suolaus, auraus ja hiekoitus; paikallaan seisovan koneen kirjaukset pois'},
    cam: {events: ev.filter(e => e.kind !== 'alue').length, confirmed: ev.filter(e => e.kind !== 'alue' && e.status === 'vahvistettu').length, regional: ev.filter(e => e.kind === 'alue').length}};
}

// ---- Talven tuloskortti viikoittain → data/scorecard.json
const isoWeek = t => { const d = new Date(helDate(t) + 'T12:00:00Z'), day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3);
  const y = d.getUTCFullYear(), w1 = new Date(Date.UTC(y, 0, 4)); return y + '-W' + String(1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7)).padStart(2, '0'); };
const errStat = a => { if(!a.length) return null; const m = a.reduce((x, y) => x + y, 0) / a.length, mae = a.reduce((x, y) => x + Math.abs(y), 0) / a.length;
  return {n: a.length, mae: Math.round(mae * 100) / 100, bias: Math.round(m * 100) / 100}; };
// Pienimmän neliösumman ratkaisu (normaaliyhtälöt, Gaussin eliminointi)
function lsq(X, y){
  const k = X[0].length, A = Array.from({length: k}, () => Array(k + 1).fill(0));
  X.forEach((x, r) => { for(let i = 0; i < k; i++){ for(let j = 0; j < k; j++) A[i][j] += x[i] * x[j]; A[i][k] += x[i] * y[r]; } });
  for(let i = 0; i < k; i++) A[i][i] += 1e-3;   // pieni vakautus
  for(let i = 0; i < k; i++){ let p = i; for(let r = i + 1; r < k; r++) if(Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]];
    for(let r = 0; r < k; r++){ if(r === i) continue; const f = A[r][i] / A[i][i]; for(let c = i; c <= k; c++) A[r][c] -= f * A[i][c]; } }
  return A.map((row, i) => row[k] / row[i]);
}
// Opittu tielämpö: tie − ilma asemittain MEPSin säteilystä, pilvisyydestä, aseman tuulesta ja vuorokaudenajasta.
// Verrataan kiinteään sääntöön (selkeä yö −1,5 °C, muuten −0,3 °C) uusimmalla viikolla, jota ei käytetty opetukseen. Ei vaikuta sivun ennusteeseen.
export function learnedRoad(all, stations, now){
  const rows = all.filter(o => o.tr != null && o.ta != null && o.mp_rlw != null && o.mp_rg != null && o.mp_cc != null);
  if(!rows.length) return {status: 'kertyy', note: 'Säteilytietoa (MEPS) ei vielä ole asemariveillä.', days: 0};
  const ccScale = Math.max(...rows.map(o => o.mp_cc)) <= 1.01 ? 100 : 1;   // MEPS-pilvisyys 0–1 tai 0–100
  const first = Math.min(...rows.map(o => o.tt)), days = (now - first) / 864e5, split = now - 7 * 864e5;
  const night = o => o._n ?? (o._n = isNight(o.tt) ? 1 : 0);
  const feat = o => [1, o.mp_rg / 100, (o.mp_rlw - 300) / 50, Math.min(o.ws ?? 3, 15), night(o)];
  const rule = o => (o.mp_cc * ccScale < 30 && night(o)) ? -1.5 : -0.3;
  const base = {days: Math.round(days * 10) / 10, ccScale};
  if(days < 14) return {...base, status: 'kertyy', note: 'Vertailu alkaa, kun säteilytietoa on 14 vrk (opetus) + viimeisin viikko (testi).'};
  const train = rows.filter(o => o.tt < split), test = rows.filter(o => o.tt >= split);
  const pooled = lsq(train.map(feat), train.map(o => o.tr - o.ta));
  const perSt = [], eL = [], eR = [];
  for(const st of stations){
    const tr = train.filter(o => o.st === st.id), te = test.filter(o => o.st === st.id); if(!te.length) continue;
    const w = tr.length >= 200 ? lsq(tr.map(feat), tr.map(o => o.tr - o.ta)) : pooled;
    const l = te.map(o => o.ta + feat(o).reduce((a, x, i) => a + x * w[i], 0) - o.tr), r = te.map(o => o.ta + rule(o) - o.tr);
    eL.push(...l); eR.push(...r);
    perSt.push({id: st.id, name: st.name, n: te.length, own: tr.length >= 200, learned: errStat(l), rule: errStat(r),
      nightL: errStat(te.map((o, i) => [o, l[i]]).filter(([o]) => night(o)).map(x => x[1])), nightR: errStat(te.map((o, i) => [o, r[i]]).filter(([o]) => night(o)).map(x => x[1]))});
  }
  const L = errStat(eL), R = errStat(eR);
  return {...base, status: 'vertailu', trainN: train.length, testN: test.length, learned: L, rule: R, better: L && R ? L.mae < R.mae : null, minTr: Math.min(...test.map(o => o.tr)), perSt,
    note: 'Ilman lämpötila on tässä asemalla mitattu, joten vertailu mittaa vain tien ja ilman eron mallia. Ei käytössä sivun ennusteessa ennen erillistä päätöstä.'};
}
export function scorecard(all, met, mod, stations, camEvents, now){
  const t0 = Math.min(...all.map(o => o.tt)), weeks = {};
  const W = k => weeks[k] = weeks[k] || {week: k, nights: 0, slipNights: 0, stNights: 0, warned: 0, missed: 0, falseHours: 0, leads: [], models: {}, road: {fc6: [], fc12: []}, cam: {events: 0, confirmed: 0, regional: 0}, rv: new Set()};
  // liukkaus öittäin (sama laskenta kuin Viime yö -kortissa)
  for(let d = new Date(helDate(t0) + 'T12:00:00Z').getTime(); d < now; d += 864e5){
    const [y, m, dd] = helDate(d).split('-').map(Number), end = helUtc(y, m, dd, 18) + 14 * 36e5;
    if(end > now) break;
    const N = nightSummary(all, stations, [], [], end + 30 * 60e3); if(!N.stations.length) continue;
    const w = W(isoWeek(new Date(N.from).getTime() + 2 * 36e5)); w.nights++;
    const S = N.summary; if(S.slipStations) w.slipNights++; w.stNights += S.slipStations; w.warned += S.warned; w.missed += S.missed; w.falseHours += S.falseHours;
    for(const s of N.stations) if(s.lead != null) w.leads.push(s.lead);
  }
  // havaittu ilman lämpötila (asemien keskiarvo) puolen tunnin jaksoissa
  const B = 30 * 60e3, obsTa = {};
  for(const o of all) if(o.ta != null){ const k = Math.round(o.tt / B); (obsTa[k] = obsTa[k] || []).push(o.ta); }
  const taAt = t => { for(const k of [Math.round(t / B), Math.round(t / B) - 1, Math.round(t / B) + 1]){ const a = obsTa[k]; if(a && a.length >= 2) return a.reduce((x, y) => x + y, 0) / a.length; } return null; };
  const addModel = (name, t, L, v) => { if(v == null || isNaN(v)) return; const tgt = t + L * 36e5; if(tgt > now) return; const ob = taAt(tgt); if(ob == null) return;
    const w = W(isoWeek(tgt)); ((w.models[name] = w.models[name] || {})[L] = w.models[name][L] || []).push(v - ob); };
  const seenFmi = new Set();
  for(const o of all){ w0: { const k = Math.round(o.tt / B); if(seenFmi.has(k)) break w0; seenFmi.add(k); for(const L of [6, 12, 24]) addModel('FMI', o.tt, L, o['f' + L + '_t']); } }
  for(const o of met) for(const L of [6, 12, 24]) addModel('MET Norja', o.tt, L, o['m' + L + '_t']);
  for(const o of mod) for(const L of [6, 12, 24]){ addModel('MEPS', o.tt, L, o['meps' + L + '_t']); addModel('ECMWF', o.tt, L, o['ec' + L + '_t']); }
  // Digitrafficin tieennuste asemalla
  const bySt = {}; for(const o of all) (bySt[o.st] = bySt[o.st] || []).push(o);
  for(const a of Object.values(bySt)){ a.sort((p, q) => p.tt - q.tt);
    const find = t => { let lo = 0, hi = a.length - 1; while(lo < hi){ const m2 = (lo + hi) >> 1; if(a[m2].tt < t) lo = m2 + 1; else hi = m2; } const c = [a[lo], a[lo - 1]].filter(Boolean).sort((p, q) => Math.abs(p.tt - t) - Math.abs(q.tt - t))[0]; return c && Math.abs(c.tt - t) <= 25 * 60e3 ? c : null; };
    for(const o of a){ if(o.rv) W(isoWeek(o.tt)).rv.add(o.rv);
      for(const L of [6, 12]){ const v = o['fc' + L]; if(v == null) continue; const later = find(o.tt + L * 36e5); if(!later || later.tr == null) continue; W(isoWeek(later.tt)).road['fc' + L].push(v - later.tr); } } }
  for(const e of camEvents || []){ const w = W(isoWeek(new Date(e.start).getTime())); if(e.kind === 'alue') w.cam.regional++; else { w.cam.events++; if(e.status === 'vahvistettu') w.cam.confirmed++; } }
  const out = Object.values(weeks).sort((a, b) => a.week < b.week ? -1 : 1).map(w => ({week: w.week, nights: w.nights, slipNights: w.slipNights, stNights: w.stNights, warned: w.warned, missed: w.missed,
    falseHours: w.falseHours, leadAvg: w.leads.length ? Math.round(w.leads.reduce((x, y) => x + y, 0) / w.leads.length * 10) / 10 : null, rv: [...w.rv].sort(),
    models: Object.fromEntries(Object.entries(w.models).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([L, e]) => [L, errStat(e)]))])),
    road: {fc6: errStat(w.road.fc6), fc12: errStat(w.road.fc12)}, cam: w.cam}));
  return {updated: iso(now), weeks: out, learned: learnedRoad(all, stations, now)};
}

export async function collectRows(get, getText, cachedStations, learn, withSegments){
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
  const bb = 'xMin=' + BBOX[0] + '&yMin=' + BBOX[1] + '&xMax=' + BBOX[2] + '&yMax=' + BBOX[3];
  const now = Date.now();
  const [data, secs, fcs, fmiTxt, mepsTxt, routes] = await Promise.all([
    get(DT + '/api/weather/v1/stations/data'),
    get(DT + '/api/weather/v1/forecast-sections?' + bb).catch(() => null),
    get(DT + '/api/weather/v1/forecast-sections/forecasts?' + bb).catch(() => null),
    getText('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::edited::weather::scandinavia::point::simple&latlon=' + FMI_POINT
      + '&parameters=Temperature,DewPoint,Precipitation1h,TotalCloudCover,WeatherSymbol3,WindSpeedMS&timestep=60&endtime=' + iso(now + 25 * 36e5)).catch(() => ''),
    getText('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::meps::surface::point::simple&latlon=' + FMI_POINT
      + '&parameters=TotalCloudCover,RadiationGlobal,RadiationLW,GroundTemperature&timestep=60&starttime=' + iso(Math.floor(now / 36e5) * 36e5) + '&endtime=' + iso(Math.floor(now / 36e5) * 36e5 + 36e5)).catch(() => ''),
    // suolaukset ja auraukset 24 h ajalta (rajapinnan enimmäisikkuna)
    get(DT + '/api/maintenance/v1/tracking/routes?domain=state-roads&' + bb + '&endFrom=' + iso(now - 24 * 36e5 + 60e3) + '&endBefore=' + iso(now)
      + ['SALTING', ...PLOW, ...SAND].map(t => '&taskId=' + t).join('')).catch(() => null)
  ]);
  // FMI tunneittain (nykyisestä tunnista alkaen)
  const fmi = {};
  for(const m of fmiTxt.matchAll(/<BsWfs:Time>([^<]+)<\/BsWfs:Time>\s*<BsWfs:ParameterName>([^<]+)<\/BsWfs:ParameterName>\s*<BsWfs:ParameterValue>([^<]*)</g)){
    const t = new Date(m[1]).getTime(); (fmi[t] = fmi[t] || {t: m[1]})[m[2]] = parseFloat(m[3]); }
  const h0 = Math.floor(now / 36e5) * 36e5;
  const fmiRows = Object.values(fmi).filter(r => new Date(r.t).getTime() >= h0).sort((a, b) => a.t < b.t ? -1 : 1);
  const mp = {};   // MEPS: lähin tunti
  for(const m of (mepsTxt || '').matchAll(/<BsWfs:ParameterName>([^<]+)<\/BsWfs:ParameterName>\s*<BsWfs:ParameterValue>([^<]*)</g)){ const v = parseFloat(m[2]); if(mp[m[1]] == null && !isNaN(v)) mp[m[1]] = v; }
  const fmiAt = lead => { const t = Math.floor((now + lead * 36e5) / 36e5) * 36e5; return fmi[t] || fmi[t + 36e5] || {}; };
  // tiekohdat
  const geo = {}, road = {};
  for(const f of (secs && secs.features) || []){ const g = f.geometry; if(!g) continue; geo[f.id] = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates]; road[f.id] = f.properties.roadNumber; }
  const fcById = {}; for(const s of (fcs && fcs.forecastSections) || []) fcById[s.id] = s.forecasts || [];
  // toteumat: pois paikallaan seisovan koneen kirjaukset (alle 30 m liike, kesto ≥ 1 min)
  const works = ((routes && routes.features) || []).map(f => { const g = f.geometry, p = f.properties || {};
    const pts = !g ? [] : g.type === 'Point' ? [g.coordinates] : g.type === 'LineString' ? g.coordinates : g.coordinates.flat();
    const c0 = pts[0] || [0, 0], ext = pts.reduce((m, c) => Math.max(m, Math.hypot((c[0]-c0[0])*M_LON, (c[1]-c0[1])*M_LAT)), 0);
    const end = new Date(p.endTime || p.startTime).getTime(), dur = (end - new Date(p.startTime || end).getTime()) / 1000;
    return {tasks: p.tasks || [], pts, end, still: pts.length > 0 && ext < 30 && (dur >= 60 || pts.length === 1)}; }).filter(w => !w.still && w.pts.length);
  const minutesSince = (st, pred) => { let last = null;
    for(const w of works) if(w.tasks.some(pred) && (!last || w.end > last) && w.pts.some(c => Math.hypot((c[0]-st.lon)*M_LON, (c[1]-st.lat)*M_LAT) <= 500)) last = w.end;
    return last ? Math.round((now - last) / 60e3) : null; };
  // asemarivit
  const rows = [], stPos = [];
  for(const s of (data.stations || [])){
    if(!ids.has(s.id)) continue; const st = stations.find(x => x.id === s.id);
    const v = {}; for(const x of s.sensorValues || []) v[x.name] = x.value;
    const lanes = [1,2,3,4].filter(n => v['TIE_' + n] != null); if(!lanes.length) continue;
    const lane = lanes.reduce((a, n) => v['TIE_' + n] < v['TIE_' + a] ? n : a, lanes[0]);
    const keli = [v['KELI_' + lane], ...[1,2,3,4].map(n => v['KELI_' + n])].find(x => x != null && x > 0) ?? null;
    const warn = [1,2,3,4].map(n => v['VAROITUS_' + n]).filter(x => x != null).reduce((a, x) => (WARN_RANK[x] ?? 0) > (WARN_RANK[a] ?? -1) ? x : a, -1);
    const fr = ['KITKA1_LUKU','KITKA2_LUKU'].map(k => v[k]).filter(x => x != null);
    let seg = null, sd = Infinity; for(const [id, lines] of Object.entries(geo)){ if(!fcById[id]) continue; const d = distTo([st.lon, st.lat], lines); if(d < sd){ sd = d; seg = id; } }
    if(sd > 3000) seg = null;
    const F = seg ? fcById[seg] : []; const by = name => F.find(f => f.forecastName === name) || null;
    const obs = F.find(f => f.type === 'OBSERVATION');
    const f2 = fmiAt(2), f6 = fmiAt(6), f12 = fmiAt(12), f24 = fmiAt(24);
    const tr = v['TIE_' + lane], tf = v['JÄÄTYMISPISTE_' + lane] ?? v.JÄÄTYMISPISTE_1 ?? null;
    const water = v.VEDEN_MÄÄRÄ1 ?? v.VEDEN_MÄÄRÄ2 ?? null, snow = v.LUMEN_MÄÄRÄ1 ?? v.LUMEN_MÄÄRÄ2 ?? null, ice = v.JÄÄN_MÄÄRÄ1 ?? v.JÄÄN_MÄÄRÄ2 ?? null;
    // sama liukkausennuste kuin sivulla (sääntöversio RULES_VERSION)
    const wetNow = (water != null && water > 0.03) || (snow||0) > 0 || (ice||0) > 0 || WET_KELI.includes(keli) ? 1 : 0;
    const slipNow = obsSlippery({tr, keli, warn: warn < 0 ? null : warn, fric: fr.length ? Math.min(...fr) : null, ice, snow});
    const ser = fmiRows.length ? slipSeriesCore({now, rows: fmiRows.slice(0, 14), trNow: tr, fc: F, tf0: Math.min(0, tf ?? 0), wetNow, slipNow, dewNow: v.KASTEPISTE, bias: learn && learn.bias && learn.bias[s.id]}) : [];
    const at = L => ser.find(c => Math.abs(c.lead - L) < 0.5) || null;
    const i2 = at(2), i6 = at(6), i12 = at(12);
    rows.push({t: iso(now), st: s.id, tr, ta: v.ILMA, td: v.KASTEPISTE, tf,
      salt: v['SUOLAN_MÄÄRÄ_' + lane] ?? v.SUOLAN_MÄÄRÄ_1 ?? null, water, snow, ice, fric: fr.length ? Math.min(...fr) : null, keli, warn: warn < 0 ? null : warn, ws: v.KESKITUULI ?? null,
      seg, fc_obs: obs ? obs.roadTemperature : null,
      fc2: by('2h') && by('2h').roadTemperature, fc4: by('4h') && by('4h').roadTemperature, fc6: by('6h') && by('6h').roadTemperature, fc12: by('12h') && by('12h').roadTemperature,
      c2: reason(by('2h')), c4: reason(by('4h')), c6: reason(by('6h')), c12: reason(by('12h')),
      f2_t: f2.Temperature, f2_td: f2.DewPoint, f2_p: f2.Precipitation1h, f2_cc: f2.TotalCloudCover, f2_sym: f2.WeatherSymbol3,
      f6_t: f6.Temperature, f6_td: f6.DewPoint, f6_p: f6.Precipitation1h, f6_cc: f6.TotalCloudCover, f6_sym: f6.WeatherSymbol3,
      f12_t: f12.Temperature, f12_td: f12.DewPoint, f12_p: f12.Precipitation1h, f12_cc: f12.TotalCloudCover, f12_sym: f12.WeatherSymbol3,
      salt_min: minutesSince(st, t => t === 'SALTING'), plow_min: minutesSince(st, t => PLOW.includes(t)),
      idx2: i2 && i2.idx, idx6: i6 && i6.idx, idx12: i12 && i12.idx, why2: i2 && i2.why, why6: i6 && i6.why, why12: i12 && i12.why, rv: RULES_VERSION,
      f24_t: f24.Temperature, f24_cc: f24.TotalCloudCover, mp_cc: mp.TotalCloudCover, mp_rg: mp.RadiationGlobal, mp_rlw: mp.RadiationLW, mp_tg: mp.GroundTemperature});
    stPos.push(st);
  }
  // tiekohdat (tieosittainen oppiminen): ennusteet ja lähin asema
  const segRows = [];
  if(withSegments) for(const [id, F] of Object.entries(fcById)){
    const rd = road[id]; if(!SEG_ROADS.has(rd) || !geo[id]) continue;
    if(rd === 7 && Number(String(id).slice(6, 9)) > 4) continue;
    const by = name => F.find(f => f.forecastName === name) || null, obs = F.find(f => f.type === 'OBSERVATION');
    const mid = geo[id].flat()[Math.floor(geo[id].flat().length / 2)];
    let nst = null, nd = Infinity; for(const st of stPos){ const d = Math.hypot((st.lon-mid[0])*M_LON, (st.lat-mid[1])*M_LAT); if(d < nd){ nd = d; nst = st; } }
    segRows.push({t: iso(now), seg: id, road: rd, obs_tr: obs && obs.roadTemperature, obs_c: reason(obs),
      fc2: by('2h') && by('2h').roadTemperature, fc4: by('4h') && by('4h').roadTemperature, fc6: by('6h') && by('6h').roadTemperature, fc12: by('12h') && by('12h').roadTemperature,
      c2: reason(by('2h')), c4: reason(by('4h')), c6: reason(by('6h')), c12: reason(by('12h')), st: nst && nst.id, st_d: nst ? Math.round(nd) : null});
  }
  return {stations, rows, segRows, works};
}

// ---- Oppiminen kerätystä aineistosta → data/learn.json (sivu lukee tämän)
export function parseCsv(txt){
  const lines = txt.trim().split('\n'); if(lines.length < 2) return [];
  const head = lines[0].split(',');
  return lines.slice(1).map(l => { const a = l.split(','); const o = {}; head.forEach((k, i) => { const v = a[i];
    o[k] = (v === '' || v == null) ? null : (['t','seg','why2','why6','why12','rv'].includes(k) || /^c\d/.test(k) ? v : Number(v)); });
    o.tt = new Date(o.t).getTime(); return o; }).filter(o => !isNaN(o.tt));
}
export function learnFromRows(rows){
  const bySt = {}; rows.forEach(o => { (bySt[o.st] = bySt[o.st] || []).push(o); });
  const bias = {}, verif = {hit:0, miss:0, fa:0, cn:0, stored:0, retro:0, byRv:{}}, perSt = {};
  const SALT_BINS = [['alle 2 h', 0, 120], ['2–6 h', 120, 360], ['6–12 h', 360, 720], ['12–24 h', 720, 1440], ['ei suolausta 24 h', 1440, Infinity]];
  const salt = SALT_BINS.map(b => ({bin: b[0], n: 0, slip: 0}));
  for(const [id, arr] of Object.entries(bySt)){
    arr.sort((a, b) => a.tt - b.tt);
    const find = t => { let lo = 0, hi = arr.length - 1; while(lo < hi){ const m = (lo + hi) >> 1; if(arr[m].tt < t) lo = m + 1; else hi = m; }
      const c = [arr[lo], arr[lo-1]].filter(Boolean).sort((a, b) => Math.abs(a.tt - t) - Math.abs(b.tt - t))[0]; return c && Math.abs(c.tt - t) <= 25 * 60e3 ? c : null; };
    const acc = {night: [], day: []}, air = {night: [], day: []}; let slipH = 0;
    const ps = perSt[id] = {hit:0, miss:0, fa:0, cn:0};
    for(const o of arr){
      const sl = obsSlippery(o); if(sl) slipH++;
      if(o.tr != null && o.ta != null) air[isNight(o.tt) ? 'night' : 'day'].push(o.tr - o.ta);
      // suolauksen suojavaikutus: kostea tai märkä tie pakkasella
      const wet = (o.water||0) > 0.03 || (o.snow||0) > 0 || (o.ice||0) > 0 || WET_KELI.includes(o.keli);
      if(o.tr != null && o.tr <= 0.5 && wet){ const m = o.salt_min == null ? Infinity : o.salt_min; const k = SALT_BINS.findIndex(b => m >= b[1] && m < b[2]); if(k >= 0){ salt[k].n++; if(sl) salt[k].slip++; } }
      const later = find(o.tt + 6 * 36e5); if(!later || later.tr == null) continue;
      if(o.fc6 != null) acc[isNight(later.tt) ? 'night' : 'day'].push(later.tr - o.fc6);
      let pr = null, ver = 'jälkikäteen';
      if(o.idx6 != null){ pr = o.idx6 >= 50; verif.stored++; ver = o.rv || '?'; }
      else if(o.fc6 != null){
        const wetN = wet ? 1 : 0;
        const x = {tr: o.fc6 + ((o.tr != null && o.fc_obs != null) ? (o.tr - o.fc_obs) * 0.5 : 0), td: o.f6_td, tf: Math.min(0, o.tf||0) * Math.exp(-0.6 - (o.f6_p||0)/1.5),
          moist: Math.max(wetN * Math.exp(-6/2.5), (o.f6_p||0) * (1 - snowFrac({WeatherSymbol3: o.f6_sym||0, Temperature: o.f6_t})) >= 0.05 ? 1 : 0), snow: snowRate({Precipitation1h: o.f6_p||0, WeatherSymbol3: o.f6_sym||0, Temperature: o.f6_t}),
          frz: rainSym(Math.round(o.f6_sym||0)) && (o.f6_p||0) >= 0.05, precip: (o.f6_p||0) >= 0.05, ws: null, dt: DT_SLIP[o.c6]||0};
        pr = slipRisk(x).p >= 0.5; verif.retro++;
      }
      if(pr == null) continue;
      const ob = obsSlippery(later), k = pr && ob ? 'hit' : !pr && ob ? 'miss' : pr ? 'fa' : 'cn';
      verif[k]++; ps[k]++; const bv = verif.byRv[ver] = verif.byRv[ver] || {hit:0, miss:0, fa:0, cn:0}; bv[k]++;
    }
    const stat = a => a.length >= 3 ? {n: a.length, mean: Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) / 100} : (a.length ? {n: a.length, mean: Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) / 100} : null);
    const med = a => a.length ? Math.round(a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] * 100) / 100 : 0;
    bias[id] = {night: stat(acc.night), day: stat(acc.day), air: {night: med(air.night), day: med(air.day)}, rows: arr.length, slipH};
  }
  return {rv: RULES_VERSION, n: rows.length, from: rows.length ? iso(Math.min(...rows.map(o => o.tt))) : null, to: rows.length ? iso(Math.max(...rows.map(o => o.tt))) : null, bias, verif, perSt, salt};
}

export const toCsvLine = (r, cols) => cols.map(k => { const x = r[k]; return x == null || (typeof x === 'number' && isNaN(x)) ? '' : (typeof x === 'number' ? String(r1(x) === x ? x : Math.round(x * 100) / 100) : String(x).replace(/[,\n]/g, ' ')); }).join(',');
export {COLS, SEG_COLS};

async function appendCsv(fs, file, cols, rows){
  let txt = null; try{ txt = await fs.readFile(file, 'utf8'); }catch(e){}
  if(txt != null){
    const head = txt.split('\n', 1)[0];
    if(head !== cols.join(',')){   // sarakkeet muuttuneet: kirjoitetaan tiedosto uusilla sarakkeilla
      const old = parseCsv(txt); await fs.writeFile(file, cols.join(',') + '\n' + old.map(o => toCsvLine(o, cols)).join('\n') + (old.length ? '\n' : ''));
    }
  } else await fs.writeFile(file, cols.join(',') + '\n');
  if(rows.length) await fs.appendFile(file, rows.map(r => toCsvLine(r, cols)).join('\n') + '\n');
}

async function main(){
  const fs = (await import('node:fs/promises')).default;
  const get = u => fetch(u, HDR).then(r => { if(!r.ok) throw new Error(u + ' → HTTP ' + r.status); return r.json(); });
  const getText = u => fetch(u).then(r => { if(!r.ok) throw new Error(u + ' → HTTP ' + r.status); return r.text(); });
  await fs.mkdir('data', {recursive: true});
  let cached = null;
  try{ const m = JSON.parse(await fs.readFile('data/stations.json', 'utf8')); if(Date.now() - m.t < 7 * 864e5) cached = m.stations; }catch(e){}
  let learn = null; try{ learn = JSON.parse(await fs.readFile('data/learn.json', 'utf8')); }catch(e){}
  let idx = {months: []}; try{ idx = JSON.parse(await fs.readFile('data/index.json', 'utf8')); }catch(e){}
  // tuntitallennukset (tiekohdat, MET, MEPS/ECMWF): aina kun edellisestä on yli 50 min, vaikka GitHub viivästäisi ajoa
  const withSegments = !idx.hourlyT || Date.now() - new Date(idx.hourlyT).getTime() >= 50 * 60e3;
  const {stations, rows, segRows, works} = await collectRows(get, getText, cached, learn, withSegments);
  if(!cached) await fs.writeFile('data/stations.json', JSON.stringify({t: Date.now(), stations}, null, 1));
  const month = new Date().toISOString().slice(0, 7);
  await appendCsv(fs, 'data/obs-' + month + '.csv', COLS, rows);
  if(withSegments) await appendCsv(fs, 'data/seg-' + month + '.csv', SEG_COLS, segRows);
  try{ await collectMet(fs, withSegments); }catch(e){ console.error('MET-ennuste jäi hakematta: ' + e.message); }
  if(withSegments){ try{ await collectModels(fs, getText); }catch(e){ console.error('MEPS/ECMWF-tallennus jäi väliin: ' + e.message); } }
  if(withSegments) idx.hourlyT = new Date().toISOString();
  if(!idx.months.includes(month)) idx.months.push(month);
  // oppiminen viimeisen 60 vrk aineistosta
  const all = [];
  for(const m of idx.months.slice(-3)){ try{ all.push(...parseCsv(await fs.readFile('data/obs-' + m + '.csv', 'utf8'))); }catch(e){} }
  const since = Date.now() - 60 * 864e5;
  const L = learnFromRows(all.filter(o => o.tt >= since));
  L.updated = new Date().toISOString();
  await fs.writeFile('data/learn.json', JSON.stringify(L));
  try{   // yön yhteenveto
    let cam = []; try{ cam = JSON.parse(await fs.readFile('data/cam/events.json', 'utf8')); }catch(e){}
    const N = nightSummary(all, stations, works, cam, Date.now());
    await fs.writeFile('data/night.json', JSON.stringify(N));
    if(N.complete){ await fs.mkdir('data/nights', {recursive: true}); await fs.writeFile('data/nights/' + N.night + '.json', JSON.stringify(N)); }
  }catch(e){ console.error('Yön yhteenveto jäi tekemättä: ' + e.message); }
  try{   // talven tuloskortti ja opitun tielämmön vertailu kerran tunnissa
    if(withSegments){
      const rd = async p => { try{ return parseCsv(await fs.readFile(p, 'utf8')); }catch(e){ return []; } };
      const met = [], mod = []; for(const m of idx.months.slice(-3)){ met.push(...await rd('data/met-' + m + '.csv')); mod.push(...await rd('data/models-' + m + '.csv')); }
      let cam = []; try{ cam = JSON.parse(await fs.readFile('data/cam/events.json', 'utf8')); }catch(e){}
      const SC = scorecard(all, met, mod, stations, cam, Date.now());
      // vanhat viikot säilyvät, vaikka niiden raakadata (3 kk) tai kameravahdin havainnot (14 vrk) poistuvat
      let old = null; try{ old = JSON.parse(await fs.readFile('data/scorecard.json', 'utf8')); }catch(e){}
      if(old && old.weeks){ const nw = new Map(SC.weeks.map(w => [w.week, w]));
        for(const ow of old.weeks){ const w = nw.get(ow.week); if(!w){ nw.set(ow.week, ow); continue; }
          for(const k of ['events', 'confirmed', 'regional']) w.cam[k] = Math.max(w.cam[k], (ow.cam || {})[k] || 0); }
        SC.weeks = [...nw.values()].sort((a, b) => a.week < b.week ? -1 : 1); }
      await fs.writeFile('data/scorecard.json', JSON.stringify(SC));
    }
  }catch(e){ console.error('Tuloskortti jäi tekemättä: ' + e.message); }
  idx.updated = L.updated; idx.stations = stations.length; idx.lastRows = rows.length; idx.lastSegRows = segRows.length; idx.rv = RULES_VERSION;
  await fs.writeFile('data/index.json', JSON.stringify(idx, null, 1));
  console.log('Tallennettu ' + rows.length + ' asemariviä' + (withSegments ? ', ' + segRows.length + ' tiekohtaa' : '') + ' (' + month + '), oppimisaineistossa ' + L.n + ' riviä');
}
if(typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('collect.mjs')) main().catch(e => { console.error(e); process.exit(1); });
