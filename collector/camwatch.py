#!/usr/bin/env python3
"""Kameravahti, vaihe 0 (varjotila) – Vantaan hoitourakka.

Ajetaan GitHub Actionsissa klo 18–08 (Suomen aikaa) 15 minuutin välein. Hakee urakan kelikameroiden
uusimmat kuvat, mittaa tien alueen vaaleuden ja vertaa sitä saman kuvasuunnan tavalliseen tasoon ja
puolen tunnin takaiseen kuvaan. Jos tie on selvästi vaalentunut (lunta, polanteen alkua), kirjataan
havainto ja tallennetaan pikkukuvat. Varjotilassa ketään ei hälytetä – tulokset näkyvät kelisivulla.

Jos moni kuvasuunta vaalenee samaan aikaan (laaja lumisade tai aamun valkeneminen), kirjataan yksi
aluetapahtuma kymmenien erillisten havaintojen sijaan. Yli 15 vrk vanhat pikkukuvat poistetaan.

Tiedostot: data/cam/latest.json, data/cam/events.json, data/cam/state.json, data/cam/log-YYYY-MM.csv,
data/cam/img/YYYY-MM-DD/*.jpg. Lähteet: Fintraffic / Digitraffic (CC BY 4.0).
"""
import gzip, io, json, math, os, shutil, sys, time, urllib.request
from datetime import datetime, timezone
from statistics import median
from zoneinfo import ZoneInfo
from PIL import Image

DT = 'https://tie.digitraffic.fi'
HDR = {'Digitraffic-User': 'Vantaa-urakka-keliennuste', 'User-Agent': 'vantaa-kameravahti/1', 'Accept-Encoding': 'gzip'}   # Digitraffic vaatii gzip-pakkauksen
BBOX = (24.55, 60.15, 25.45, 60.50)
CONTRACT = 301
OUT = 'data/cam'
TZ = ZoneInfo('Europe/Helsinki')
# Tien alue kuvassa (osuudet leveydestä/korkeudesta): alaosan keskiosa. Kuvasuuntakohtainen rajaus tehdään myöhemmin.
ROI = (0.15, 0.50, 0.85, 0.92)
RULES = {'roi': ROI, 'bright_L': 150, 'white_L': 165, 'white_sat': 30, 'jump_base': 0.20, 'jump_prev': 0.10, 'abs_white': 0.35,
         'unusable_mean': 12, 'stale_min': 60,
         # aluetapahtuma: vähintään 5 kuvasuuntaa ja 25 % kelvollisista samassa ajossa; avoimeen aluetapahtumaan liitetään myöhemmät muutokset
         'region_min': 5, 'region_share': 0.25, 'twilight_sun': (-7, 8), 'img_keep_days': 15, 'warm_tr': 3.0, 'confirm': 2, 'version': 'kv2'}
M_LAT = 111320.0
M_LON = 111320.0 * math.cos(math.radians(60.3))
WINTER = {'FROST', 'ICE', 'PARTLY_ICY', 'SNOW', 'SLUSH', 'SNOW_AND_ICE', 'SLIPPERY', 'VERY_SLIPPERY'}
MAX_IMG_PER_NIGHT = 40
LAT0, LON0 = 60.30, 24.97


def get(url, raw=False, timeout=40):
    req = urllib.request.Request(url, headers=HDR)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        b = r.read()
        if r.headers.get('Content-Encoding', '').lower() == 'gzip' or b[:2] == b'\x1f\x8b':
            b = gzip.decompress(b)
    return b if raw else json.loads(b)


def iso(t):
    return datetime.fromtimestamp(t, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def parse_t(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp() if s else None


def load(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default


def save(path, obj, indent=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=indent)


def dist(a, b):
    return math.hypot((a[0] - b[0]) * M_LON, (a[1] - b[1]) * M_LAT)


def seg_dist(p, a, b):
    ax, ay = (a[0] - p[0]) * M_LON, (a[1] - p[1]) * M_LAT
    bx, by = (b[0] - p[0]) * M_LON, (b[1] - p[1]) * M_LAT
    dx, dy = bx - ax, by - ay
    l = dx * dx + dy * dy
    t = max(0.0, min(1.0, -(ax * dx + ay * dy) / l)) if l else 0.0
    return math.hypot(ax + t * dx, ay + t * dy)


def line_dist(p, lines):
    m = float('inf')
    for l in lines:
        for i in range(len(l) - 1):
            m = min(m, seg_dist(p, l[i], l[i + 1]))
    return m


def cameras():
    c = load(OUT + '/cams.json', None)
    if c and time.time() - c.get('t', 0) < 7 * 86400:
        return c['cams']
    lst = get(DT + '/api/weathercam/v1/stations')
    cams = []
    for f in lst['features']:
        x, y = f['geometry']['coordinates'][:2]
        if not (BBOX[0] <= x <= BBOX[2] and BBOX[1] <= y <= BBOX[3]) or f['properties'].get('collectionStatus') != 'GATHERING':
            continue
        try:
            d = get(DT + '/api/weathercam/v1/stations/' + f['id'])
        except Exception:
            continue
        ra = d['properties'].get('roadAddress') or {}
        if ra.get('contractAreaCode') != CONTRACT:
            continue
        name = (d['properties'].get('names') or {}).get('fi') or d['properties'].get('name')
        for p in d['properties'].get('presets', []):
            if not p.get('inCollection'):
                continue
            cams.append({'cam': d['id'], 'preset': p['id'], 'name': name, 'dir': p.get('presentationName') or '',
                         'road': ra.get('roadNumber'), 'lon': x, 'lat': y,
                         'url': p.get('imageUrl') or ('https://weathercam.digitraffic.fi/' + p['id'] + '.jpg')})
    save(OUT + '/cams.json', {'t': time.time(), 'cams': cams}, indent=1)
    return cams


def features(img):
    im = img.convert('RGB')
    w, h = im.size
    box = (int(w * ROI[0]), int(h * ROI[1]), int(w * ROI[2]), int(h * ROI[3]))
    sm = im.crop(box).resize((160, 72), Image.BOX)   # keskiarvoistus vaimentaa ajovalojen pisteet
    n = bright = white = dark = 0
    sl = ss = 0.0
    for r, g, b in sm.getdata():
        L = 0.299 * r + 0.587 * g + 0.114 * b
        s = max(r, g, b) - min(r, g, b)
        n += 1; sl += L; ss += s
        if L >= RULES['bright_L']: bright += 1
        if L >= RULES['white_L'] and s <= RULES['white_sat']: white += 1
        if L < 20: dark += 1
    return {'mean': round(sl / n, 1), 'bright': round(bright / n, 3), 'white': round(white / n, 3),
            'dark': round(dark / n, 3), 'sat': round(ss / n, 1), 'mode': 'ir' if ss / n < 6 else 'color'}


def sun_elev(t, lat=LAT0, lon=LON0):
    """Auringon korkeus asteina (riittävä tarkkuus hämärän tunnistamiseen)."""
    n = t / 86400.0 + 2440587.5 - 2451545.0
    L = (280.460 + 0.9856474 * n) % 360
    g = math.radians((357.528 + 0.9856003 * n) % 360)
    lam = math.radians(L + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    eps = math.radians(23.439 - 0.0000004 * n)
    dec = math.asin(math.sin(eps) * math.sin(lam))
    ra = math.degrees(math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam)))
    gmst = (18.697374558 + 24.06570982441908 * n) % 24
    ha = math.radians(gmst * 15 + lon - ra)
    la = math.radians(lat)
    return round(math.degrees(math.asin(math.sin(la) * math.sin(dec) + math.cos(la) * math.cos(dec) * math.cos(ha))), 1)


def light_note(t):
    """Huomautus, jos kuvien vaaleneminen voi johtua valon muutoksesta (aamu- tai iltahämärä)."""
    el = sun_elev(t)
    lo, hi = RULES['twilight_sun']
    if not (lo <= el <= hi):
        return el, None
    rising = sun_elev(t + 600) > el
    return el, ('Aamu valkenee' if rising else 'Iltahämärä') + ' (aurinko %+.0f°) – vaaleneminen voi johtua valosta eikä lumesta' % el


def prune_images(now):
    """Poistaa yli img_keep_days vanhat pikkukuvakansiot (havainnot säilytetään 14 vrk)."""
    root = OUT + '/img'
    if not os.path.isdir(root):
        return 0
    lim = datetime.fromtimestamp(now - RULES['img_keep_days'] * 86400, TZ).strftime('%Y-%m-%d')
    n = 0
    for d in sorted(os.listdir(root)):
        if len(d) == 10 and d[4] == '-' and d < lim:
            shutil.rmtree(os.path.join(root, d), ignore_errors=True)
            n += 1
    return n


def thumb(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    t = img.convert('RGB')
    t.thumbnail((360, 203))
    t.save(path, 'JPEG', quality=72, optimize=True)


def main():
    now = time.time()
    loc = datetime.fromtimestamp(now, TZ)
    night = loc.hour >= 18 or loc.hour < 8
    if not night and not os.environ.get('FORCE'):
        print('Päiväaika (%02d) – kameravahti ajetaan vain klo 18–08.' % loc.hour)
        return
    os.makedirs(OUT, exist_ok=True)
    cams = cameras()
    # kuvien ajantasaisuus, tiesääennusteet ja asemat
    cam_t = {}
    try:
        for s in get(DT + '/api/weathercam/v1/stations/data').get('stations', []):
            for p in s.get('presets', []):
                cam_t[p['id']] = p.get('measuredTime')
    except Exception as e:
        print('kameradata:', e)
    bb = 'xMin=%s&yMin=%s&xMax=%s&yMax=%s' % BBOX
    geo, fc = {}, {}
    try:
        for f in get(DT + '/api/weather/v1/forecast-sections?' + bb)['features']:
            g = f.get('geometry')
            if g:
                geo[f['id']] = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for s in get(DT + '/api/weather/v1/forecast-sections/forecasts?' + bb).get('forecastSections', []):
            fc[s['id']] = s.get('forecasts', [])
    except Exception as e:
        print('tiesääennuste:', e)
    stations = load('data/stations.json', {}).get('stations', [])
    st_vals = {}
    try:
        for s in get(DT + '/api/weather/v1/stations/data').get('stations', []):
            st_vals[s['id']] = {v['name']: v for v in s.get('sensorValues', [])}
    except Exception as e:
        print('asemadata:', e)

    ids = {x['id'] for x in stations}
    all_tr = [v[k]['value'] for i, v in st_vals.items() if i in ids for k in ('TIE_1', 'TIE_2', 'TIE_3', 'TIE_4') if k in v and v[k].get('value') is not None]
    area_tr = min(all_tr) if all_tr else None
    state = load(OUT + '/state.json', {})
    events = load(OUT + '/events.json', [])
    night_key = (datetime.fromtimestamp(now - 8 * 3600, TZ)).strftime('%Y-%m-%d')   # yö nimetään illan päivämäärällä
    img_count = sum(1 for e in events if e.get('night') == night_key for k in ('img', 'img_prev') if e.get(k)) \
        + sum(1 for e in events if e.get('night') == night_key for im in e.get('imgs', []) for k in ('img', 'img_prev') if im.get(k))
    rows, out, unusable, cands = [], [], [], []
    warm_skipped = 0
    for c in cams:
        pid = c['preset']
        st = state.setdefault(pid, {'hist': []})
        rec = {'preset': pid, 'cam': c['cam'], 'name': c['name'], 'dir': c['dir'], 'road': c['road']}
        mt = parse_t(cam_t.get(pid))
        rec['img_t'] = cam_t.get(pid)
        try:
            img = Image.open(io.BytesIO(get(c['url'], raw=True)))
            img.load()
            f = features(img)
        except Exception as e:
            unusable.append({'preset': pid, 'name': c['name'], 'dir': c['dir'], 'why': 'kuvaa ei saatu'})
            rec.update({'status': 'ei kuvaa'})
            out.append(rec)
            continue
        rec.update(f)
        why_bad = None
        if mt and now - mt > RULES['stale_min'] * 60:
            why_bad = 'kuva vanha (%d min)' % ((now - mt) // 60)
        elif f['mean'] < RULES['unusable_mean'] or f['dark'] > 0.9:
            why_bad = 'kuva liian tumma'
        hist = [h for h in st['hist'] if now - h[0] <= 12 * 3600]
        prev = [h for h in hist if 25 * 60 <= now - h[0] <= 45 * 60]
        old = [h[1] for h in hist if now - h[0] >= 45 * 60]
        base = round(median(old), 3) if len(old) >= 4 else None
        pv = prev[-1][1] if prev else None
        rec['base'], rec['prev'] = base, pv
        flag = False
        reason = ''
        if why_bad:
            unusable.append({'preset': pid, 'name': c['name'], 'dir': c['dir'], 'why': why_bad})
            rec['status'] = why_bad
        else:
            if base is not None and f['bright'] - base >= RULES['jump_base'] and (pv is None or f['bright'] - pv >= RULES['jump_prev']):
                flag, reason = True, 'tien alue vaaleni: %d %% (tavallisesti %d %%)' % (round(f['bright'] * 100), round(base * 100))
            elif base is not None and f['white'] >= RULES['abs_white'] and base < 0.15 and (pv is None or f['bright'] - pv >= RULES['jump_prev']):
                # pelkkä valkoisuus ei riitä: kuvasuunnalla pitää olla jo tavallinen taso (vähintään tunti historiaa),
                # muuten vaaleat tiemerkinnät tai vaalea asfaltti antaisivat turhia havaintoja
                flag, reason = True, 'valkoista tien alueella %d %%' % round(f['white'] * 100)
            rec['status'] = 'muutos' if flag else 'ok'
            hist.append([round(now), f['bright'], f['white']])
        st['hist'] = hist[-60:]
        # ennuste ja asema kameran kohdalla
        seg, sd = None, float('inf')
        for sid, lines in geo.items():
            if sid not in fc:
                continue
            d = line_dist((c['lon'], c['lat']), lines)
            if d < sd:
                sd, seg = d, sid
        fcx = None
        if seg and sd <= 2000:
            F = fc[seg]
            o = next((x for x in F if x.get('type') == 'OBSERVATION'), None)
            f2 = next((x for x in F if x.get('forecastName') == '2h'), None)
            reasons = set()
            for x in (o, f2):
                r = (x or {}).get('forecastConditionReason') or {}
                reasons |= {r.get('roadCondition'), r.get('frictionCondition')}
                if r.get('freezingRainCondition'): reasons.add('ICE')
            normal = all((x or {}).get('overallRoadCondition', 'NORMAL_CONDITION') == 'NORMAL_CONDITION' for x in (o, f2)) and not (reasons & WINTER)
            fcx = {'seg': seg, 'tr': (o or {}).get('roadTemperature'), 'tr2': (f2 or {}).get('roadTemperature'),
                   'cond': (o or {}).get('overallRoadCondition'), 'cond2': (f2 or {}).get('overallRoadCondition'),
                   'reasons': sorted(x for x in reasons if x), 'normal': normal}
        stx = None
        near = sorted(stations, key=lambda s: dist((s['lon'], s['lat']), (c['lon'], c['lat'])))[:1]
        if near and dist((near[0]['lon'], near[0]['lat']), (c['lon'], c['lat'])) <= 4000:
            v = st_vals.get(near[0]['id'], {})
            tr = [v[k]['value'] for k in ('TIE_1', 'TIE_2', 'TIE_3', 'TIE_4') if k in v]
            keli = next((v[k] for k in ('KELI_1', 'KELI_2', 'KELI_3', 'KELI_4') if k in v and v[k].get('value')), None)
            stx = {'id': near[0]['id'], 'name': near[0]['name'], 'tr': min(tr) if tr else None,
                   'keli': (keli or {}).get('sensorValueDescriptionFi') or (keli or {}).get('value')}
        rec['fc'], rec['st'] = fcx, stx
        # lämpöraja: kun tienpinta on sekä ennusteessa että asemalla yli warm_tr, lunta tai jäätä ei voi olla (ajovalot, märän tien heijastus)
        temps = [t for t in ((fcx or {}).get('tr'), (fcx or {}).get('tr2'), (stx or {}).get('tr')) if t is not None]
        if not temps and area_tr is not None:
            temps = [area_tr]   # ei ennustetta eikä asemaa lähellä: käytetään urakan kylmintä asemaa
        if flag and temps and min(temps) > RULES['warm_tr']:
            flag = False
            rec['status'] = 'lämmin tie, ei kirjata'
            warm_skipped += 1
        if flag:
            cands.append({'pid': pid, 'c': c, 'img': img, 'f': f, 'reason': reason, 'base': base, 'pv': pv, 'fc': fcx, 'st': stx, 'rec': rec})
        else:
            st.pop('pend', None)
            for e in events:
                if e.get('preset') == pid and e.get('open'):
                    e['open'] = False; e['end'] = iso(now)
        out.append(rec)
        rows.append([iso(now), pid, rec.get('img_t') or '', f['mean'], f['bright'], f['white'], f['dark'], f['sat'], f['mode'],
                     '' if base is None else base, '' if pv is None else pv, 1 if flag else 0, why_bad or ''])

    # havainnot: yksittäinen kuvasuunta vai laaja muutos koko alueella
    n_ok = sum(1 for r in out if r.get('status') in ('ok', 'muutos'))
    sun, lnote = light_note(now)
    region_min = max(RULES['region_min'], math.ceil(RULES['region_share'] * n_ok))
    reg = next((e for e in reversed(events) if e.get('kind') == 'alue' and e.get('open') and now - parse_t(e['last']) <= 40 * 60), None)
    day = datetime.fromtimestamp(now, TZ).strftime('%Y-%m-%d')
    hm = datetime.fromtimestamp(now, TZ).strftime('%H%M')

    def save_imgs(cd, ev, with_prev=True):
        nonlocal img_count
        if img_count + (2 if with_prev else 1) > MAX_IMG_PER_NIGHT:
            return
        pid, c = cd['pid'], cd['c']
        p_now = '%s/img/%s/%s_%s.jpg' % (OUT, day, pid, hm)
        thumb(cd['img'], p_now); ev['img'] = p_now[len('data/'):]
        img_count += 1
        if not with_prev:
            return
        try:   # vertailukuva noin 30 min takaa Digitrafficin kuvahistoriasta
            hst = get(DT + '/api/weathercam/v1/stations/%s/history' % c['cam'])
            pr = next((p for p in hst.get('presets', []) if p.get('id') == pid), None)
            cand = [h for h in (pr or {}).get('history', []) if h.get('lastModified') and 20 * 60 <= now - parse_t(h['lastModified']) <= 60 * 60]
            if cand:
                h0 = min(cand, key=lambda h: abs(now - parse_t(h['lastModified']) - 30 * 60))
                pim = Image.open(io.BytesIO(get(h0['imageUrl'], raw=True)))
                p_prev = '%s/img/%s/%s_%s_ed.jpg' % (OUT, day, pid, hm)
                thumb(pim, p_prev); ev['img_prev'] = p_prev[len('data/'):]; ev['img_prev_t'] = h0['lastModified']
                img_count += 1
        except Exception as e:
            print('vertailukuva', pid, e)

    if cands and (len(cands) >= region_min or reg):
        # laaja muutos: yksi aluetapahtuma, johon liitetään myös äskettäin alkaneet yksittäiset havainnot
        if reg is None:
            reg = {'id': 'alue-' + str(round(now)), 'kind': 'alue', 'name': 'Laaja muutos urakka-alueella', 'night': night_key,
                   'start': iso(now), 'last': iso(now), 'n': 0, 'status': 'havaittu', 'open': True, 'cams': [], 'imgs': [],
                   'analyzed': n_ok, 'peak': 0, 'test': not night}
            for e in [e for e in events if e.get('kind') != 'alue' and e.get('open') and 0 <= now - parse_t(e['start']) <= 60 * 60]:
                reg['cams'].append({'preset': e['preset'], 'cam': e.get('cam'), 'name': e['name'], 'dir': e.get('dir'), 'road': e.get('road'),
                                    't': e['start'], 'bright': e.get('bright'), 'base': e.get('base'), 'fc_normal': (e.get('fc') or {}).get('normal'), 'st': e.get('st')})
                if e.get('img') and len(reg['imgs']) < 3:
                    reg['imgs'].append({k: e.get(k) for k in ('img', 'img_prev', 'img_prev_t', 'name', 'dir')})
                reg['start'] = min(reg['start'], e['start'])
                events.remove(e)
            events.append(reg)
        reg['last'] = iso(now); reg['n'] += 1
        reg['status'] = 'vahvistettu' if reg['n'] >= 2 else 'havaittu'
        reg['analyzed'] = max(reg.get('analyzed', 0), n_ok)
        reg['peak'] = max(reg.get('peak', 0), len(cands))
        known = {x['preset'] for x in reg['cams']}
        for cd in sorted(cands, key=lambda cd: -(cd['f']['bright'] - (cd['base'] or 0))):
            if cd['pid'] in known:
                continue
            c = cd['c']
            reg['cams'].append({'preset': cd['pid'], 'cam': c['cam'], 'name': c['name'], 'dir': c['dir'], 'road': c['road'], 't': iso(now),
                                'bright': cd['f']['bright'], 'base': cd['base'], 'fc_normal': (cd['fc'] or {}).get('normal'), 'st': cd['st']})
            if len(reg['imgs']) < 3:
                im = {'name': c['name'], 'dir': c['dir']}
                save_imgs(cd, im, with_prev=len(reg['imgs']) < 2)
                if im.get('img'):
                    reg['imgs'].append(im)
        reg['count'] = len(reg['cams'])
        fcn = [x['fc_normal'] for x in reg['cams'] if x.get('fc_normal') is not None]
        reg['fc_normal'], reg['fc_warned'] = sum(1 for x in fcn if x), sum(1 for x in fcn if not x)
        reg['surprise'] = reg['fc_normal'] > reg['fc_warned']
        sts = {}
        for x in reg['cams']:
            if x.get('st') and x['st'].get('id') not in sts:
                sts[x['st']['id']] = x['st']
        reg['stations'] = list(sts.values())[:5]
        reg['sun'] = sun
        reg['reason'] = '%d / %d kuvasuuntaa vaaleni samaan aikaan – %s' % (reg['count'], reg['analyzed'],
                        'hämärässä, joten syy voi olla valon muutos: tarkista kuvista' if lnote else 'todennäköisesti lumisade tai lumikuuro alueella')
        if lnote:
            reg['note'] = lnote
    else:
        # yksittäiset havainnot: ensimmäinen merkintä = havaittu, seuraava peräkkäinen = vahvistettu
        for cd in cands:
            pid, c, f = cd['pid'], cd['c'], cd['f']
            ev = next((e for e in reversed(events) if e.get('preset') == pid and e.get('open')), None)
            if ev and now - parse_t(ev['last']) <= 40 * 60:
                ev['last'] = iso(now); ev['n'] += 1; ev['status'] = 'vahvistettu'; ev['bright_max'] = max(ev['bright_max'], f['bright'])
                continue
            # vahvistus ennen kirjausta: yksittäinen vaalea kuva (ohi ajava auto) ei riitä, muutoksen pitää näkyä kahdessa peräkkäisessä kuvassa
            pend = state[pid].get('pend')
            if not pend or now - pend > 40 * 60:
                state[pid]['pend'] = round(now)
                cd['rec']['status'] = 'odottaa vahvistusta'
                continue
            state[pid].pop('pend', None)
            fcx = cd['fc']
            ev = {'id': pid + '-' + str(round(now)), 'preset': pid, 'cam': c['cam'], 'name': c['name'], 'dir': c['dir'], 'road': c['road'],
                  'night': night_key, 'start': iso(pend), 'last': iso(now), 'n': 2, 'status': 'vahvistettu', 'open': True,
                  'reason': cd['reason'], 'bright': f['bright'], 'bright_max': f['bright'], 'base': cd['base'], 'prev': cd['pv'], 'mode': f['mode'],
                  'fc': fcx, 'st': cd['st'], 'surprise': bool(fcx and fcx['normal']), 'test': not night, 'sun': sun}
            notes = []
            if fcx and fcx.get('tr') is not None and fcx['tr'] >= 2:
                notes.append('tienpinta ennusteessa +%.1f °C – voi olla märän tien heijastus' % fcx['tr'])
            if lnote:
                notes.append(lnote)
            if notes:
                ev['note'] = '; '.join(notes)
            save_imgs(cd, ev)
            events.append(ev)
    # tallennus
    for e in events:
        if e.get('open') and now - parse_t(e['last']) > 60 * 60:
            e['open'] = False; e['end'] = e['last']
    events = [e for e in events if now - parse_t(e['start']) <= 14 * 86400]
    save(OUT + '/events.json', events)
    save(OUT + '/state.json', state)
    month = datetime.fromtimestamp(now, timezone.utc).strftime('%Y-%m')
    logf = '%s/log-%s.csv' % (OUT, month)
    new = not os.path.exists(logf)
    with open(logf, 'a', encoding='utf-8') as f:
        if new:
            f.write('t,preset,img_t,mean,bright,white,dark,sat,mode,base,prev,flag,unusable\n')
        for r in rows:
            f.write(','.join(str(x).replace(',', ' ') for x in r) + '\n')
    pruned = prune_images(now)
    save(OUT + '/latest.json', {'t': iso(now), 'night': night, 'mode': 'varjotila', 'rules': RULES, 'n': len(cams),
                                'analyzed': len(rows), 'unusable': unusable, 'flagged': len(cands), 'warm_skipped': warm_skipped, 'sun': sun, 'light': lnote,
                                'region': ({'id': reg['id'], 'count': reg['count']} if reg and reg.get('last') == iso(now) else None), 'presets': out})
    print('Kameravahti %s: %d kuvaa, %d ei kelpaa, %d muutosta%s%s' % (iso(now), len(rows), len(unusable), len(cands),
          ' (aluetapahtuma %d kuvasuuntaa)' % reg['count'] if reg and reg.get('last') == iso(now) else '',
          ', poistettu %d vanhaa kuvakansiota' % pruned if pruned else ''))


if __name__ == '__main__':
    main()
