#!/usr/bin/env python3
"""RoadSurf-tienpintamalli Vantaan tiesääasemille – varjoajo (vaihe 2, rs1, 15.10.2026; vertailu vaihe 3, rs2).

Ilmatieteen laitoksen avoin tienpintamalli RoadSurf (MIT-lisenssi, github.com/fmidev/RoadSurf-Python)
ajetaan kerran tunnissa jokaiselle asemalle:
  * alustus 48 h: aseman mittaukset keruun tiedostoista data/obs-YYYY-MM.csv
    (ilma, kastepiste, tuuli, sateen intensiteetti, tienpinta; säteily = MEPS-malli Vantaan pisteessä)
  * ennuste 60 h: MEPS-mallin pisteennuste aseman kohdalle (Ilmatieteen laitoksen avoin rajapinta)
Tulokset:
  * data/roadsurf.json          – uusin ajo asemittain tunneittain (sivun meteogrammi)
  * data/roadsurf-YYYY-MM.csv   – ennusteet +1…+48 h talteen vertailua varten (varjoajo)
  * data/roadsurf-verif.json    – vertailu: RoadSurf vs. Digitraffic vs. sivun sääntö mitattuun tienpintaan (60 vrk)
Ei vaikuta liukkausindeksiin eikä hälytyksiin.

Ajo: python3 collector/roadsurf.py   (ympäristö: RS_SRC = RoadSurf-Python/src -hakemisto)
Testaus: MEPS_FILE=xml-tiedosto korvaa rajapintahaun, NOW=2026-10-15T07:25:00Z asettaa ajohetken.
"""
import os, sys, json, math, time, types, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

VERSION = 'rs2'
os.environ['TZ'] = 'UTC'; time.tzset()          # RoadSurf käyttää naiiveja aikoja → UTC
# RoadSurf tuo matplotlibin, vaikka ei piirrä mitään ajon aikana: korvataan tyhjällä moduulilla
_mpl = types.ModuleType('matplotlib'); _mpl.pyplot = types.ModuleType('matplotlib.pyplot')
sys.modules.setdefault('matplotlib', _mpl); sys.modules.setdefault('matplotlib.pyplot', _mpl.pyplot)
sys.path.insert(0, os.environ.get('RS_SRC', 'roadsurf-src/src'))
import numpy as np                                                         # noqa: E402
import Initialization, InputOutput, Coupling, Storage, ModRadiation, Cond, BalanceModel, WearingFactors  # noqa: E402

H = 3600
INIT_H, FC_H, MIN_FC_H = 48, 60, 12
DATA = 'data'
FMI = 'https://opendata.fmi.fi/wfs'
MEPS_PAR = ['Temperature', 'DewPoint', 'WindSpeedMS', 'Precipitation1h', 'RadiationGlobal', 'RadiationLW']
LEADS = [1, 2, 3, 6, 12, 24, 36, 48]
CSV_COLS = ['t', 'st', 'f0', 'tr0', 'n_obs'] + ['rs%d' % L for L in LEADS] + ['min12', 'min24', 'ice12', 'dep12', 'snow12', 'wat6', 'v']


def log(*a): print(*a, flush=True)


def now_utc():
    return datetime.fromisoformat(os.environ['NOW'].replace('Z', '+00:00')) if os.environ.get('NOW') else datetime.now(timezone.utc)


def ts(d): return int(d.timestamp())


def iso(t): return datetime.fromtimestamp(t, timezone.utc).strftime('%Y-%m-%dT%H:%MZ')


def fnum(x):
    try:
        v = float(x)
        return v if math.isfinite(v) else None
    except (TypeError, ValueError):
        return None


# ---------- aseman mittaukset tunneittain ----------
def read_obs(now):
    months = sorted({(now - timedelta(hours=h)).strftime('%Y-%m') for h in (0, INIT_H + 3)})
    rows = []
    for m in months:
        p = os.path.join(DATA, 'obs-%s.csv' % m)
        if not os.path.exists(p): continue
        with open(p, encoding='utf-8') as f:
            head = f.readline().strip().split(',')
            ix = {k: i for i, k in enumerate(head)}
            lo = ts(now) - (INIT_H + 3) * H
            for line in f:
                v = line.rstrip('\n').split(',')
                if len(v) < len(head): continue
                try: t = ts(datetime.fromisoformat(v[ix['t']].replace('Z', '+00:00')))
                except ValueError: continue
                if t < lo or t > ts(now) + 600: continue
                g = lambda k: fnum(v[ix[k]]) if k in ix else None
                rows.append({'t': t, 'st': v[ix['st']], 'tr': g('tr'), 'ta': g('ta'), 'td': g('td'), 'ws': g('ws'),
                             'ri': g('rain_i'), 'lw': g('mp_rlw'), 'sw': g('mp_rg')})
    return rows


def hourly(rows):
    """Jokaiselle tasatunnille lähin rivi 20 min sisältä (keruu ajaa noin :20 ja :50)."""
    best = {}
    for r in rows:
        hh = int(round(r['t'] / H)) * H; d = abs(r['t'] - hh)
        if d <= 20 * 60 and (hh not in best or d < best[hh][0]): best[hh] = (d, r)
    return {k: v[1] for k, v in best.items()}


# ---------- MEPS-ennuste aseman kohdalle ----------
def meps(lat, lon, t_start, t_end):
    if os.environ.get('MEPS_FILE'):
        xml = open(os.environ['MEPS_FILE'], encoding='utf-8').read()
    else:
        q = {'service': 'WFS', 'version': '2.0.0', 'request': 'getFeature',
             'storedquery_id': 'fmi::forecast::meps::surface::point::simple',
             'latlon': '%.5f,%.5f' % (lat, lon), 'parameters': ','.join(MEPS_PAR), 'timestep': '60',
             'starttime': iso(t_start).replace('Z', ':00Z'), 'endtime': iso(t_end).replace('Z', ':00Z')}
        url = FMI + '?' + urllib.parse.urlencode(q, safe=',:')
        xml = None
        for k in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Vantaa-urakka-keliennuste'}), timeout=60) as r:
                    xml = r.read().decode('utf-8'); break
            except Exception as e:
                log('  MEPS-haku epäonnistui (%s), yritys %d' % (e, k + 1)); time.sleep(5 * (k + 1))
        if xml is None: return {}
    ns = {'BsWfs': 'http://xml.fmi.fi/schema/wfs/2.0'}
    out = {}
    for e in ET.fromstring(xml).iter('{http://xml.fmi.fi/schema/wfs/2.0}BsWfsElement'):
        t = ts(datetime.fromisoformat(e.find('BsWfs:Time', ns).text.replace('Z', '+00:00')))
        out.setdefault(t, {})[e.find('BsWfs:ParameterName', ns).text] = fnum(e.find('BsWfs:ParameterValue', ns).text)
    return out


def fill(times, known, default=None):
    """Aukot lineaarisesti; jos arvoja ei ole lainkaan, oletus (tai None)."""
    pts = [(t, known[t]) for t in times if known.get(t) is not None]
    if not pts: return None if default is None else [default] * len(times)
    return list(np.interp(times, [p[0] for p in pts], [p[1] for p in pts]))


# ---------- RoadSurf-ajo (sama silmukka kuin RoadSurf-Pythonin main.py) ----------
def model_step(i, phy, ground, surf, atm, settings, coupling, mi, condParam, localParam):
    Storage.PrecipitationToStorage(settings, condParam, mi.PrecPhase[i], atm, surf)
    if localParam.sky_view < 1.0 and localParam.sky_view > -0.01:
        ModRadiation.ModRadiationBySurroundings(mi, ground, localParam, i)
    BalanceModel.BalanceModelOneStep(mi.SW[i], mi.LW[i], phy, ground, surf, atm, settings, coupling, mi, i, condParam)
    wearF = WearingFactors.WearingFactors()
    Cond.WearFactors(condParam, settings.Tph, surf, wearF)
    Cond.RoadCond(phy.MaxPormms, surf, atm, settings, condParam, wearF)
    ground.Albedo = Cond.CalcAlbedo(surf, condParam)


def run_roadsurf(data, lat, lon, f0, init_h, fc_h):
    f0d = datetime.fromtimestamp(f0, timezone.utc).replace(tzinfo=None)
    start, end = f0d - timedelta(hours=init_h), f0d + timedelta(hours=fc_h)
    (mi, mo, phy, ground, surf, atm, coupling, settings, condParam, localParam) = \
        Initialization.initialize_model(30.0, True, 60, data, lat, lon, f0d, start, end, init_h)
    i = 0
    while i < settings.SimLen - 1 and not settings.simulation_failed:
        InputOutput.CheckValues(mi, i, settings, surf, localParam)
        if settings.use_coupling:
            i = Coupling.CouplingOperations1(i, coupling, surf, settings, ground, mi, condParam, localParam)
        InputOutput.SetCurrentValues(i, mi, atm, settings, surf, coupling, ground)
        model_step(i, phy, ground, surf, atm, settings, coupling, mi, condParam, localParam)
        InputOutput.SaveOutput(mo, i, surf)
        Coupling.CheckEndCoupling(i, settings, coupling, surf)
        i += 1
    if settings.simulation_failed: return None
    InputOutput.lastValues(mi, atm, settings, ground, surf)
    model_step(i, phy, ground, surf, atm, settings, coupling, mi, condParam, localParam)
    InputOutput.SaveOutput(mo, i, surf)
    res = {}
    for k, tt in enumerate(mi.time):
        if tt.minute == 0 and tt.second == 0:
            t = ts(tt.replace(tzinfo=timezone.utc))
            if t >= f0:
                res[t] = [round(float(mo.TsurfOut[k]), 2), round(float(mo.WaterOut[k]), 3), round(float(mo.IceOut[k] + mo.Ice2Out[k]), 3),
                          round(float(mo.SnowOut[k]), 3), round(float(mo.DepositOut[k]), 3)]
    return res


def station(st, rows, now):
    hr = hourly([r for r in rows if r['st'] == str(st['id'])])
    with_tr = sorted(t for t, r in hr.items() if r['tr'] is not None and r['ta'] is not None)
    if not with_tr: return None, 'ei mittauksia'
    f0 = with_tr[-1]
    if ts(now) - f0 > 3 * H: return None, 'uusin mittaus yli 3 h vanha'
    init = list(range(f0 - INIT_H * H, f0 + H, H))
    n_obs = sum(1 for t in init if t in with_tr)
    if n_obs < 24: return None, 'liian vähän mittauksia (%d/49 h)' % n_obs
    col = lambda k: {t: hr[t][k] for t in init if t in hr}
    ta, td, tr = fill(init, col('ta')), fill(init, col('td')), fill(init, col('tr'))
    ws = fill(init, col('ws'), 2.0)
    lw, sw = fill(init, col('lw')), fill(init, col('sw'))
    if td is None or lw is None or sw is None: return None, 'kastepiste tai säteily puuttuu'
    pr = [max(0.0, (hr.get(t) or {}).get('ri') or 0.0) for t in init]
    # ennuste
    F = meps(st['lat'], st['lon'], f0 + H, f0 + FC_H * H)
    fct = []
    for t in range(f0 + H, f0 + FC_H * H + 1, H):
        v = F.get(t) or {}
        if v.get('Temperature') is None or v.get('DewPoint') is None: break
        fct.append(t)
    if len(fct) < MIN_FC_H: return None, 'MEPS-ennustetta vain %d h' % len(fct)
    fk = lambda k, d=None: fill(fct, {t: F[t].get(k) for t in fct}, d)
    times = init + fct
    data = {'time': [datetime.fromtimestamp(t, timezone.utc).replace(tzinfo=None) for t in times], 'timestamp': [float(t) for t in times],
            'air_temperature': ta + fk('Temperature'), 'dewpoint': td + fk('DewPoint'), 'windSpeed': ws + fk('WindSpeedMS', 3.0),
            'prec': pr + [max(0.0, (F[t].get('Precipitation1h') or 0.0)) for t in fct],
            'LW': lw + fk('RadiationLW', lw[-1]), 'SW': sw + fk('RadiationGlobal', 0.0), 'troad': tr + [-9999.0] * len(fct)}
    res = run_roadsurf(data, st['lat'], st['lon'], f0, INIT_H, len(fct))
    if not res: return None, 'malliajo epäonnistui'
    return {'f0': f0, 'tr0': hr[f0]['tr'], 'n_obs': n_obs, 'res': res}, None

# ---------- vaihe 3: vertailu mitattuun tienpintaan (data/roadsurf-verif.json) ----------
# Samat alkuhetket ja asemat kaikille kolmelle: RoadSurf, Digitrafficin tiesääennuste (lähin tiekohta, obs-rivin fc2/fc6/fc12)
# ja sivun kiinteä sääntö (FMI:n ilman ennuste − 0,3 °C, selkeänä yönä − 1,5 °C). Totuus = aseman mittaama tienpinta.
VLEADS = [2, 6, 12]
SLIP_KELI = (5, 6, 7, 9)


def hel_hour(t):
    from zoneinfo import ZoneInfo
    return datetime.fromtimestamp(t, ZoneInfo('Europe/Helsinki')).hour


def read_csv_months(prefix, months, cols):
    out = []
    for m in months:
        p = os.path.join(DATA, '%s-%s.csv' % (prefix, m))
        if not os.path.exists(p): continue
        with open(p, encoding='utf-8') as f:
            head = f.readline().strip().split(','); ix = {k: i for i, k in enumerate(head)}
            for line in f:
                v = line.rstrip('\n').split(',')
                if len(v) < len(head): continue
                r = {}
                for k in cols:
                    x = v[ix[k]] if k in ix else ''
                    r[k] = x if k in ('t', 'st', 'f0', 'v') else fnum(x)
                out.append(r)
    return out


def stat(pairs):
    if not pairs: return None
    e = [a - b for a, b in pairs]
    return [round(sum(e) / len(e), 2), round(sum(abs(x) for x in e) / len(e), 2)]


def verify(now, stations, days=60):
    nowt = ts(now)
    months = sorted({(now - timedelta(days=d)).strftime('%Y-%m') for d in range(0, days + 1, 5)} | {now.strftime('%Y-%m')})
    rs = [r for r in read_csv_months('roadsurf', months, ['st', 'f0', 'rs2', 'rs6', 'rs12', 'ice12', 'dep12', 'snow12'])
          if r['f0'] and nowt - ts(datetime.fromisoformat(r['f0'].replace('Z', '+00:00'))) <= days * 86400]
    if not rs: return None
    obs_cols = ['t', 'st', 'tr', 'keli', 'ice', 'fc2', 'fc6', 'fc12', 'f2_t', 'f6_t', 'f12_t', 'f2_cc', 'f6_cc', 'f12_cc', 'idx2', 'idx6', 'idx12']
    obs = read_csv_months('obs', months, obs_cols)
    by = {}
    for r in obs:
        try: r['t'] = ts(datetime.fromisoformat(r['t'].replace('Z', '+00:00')))
        except ValueError: continue
        by.setdefault(r['st'], []).append(r)
    H_ = {sid: hourly(rows) for sid, rows in by.items()}
    groups = ('all', 'night', 'day', 'cold')
    acc = {L: {g: {'rs': [], 'dt': [], 'rule': []} for g in groups} for L in VLEADS}
    per = {}; weeks = {}
    ev = {k: {'hit': 0, 'miss': 0, 'fa': 0, 'cn': 0} for k in ('rs', 'idx')}
    fr = {'hit': 0, 'miss': 0, 'fa': 0, 'cn': 0}
    t_lo, t_hi = None, None
    for r in rs:
        f0 = ts(datetime.fromisoformat(r['f0'].replace('Z', '+00:00'))); hr = H_.get(r['st'], {}); ref = hr.get(f0)
        if not ref: continue
        t_lo = f0 if t_lo is None else min(t_lo, f0); t_hi = f0 if t_hi is None else max(t_hi, f0)
        for L in VLEADS:
            T = f0 + L * H
            if T > nowt: continue
            o = hr.get(T)
            if not o or o['tr'] is None: continue
            a_rs, a_dt, ft, cc = r['rs%d' % L], ref['fc%d' % L], ref['f%d_t' % L], ref['f%d_cc' % L]
            if a_rs is None or a_dt is None or ft is None: continue       # vain parit, joissa kaikki kolme
            night = hel_hour(T) >= 18 or hel_hour(T) < 8
            a_rule = ft - (1.5 if (cc is not None and cc < 30 and night) else 0.3)
            for g in ('all', 'night' if night else 'day') + (('cold',) if o['tr'] <= 3 else ()):
                for k, a in (('rs', a_rs), ('dt', a_dt), ('rule', a_rule)): acc[L][g][k].append((a, o['tr']))
            if L == 6:
                p = per.setdefault(r['st'], {'rs': [], 'dt': [], 'rule': []})
                wk = datetime.fromtimestamp(f0, timezone.utc).strftime('%G-W%V'); w = weeks.setdefault(wk, {'rs': [], 'dt': [], 'rule': []})
                for k, a in (('rs', a_rs), ('dt', a_dt), ('rule', a_rule)): p[k].append((a, o['tr'])); w[k].append((a, o['tr']))
        # liukkaus 12 h sisällä: RoadSurfin varastot vs. sivun liukkausindeksi
        if f0 + 12 * H <= nowt:
            fut = [hr.get(f0 + k * H) for k in range(1, 13)]; fut = [x for x in fut if x]
            if len(fut) >= 9:
                slip = any(((x['keli'] is not None and int(x['keli']) in SLIP_KELI) or (x['ice'] or 0) >= 0.1) and (x['tr'] is None or x['tr'] <= 1) for x in fut)
                kuura = any(x['keli'] is not None and int(x['keli']) == 5 for x in fut)
                a_rs = ((r['ice12'] or 0) + (r['dep12'] or 0) + (r['snow12'] or 0)) >= 0.02
                ix = [ref['idx%d' % L] for L in VLEADS if ref['idx%d' % L] is not None]
                a_ix = bool(ix) and max(ix) >= 50
                for k, a in (('rs', a_rs), ('idx', a_ix)):
                    ev[k]['hit' if a and slip else 'miss' if slip else 'fa' if a else 'cn'] += 1
                a_fr = (r['dep12'] or 0) >= 0.02
                fr['hit' if a_fr and kuura else 'miss' if kuura else 'fa' if a_fr else 'cn'] += 1
    names = {str(s['id']): s.get('name') for s in stations}
    pack = lambda d: {'n': len(d['rs']), 'rs': stat(d['rs']), 'dt': stat(d['dt']), 'rule': stat(d['rule'])}
    return {'t': iso(nowt), 'v': VERSION, 'days': days, 'from': iso(t_lo) if t_lo else None, 'to': iso(t_hi) if t_hi else None, 'runs': len(rs),
            'leads': {str(L): {g: pack(acc[L][g]) for g in groups} for L in VLEADS},
            'st': {sid: dict(pack(d), name=names.get(sid, sid)) for sid, d in sorted(per.items())},
            'weeks': [dict(pack(d), w=w) for w, d in sorted(weeks.items())],
            'ev': ev, 'frost': fr}


def main():
    now = now_utc()
    stations = json.load(open(os.path.join(DATA, 'stations.json'), encoding='utf-8'))['stations']
    rows = read_obs(now)
    try: prev = json.load(open(os.path.join(DATA, 'roadsurf.json'), encoding='utf-8'))
    except Exception: prev = {'st': {}}
    out = {'t': iso(ts(now)), 'v': VERSION, 'model': 'RoadSurf-Python (FMI, MIT)', 'init_h': INIT_H, 'st': {}}
    csv_rows = []
    for st in stations:
        sid = str(st['id']); t1 = time.time()
        try: r, err = station(st, rows, now)
        except Exception as e: r, err = None, 'virhe: %s' % e
        if not r:
            log('%s %s: ohitettu – %s' % (sid, st.get('name', ''), err))
            out['st'][sid] = {'err': err}
            continue
        f0, res = r['f0'], r['res']; ks = sorted(res)
        within = lambda h: [res[t] for t in ks if t <= f0 + h * H]
        out['st'][sid] = {'name': st.get('name'), 'f0': iso(f0), 'tr0': r['tr0'], 'n_obs': r['n_obs'],
                          'h': [res[t] for t in ks]}   # tunneittain f0:sta: [tie °C, vesi, jää, lumi, kuura] mm
        log('%s %s: f0 %s, %d h, tie nyt %.1f → min 24 h %.1f °C, jää %.2f, kuura %.2f mm (%.1f s)' % (
            sid, st.get('name', ''), iso(f0), len(ks) - 1, r['tr0'], min(x[0] for x in within(24)),
            max(x[2] for x in within(24)), max(x[4] for x in within(24)), time.time() - t1))
        if (prev.get('st', {}).get(sid) or {}).get('f0') == iso(f0): continue   # sama alkuhetki jo talletettu
        g = lambda L: res.get(f0 + L * H, [None])[0]
        csv_rows.append([iso(ts(now)), sid, iso(f0), r['tr0'], r['n_obs']] + [g(L) for L in LEADS] + [
            min(x[0] for x in within(12)), min(x[0] for x in within(24)), max(x[2] for x in within(12)),
            max(x[4] for x in within(12)), max(x[3] for x in within(12)), max(x[1] for x in within(6)), VERSION])
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, 'roadsurf.json'), 'w', encoding='utf-8') as f: json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
    if csv_rows:
        p = os.path.join(DATA, 'roadsurf-%s.csv' % now.strftime('%Y-%m'))
        new = not os.path.exists(p)
        with open(p, 'a', encoding='utf-8') as f:
            if new: f.write(','.join(CSV_COLS) + '\n')
            for r in csv_rows: f.write(','.join('' if x is None else str(x) for x in r) + '\n')
    try:
        V = verify(now, stations)
        if V:
            with open(os.path.join(DATA, 'roadsurf-verif.json'), 'w', encoding='utf-8') as f: json.dump(V, f, separators=(',', ':'), ensure_ascii=False)
            a = V['leads']['6']['all']
            log('Vertailu 6 h: %d paria, keskivirhe RoadSurf %s · Digitraffic %s · sääntö %s' % (a['n'], (a['rs'] or ['-', '-'])[1], (a['dt'] or ['-', '-'])[1], (a['rule'] or ['-', '-'])[1]))
    except Exception as e:
        log('Vertailu jäi laskematta: %s' % e)
    ok = sum(1 for v in out['st'].values() if 'h' in v)
    log('RoadSurf %s: %d/%d asemaa, %d riviä talteen' % (VERSION, ok, len(stations), len(csv_rows)))
    if ok == 0 and stations: sys.exit(1)


if __name__ == '__main__':
    main()
