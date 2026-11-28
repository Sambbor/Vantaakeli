# Muutosloki

Kelikeskuksen (tämä sivu) ja Päivystyskirjan muutokset selkokielellä, uusin ensin.

## 27.11.2026: Toimenpidekartassa urakat nimellä (ts2)
Samulin päätös 27.11. Koko Suomen toimenpidekartassa urakat näkyvät nyt nimellä (esim. "Heinola 22-27") koodin sijaan: valintalistassa, urakkalistassa, kartan korostuksessa ja urakan otsikossa. Nimet tulevat Väyläviraston hoitourakoiden aineistosta (Tiesää-arkisto `data/urakat/`, tieverkko.py tv3). Urakoitsijoita ei näytetä. Osoite toimii edelleen urakkakoodilla (`suomi/?u=149`). Koko Suomen yökooste pysyy ennallaan ilman nimiä.

- **Perutaan:** suomi/index.html, tunnus ts2: `u.nimi` takaisin `u.k`.

## 27.11.2026: Koko Suomen toimenpidekartta (ts1, uusi sivu, ei sääntömuutos)
Samulin pyyntö 27.11.: Heinolan toimenpidekartan tapainen sivu kaikille maanteiden hoitourakoille, ilman tiesääasemia, pelkät ajot kelattavaksi. Sivu: https://sambbor.github.io/Vantaakeli/suomi/

- **Urakan valinta:** Suomen kartalta (väri = ELY-alue) tai listasta. Urakat ovat urakkakoodeina ja ELY-alueina, ei nimiä eikä urakoitsijoita, kuten koko Suomen yökoosteessa. Osoite `suomi/?u=<koodi>&pv=<päivä>&jakso=night|day|full` avaa suoraan urakan ja jakson.
- **Kelaus kuten Heinolassa:** suolaus, auraus, hiekoitus, tasaus ja kelintarkastus kartalla, aikajana, toisto, koneet liikkeellä ja tiet (osuus urakan teistä, viimeisin kirjaus). Nyt-tila päivittyy 2 minuutin välein. Päivän voi valita 60 vuorokautta taaksepäin (Digitraffic antoi 27.11. ajoja ainakin 2 kk ajalta).
- **Ajoja ei tallenneta:** ne haetaan suoraan Digitrafficista. Tiesää-arkistoon tallennetaan vain urakoiden tieverkot (`data/urakat/`, noin 8 Mt, päivitys kerran kuukaudessa, tiedosto muuttuu vain tieverkon muuttuessa).
- **Erot Heinolan sivuun:** päätellyt suolausreitit puuttuvat (ne lasketaan vain Heinolalle). Paikannimet ovat likimääräisiä kuntakeskuksia.
- **Ei muuttunut:** kelikeskus, Heinolan sivu ja kaikki laskenta.
- **Perutaan:** poista kansio `suomi/` tästä säilöstä sekä Tiesää-arkistosta `data/urakat/`, `meta/tieverkko_suomi.json`, `.github/workflows/tieverkko-suomi.yml` ja tieverkko.py:n funktio `suomi()` (tunnus tv2).

## 27.11.2026: Vuosaaren asemat pois käytöstä (po2, ei sääntömuutos)
Samulin päätös 27.11.: tie 103:n asemat Vuosaari eteläinen (1071) ja Vuosaari pohjoinen (1073) on otettu pois käytöstä.

- **Keruu:** asemista ei tehdä rivejä, eivätkä ne ole mukana varjokomennossa, puhelinilmoituksissa, suolan seurannassa eivätkä vajaiden asemien lainauksessa.
- **Sivu:** asemat näkyvät harmaana merkinnällä "otettu pois käytöstä 27.11.2026". Ne eivät ole mukana liukkausennusteessa, korteissa eivätkä päätöksessä, eikä niitä lasketa vioiksi.
- **Liukkausennuste-taulukko** jättää nyt pois myös asemat, jotka ovat automaattisesti pois käytöstä (ei mittauksia yli 7 vrk:een, po1). Ennen ne laskettiin Digitrafficin tiekohtaennusteella.
- **28.11. lisäys (Samuli: "nämä asemat pois kaikesta datasta, tie ei ole käytössä"):** Vuosaari näkyi vielä Jälkiselvityksessä (yön kelaus luki vanhoja keruun rivejä) ja näytti siellä liukasta. Nyt asemat ja niiden lähikamerat eivät ole sivulla lainkaan, ei edes harmaana. Keruu poistaa ne kerran kaikista tallennetuista tiedostoista:
  - keruun rivit (obs, seg, roadsurf ja tr1-vanhat)
  - yöt ja yön yhteenveto (asemamäärät laskettu uudelleen)
  - varjokomennot, learn.json, roadsurf, stations.json ja index.json
  - Päivystyskirjan paketit (data/kirja)
  - tien 103 rivit

  Koekopiossa poistui 942 riviä ja 35 tiedostoa. Päivystyskirjan rakentaja (rakenna.py) ja RoadSurf-vertailu eivät enää ota asemia mukaan. Koko maan Tiesää-arkistoon asemat jäävät, ja Päivystyskirjan koko maan urakkakoodi 1073 (Etelä-Pohjanmaa) ei ole asema.
- **Perutaan:** poista `offSt` Vantaan urakan tiedoista (collect.mjs ja laskenta.html `URAKAT.vantaa`) ja `OFF_ST` rakenna.py:stä. Asemat palaavat seuraavassa keruussa, mutta poistettuja vanhoja rivejä ei palauteta (ne löytyvät git-historiasta).

## 26.11.2026: Testi – kuuran tienpinta omasta tienpintamallista kaistan 1 pohjalla (tm1, EI käytössä)
Sama testi kuin alla, mutta tienpinta on nyt kaistalta 1 (ka1). Kaistaeroa ei enää lisätä, koska sivu ja tienpintamalli käyttävät samaa kaistaa. Aineistona olivat Vantaan 13 asemaa 2.–26.11.: 6 289 laskentaa, joista 342 riviä (5 %) jäi varaketjulle. Nykyinen = ka1 ilman tienpintamallia, a = malli vain kuuraan, b = malli koko indeksiin.

- **Kuurakertymä +6 h:** ennuste on nykyisellä keskimäärin 0,59 °C·h, a:lla ja b:llä 0,13, kun mitattu on 0,31. Kuuratuntien tienpinnan virhe on −0,91 °C → +0,03 °C. Vähintään 4 °C·h:n ennusteita oli 322 → 71, turhat 218 → 22, ohi 69 → 124.
- **Indeksi ≥ 50, kuura-syy** (nykyinen / a / b): +2 h 66 / 41 / 41, +6 h 243 / 62 / 62, +12 h 364 / 69 / 69. Märkä tie jäätyy +6 h 73 / 77 / 24.
- **Olosuhde, osui / ohi / turha:**

| Ennuste | nykyinen | a | b |
|---|---|---|---|
| +2 h | 158 / 152 / 155 | 144 / 166 / 144 | 147 / 163 / 120 |
| +6 h | 215 / 95 / 376 | 162 / 148 / 256 | 166 / 144 / 223 |
| +12 h | 240 / 70 / 590 | 192 / 118 / 419 | 191 / 119 / 357 |

- **Kitka:** 12 liukasta kohdetuntia. Osumat pysyvät, +6 h:n turhat ovat 473 / 333 / 306.
- **Varjokomento ja puhelin** (2.–26.11.): toimenpideöitä 13 / 12 / 11, Liukkausriski-ilmoituksia 11 / 11 / 10. b jättää 11.11. pois, ja ilmoitus siirtyy myöhemmäksi 6.11. (22.07 → 00.09) ja 8.11. (00.09 → 01.08).
- **Huom:** mitattu kertymä (totuus) on keruun riveiltä ja vielä kylmimmästä kaistasta laskettu. Kaistan 1 mukaan mitattu kertymä olisi todennäköisesti hieman pienempi, joten tienpintamallin alakanttiin jäävä ennuste on osin näennäinen.

## 26.11.2026: Tienpinta on nyt kaistan 1 anturi (ka1, säännöt v24)
Samulin päätös 26.11. Alalla katsotaan yleensä kaistan 1 anturia. Sivu ja keruu valitsivat tähän asti asemalta kylmimmän kaistan, mutta Tiesää-arkisto, oma tienpintamalli ja Päivystyskirja käyttävät kaistaa 1. Arkiston (12.10.–26.11.) mukaan kaistat olivat öisin eri puolilla nollaa vain 2,5 %:ssa (Vantaa) ja noin 1,5 %:ssa (koko maa) tunneista, eikä tie silloin juuri ollut liukas.

- **Uusi tapa:** tienpinta on kaistan 1 anturi. Jos se puuttuu, on yli 2 tuntia vanha tai epäuskottava (yli 10 °C ilmaa kylmempi), käytetään kaistaa 2 (sitten 3 ja 4).
- **Samalta kaistalta tulevat** keli tai tienpinnan tila, jäätymispiste, suolan määrä ja muutosnopeus. Jos kaistalla ei ole keliä, keli haetaan muilta kaistoilta kuten ennenkin.
- **Ennallaan:** kitka (KITKA1/KITKA2 pienempi), vesi, lumi ja jää (anturi 1 tai 2) sekä vajaiden asemien lainaus (vh2).
- **Kaikki tienpintaa käyttävä seuraa:** liukkausindeksi, havaittu liukkaus (tie enintään +1 °C), kuurakertymä, suolan kesto, yön yhteenveto, varjokomento ja puhelin.
- **Kaista näkyy:** asemakortissa lukee "°C tie · kaista 1", ja meteogrammissa "Tienpinta (kaista 1)". Tiesääasemat-taulukossa on merkintä vain, jos käytössä on varakaista ("kaista 2").
- **Oppiminen:** keruun riveille tulee uusi sarake tr_lane (käytetty kaista). Opittu tienpintakorjaus ja ilman ero lasketaan vain kaistan tienpinnasta.
  - Vanhoille riveille kaistan 1 lukema (varalla kaista 2) haettiin Tiesää-arkistosta (lähin mittaus ±15 min) tiedostoon data/tr1-vanhat.csv.
  - Vantaalla löytyi 18 371 riviä 27 523:sta. Puuttuvat ovat 1.–11.10. (arkisto alkaa 12.10.), Pirkkola (arkistossa ei kaistoja 1–2) ja Keimola (tienpinta rajattu jo säännöissä). Salossa löytyi 16 718 riviä 18 051:stä (salo/data/tr1-vanhat.csv). Tämän päivän rivit puuttuvat, koska arkisto päivittyy viiveellä.
  - Kuuraennusteen tarkistus (frostFc) aloittaa alusta ka1-riveistä, koska vanhojen rivien mitattu kertymä on laskettu kylmimmästä kaistasta.
- **Vaikutus Vantaalla** (13 asemaa, 13.10.–26.11., Tiesää-arkiston syötteet, nykyinen → ka1):
  - Indeksi ≥ 50, kuura: +2 h 88 → 66, +6 h 301 → 248, +12 h 412 → 397.
  - Märkä tie jäätyy: +2 h 83 → 66, +6 h 88 → 73, +12 h 92 → 86. Muut syyt pysyvät lähes ennallaan.
  - Olosuhde (osui / ohi / turha): +2 h 170/148/176 → 158/160/155, +6 h 218/100/434 → 215/103/381, +12 h 245/72/629 → 240/77/616.
  - Kitka < 0,6: 12 liukasta kohdetuntia, osumat pysyvät (+6 h yksi ohi). Turhat: +2 h 270 → 247, +6 h 518 → 477, +12 h 694 → 678.
- **Vaikutus koko maassa** (12.10.–24.11., kitkatotuus):

| Ennuste | Turhat | Osumat |
|---|---|---|
| +2 h | 27 321 → 26 099 (−4,5 %) | 13 422 → 13 367 (−0,4 %) |
| +6 h | 39 183 → 37 998 (−3,0 %) | 12 493 → 12 405 (−0,7 %) |
| +12 h | 46 274 → 45 752 (−1,1 %) | 12 845 → 12 786 |

  Kuura-syyn hälytykset +6 h: 23 592 → 21 926.
- **Puhelin 1.–26.11. uudelleen ajettuna:** 14 → 13 ilmoitusta. Pois jäi 4.11. klo 01.09 Liukkausriski; tuona yönä anturit hälyttivät, mutta tiet olivat kuivat. Toimenpideöitä on edelleen 13, mutta toimenpidetunteja vähemmän öinä 3.11., 8.11., 19.11. ja 23.11.
- **Perutaan:** kaistavalinta takaisin kylmimmäksi kolmessa kohdassa ja RULES_VERSION = 'v23':
  - collect.mjs `stObsVals` (`lane = lanes[0]` → kylmin)
  - laskenta.html `normalizeStation`
  - Tiesää-arkiston retro.mjs `obsOf` (tai ympäristömuuttuja RETRO_LANE=min)

  Sarake tr_lane ja tiedosto tr1-vanhat.csv voivat jäädä, ja `learnFromRows` toimii myös ilman niitä.

## 26.11.2026: Testi – kuuran tienpinta omasta tienpintamallista (tm1, EI käytössä, sääntöversio ei muutu)
Testi 1.12. säätökierrosta varten. Coworkin selvityksen (claude/kuura_ennustevirhe_2026-11-26.md) mukaan sivun ennustama kuurakertymä on noin 2,5-kertainen mitattuun verrattuna, koska kuuratunteina ennustettu tienpinta (+6 h) on 1,0–1,3 °C liian kylmä.

- **Mitä tehtiin:** liukkaussääntöihin tuli variantti, joka on oletuksena pois päältä. Se ottaa tienpinnan Tiesää-arkiston omasta tienpintamallista (tm/latest.json).
  - Pisteet ovat 0 h (aseman mittaus nyt) sekä 2, 4, 6 ja 12 h.
  - Malli ennustaa kaistaa 1, sivu käyttää kylmintä kaistaa, joten pisteisiin lisätään kaistaero (mittaus nyt − mallin lähtöarvo), joka hiipuu 12 tunnissa.
  - Välitunnit lasketaan sääennusteen käyrällä kuten ennenkin. Digitrafficin kiinnitystä ja opittua korjausta ei lisätä. Kastepiste on ennallaan.
  - Jos asemaa ei ole mallissa tai ennuste on yli 75 minuuttia vanha, käytetään nykyistä laskentaa.
  - Sivu, keruu ja puhelin toimivat kuten ennen. Sääntötestin kaikki 1 512 tapausta pysyivät ennallaan.
- **Testiaineisto:** Vantaan 13 asemaa 2.–25.11., yksi laskenta tunnissa Tiesää-arkiston syötteillä. Tienpintamallin ennusteet tulivat tiedostosta tm/verif-2026-11.csv (lähin ajo ±20 min). Totuus on keruun rivit (obs-2026-11.csv).
  - Laskentoja oli 6 193. Näistä 312 riviä (5 %) jäi varaketjulle, koska mallin ajoa ei löytynyt. Kaikkiaan +2 h:n kohdalla tienpintamallia käytettiin 5 567 tunnissa, ja loput 626 (nämä 312 mukaan lukien) laskettiin varaketjulla. Syynä oli puuttuva mallipiste tai puuttuva tienpinnan mittaus.
- **Vaihtoehdot:** a) tienpintamalli vain kuurakertymään ja kuura-osaan, b) tienpintamalli koko indeksiin.
- **Kuurakertymä +6 h** (ennuste vs. aseman mitattu): nykyinen ennustaa keskimäärin 0,70 °C·h, kun mitattu on 0,32 °C·h. Uudella tienpinnalla ennuste on 0,16 °C·h, eli nyt ennuste jää alakanttiin. Kuuratunneilla tienpinnan virhe on −1,03 °C → 0,00 °C. Vähintään 4 °C·h:n ennusteita oli 365, nyt 82. Turhat 258 → 23, ohi 66 → 114.
- **Indeksi ≥ 50 -tunnit syittäin** (nykyinen / a / b):

| Ennuste | kuura | märkä tie jäätyy | muut |
|---|---|---|---|
| +2 h | 88 / 60 / 60 | 83 / 83 / 51 | 175 / 175 / 177 |
| +6 h | 293 / 78 / 78 | 88 / 96 / 28 | 277 / 282 / 307 |
| +12 h | 378 / 72 / 72 | 92 / 95 / 25 | 384 / 461 / 459 |

  Kun kuura-syy poistuu, osa tunneista näkyy seuraavan syyn alla (yleensä Digitraffic), siksi "muut" kasvaa.
- **Olosuhdetotuus** (kuurakertymä ≥ 4 °C·h, mitattu liukas tai märkä tie pakkasella), osui / ohi / turha:

| Ennuste | nykyinen | a | b |
|---|---|---|---|
| +2 h | 170 / 120 / 176 | 160 / 130 / 158 | 162 / 128 / 126 |
| +6 h | 218 / 72 / 415 | 169 / 121 / 271 | 173 / 117 / 224 |
| +12 h | 244 / 46 / 558 | 196 / 94 / 421 | 191 / 99 / 354 |

- **Kitkatotuus** (kitka < 0,6): jaksolla oli vain 12 liukasta kohdetuntia, ja ne osuivat kaikilla vaihtoehdoilla (+6 h a ja b: 11/12). Turhat:
  - +2 h: 270 / 245 / 221
  - +6 h: 501 / 347 / 310
  - +12 h: 634 / 478 / 418
- **Varjokomento ja puhelin öittäin** (2.–25.11.): toimenpideöitä 12 / 12 / 11 ja Liukkausriski-ilmoituksia 12 / 12 / 11.
  - Toimenpidetunteja oli vähemmän öinä 3.11. (5 → 4), 8.11. (4 → 1), 14.11. (8 → 6) ja b:llä 19.11. (6 → 4).
  - 11.11. b ei tehnyt toimenpidettä eikä ilmoitusta (nykyinen: 1 tunti, ilmoitus klo 00.09).
  - Ilmoitus siirtyi myöhemmäksi 6.11. (22.07 → 23.09) ja 8.11. (00.09 → 01.08).
  - Muuten yöt pysyivät samoina, koska varjokomento ei jo nyt tee toimenpidettä pelkästä ennustetusta kuurasta ennen kuin kuuraa on alkanut kertyä.
- **Tulkinta säätökierrokselle:** tienpintamalli poistaa kuuran yliennusteen. Turhat kuurahälytykset vähenevät noin 70–80 %, mutta kertymä jää nyt mitattua pienemmäksi, ja olosuhteen osumia menetetään +6 h:lla 49 (a) tai 45 (b). Ratkaistavaksi jää, otetaanko käyttöön a vai b, ja tarvitaanko kuuran rajaan (4 °C·h) tai kertymään pieni lisä.
- **Perutaan:** variantti ei ole käytössä. Kokonaan poistettuna saannot.js:stä lähtevät `TM_MAX_AGE`, `tmAt`, `trF` ja `trK` (slipRisk), ja niiden tilalle palaa `tr`.

## 25.11.2026: Keskitytään olennaiseen – kitka ratkaisee, vajaat asemat lainaavat, vähemmän ilmoituksia ja suolanauha lyhyeksi (vh1, vh2: säännöt v23; np2, sn1: ei sääntömuutos)
Samulin päätökset 25.11. Klo 07.07 Tilanne-välilehti näytti KIIREELLISTÄ "Asemat hälyttävät nyt" kuudesta asemasta. Viisi niistä antoi Sade-varoituksen heikosta lumikuurosta, vaikka kitka oli 0,82. Vuosaari (ei kitka-anturia) antoi Häly-varoituksen, ja sen indeksi oli 90 ("märkä tie jäätyy") pelkästään oman "kostea"-tilan takia. Itäsalmessa (3,9 km) ei ollut vettä. Tiesää-arkiston (12.10.–24.11., koko maa, tie enintään +1 °C) mukaan tie liukastui 2 tunnin sisällä varoituksen jälkeen 1–14 %:ssa ja tilan "liukas" jälkeen 7,7 %:ssa tapauksista, kun kitka oli vielä hyvä.

- **Havaittu liukkaus = mitattu kitka (vh1, vh2):** asema "mittaa liukasta" vain, kun kitka on alle 0,6 (kaistojen pienin) ja tie on enintään +1 °C. Aseman varoitukset (Varo, Häly, Kuura, Sade) ja tienpinnan tila eivät enää vaikuta. Sääntö koskee korttia "Asemat hälyttävät nyt", liukkausindeksiä, varjokomentoa, puhelinta, keruuta ja Tiesää-arkiston jälkitarkistusta.
- **Lunta tai jäätä anturilla, mutta kitka hyvä (vh2):** kun anturilla on jäätä tai lunta vähintään 0,05 mm, kitka on vähintään 0,6 ja tie enintään +1 °C, indeksi on 30 eli seuranta 2 tunnin ajan. Syynä lukee "lunta/jäätä anturilla, kitka vielä hyvä". Tämä ei tee KIIREELLISTÄ.
- **Vajaat asemat lainaavat (vh2):** täydellä asemalla on vesi- ja kitka-anturi, ja lukema on enintään 2 tuntia vanha. Vajaasta asemasta käytetään omina vain tienpinnan lämpöä, ilman lämpöä, kastepistettä, suolaa ja jäätymispistettä. Vesi, tienpinnan tila, jää, lumi, kitka ja varoitus tulevat lähimmältä täydeltä asemalta enintään 10 km päästä. Niitä käyttävät havaittu liukkaus, märkä tie jäätyy (vr1) ja Digitrafficin rajaus kuivalle tielle (dk1). Tähän yhdistyy myös dk2:n lähin vesianturi. Vantaalla Porttipuisto lainaa Jakomäeltä (2,9 km), Vuosaari Itäsalmelta (3,9 km) ja Brobölentie Sipoonlahdelta (9,9 km). Jos täyttä asemaa ei ole 10 km sisällä, havaittua liukkautta ei tule ja märkä tie lasketaan vain ennustetusta sateesta.
- **Kortti ja Miksi?:** "Asemat hälyttävät nyt" näyttää esim. "Tie 3 Pirkkola: tie −0,4 °C, kitka 0,52". Vajaalla asemalla se näyttää esim. "Tie 103 Vuosaari eteläinen: lähimmän kitka-anturin mukaan (Itäsalmi 3,9 km) kitka 0,52, oma tie −0,4 °C". Päätöslaatikon Miksi?-kohdassa on rivi "Asemat ilman vesi- tai kitka-anturia: Tie 103 Vuosaari eteläinen: vesi ja kitka aseman Itäsalmi mukaan (3,9 km); …". Kortti ei enää syty aseman omasta märkä- tai kuurapäätelmästä; märän tien jäätyminen ja kuura ovat edelleen indeksin ennusteosissa. Varoitukset ja vajaiden asemien omat mittaukset näkyvät Tiesääasemat-välilehdellä ja kartan asemamerkissä.
- **Puhelin (np2):** vuorokaudessa (klo 08–08) lähtee enintään yksi "Liukkausriski" ja yksi "Asema mittaa liukasta". Jälkimmäiseen tulevat kaikki sillä hetkellä liukkaat tiet. "Päivitys"- ja "Liukkausriski poistui" -ilmoitukset on poistettu. Ennallaan: 10 tunnin ikkuna ja hiljaiset tunnit (tl2), kenttävahti ja keruun vahti, lähetyshistoria (notify.sent) ja Jälkiselvityksen puhelinrivi.
- **Suolanauha (sn1):** tien suolarivi näkyy vain, kun tiellä on toimenpide- tai seurantariski (indeksi vähintään 30) 10 tunnin ikkunassa ja suola loppuu ikkunan aikana tai on jo loppunut, esim. "Suola loppuu tieltä 3 klo 04.00" tai "Tieltä 3 suola loppunut (arvio klo 04.00)". Muuten nauhaa ei näytetä. "Merkitse suola" jää pieneksi linkiksi.
- **Ei muuttunut:** totuusmääritelmät, eli aamuvertailun "mitattu liukas" ja oppiminen (`obsSlippery`), Päivystyskirja ja jälkitarkistuksen kitkatotuus. Huom: aamuvertailu ja Päivystyskirja (`sensor_slip`) käyttävät edelleen aseman Häly-varoitusta ja keliä. Ennallaan ovat myös ennusteosat (märkä tie jäätyy, kuura, lumisade, jäätävä sade, Digitraffic), 10 tunnin ikkuna sekä Varjokomento-osio ja Jälkiselvitys.
- **Vaikutus Vantaalla:**
  - Keruun rivit 16.11. klo 14 – 25.11. klo 07: kortti oli päällä noin 66 tuntia, uudella säännöllä havaittua liukkautta on 15 tuntia (kitka alle 0,6 kylmällä tiellä 8 tuntia omilla asemilla).
  - Sääntötesti, 6 arkistopäivää: muutoksia vain vajailla asemilla. 70 hälytystuntia jäi pois (Brobölentie ja Porttipuisto, märkä tie jäätyy oman kelin takia), uusia ei tullut.
- **Vaikutus koko maassa** (kitkatotuus, samat päivät 12.10.–22.11.):
  - +2 h: turhat 25 718 → 24 003 (−6,7 %), osumat 11 109 → 10 845 (−2,4 %).
  - +6 h: turhat 36 219 → 35 919 (−0,8 %), osumat 10 853 → 10 814 (−0,4 %).
  - +12 h: lähes ennallaan.
- **Testit:**
  - 25.11. klo 07: KIIREELLISTÄ ei tule; Vuosaaren havaittu liukkaus ja indeksi ovat 0 (ennen 100).
  - Lumiyö 22.–23.11.: toimenpide-ehdotus pysyy koko yön. Mitattu liukas alkaa nyt klo 03 (kitka), ei enää 22.17 (Itäsalmen keli).
  - Yö 23.–24.11.: havaittua liukkautta 0 tuntia.
  - Puhelin 1.–25.11. uudelleen ajettuna (tunnin välein Tiesää-arkiston syötteillä): ennen 40, nyt 14 (Liukkausriski 12, Asema mittaa liukasta 2). Todellisuudessa lähti 62.
- **Perutaan:**
  - saannot.js: `RULES_VERSION = 'v22'`; `fullObs`, `slipObs`, `isFull` ja `obsLow` (slipRisk ja slipSeriesCore) pois.
  - Kutsujat takaisin omiin mittauksiin: `slipNow = obsSlippery(...)` ja `obsW = nearWater(...)`. Kutsujat ovat laskenta.html (`stationSlipSeries`), collect.mjs (asemarivit), Tiesää-arkiston retro.mjs (`fullAt` pois, entinen haara jää) ja testit/saannot.test.mjs (haara `R.fullObs` pois). Lopuksi `node testit/saannot.test.mjs --paivita`.
  - Kortti E (laskenta.html, tunnus vh1): edellinen versio, jossa `warnOn` ja `icy`.
  - np2 (collect.mjs `notifyPlan`): kohdat 1–2 tl2-versioon.
  - sn1 (laskenta.html `renderSaltStrip`): st1-versioon.

## 24.11.2026: Tilanne keskittyy seuraaviin 10 tuntiin, yksi taso ja Digitrafficin ajokeli pois (tl2, ei sääntömuutos)
Samulin päätös 24.11.: "Ei ole pahitteeksi jos jokin menee läpi mutta ei voi näin paljon turhaa olla." 24.11. iltapäivällä yläreunassa luki VALMISTAUDU – "Huono ajokeli ennusteessa" (Digitrafficin ajokeli: sohjoa, kova tuuli), vaikka liukkausriski oli vain seuranta, ja ruudut katsoivat sekaisin 12 ja 24 tuntia eteenpäin.

- **Digitrafficin ajokeli on poistettu:** kortti "Huono ajokeli ennusteessa", ruutu "Ajokeli 12 h" ja kartan valinta "Ajokeli 12 h". Kartalla tiet väritetään aina alimman tienpinnan mukaan. Digitrafficin tienpinta- ja keliennuste liukkausindeksissä on ennallaan.
- **Seuraavat 10 tuntia:** päätöslaatikko, Toimenpidetarve-kortit ja ruudut katsovat vain nyt…+10 h. Jos jokin kortti nousisi toimenpidetasolle vasta 10–24 tunnin päästä, päätöslaatikon alle tulee yksi rivi, esim. "Myöhemmin: Liukkaudentorjunta klo 05 (Tie 3 …)". Liukkausennuste-, Tiesääasemat- ja muut välilehdet näyttävät edelleen pidemmälle.
- **Yksi taso:** yläreunan taso tulee vain toimenpidekorteista (liukkaus, Asemat hälyttävät nyt, auraus ja lumi, Tiedot puuttuvat). Muut kortit (esim. "Tienpinta jäähtyy nopeasti") näkyvät Toimenpidetarve-osiossa. Kun mitään ei tarvita, päätöslaatikossa lukee "Ei toimenpidetarvetta – seuraavat 10 h".
- **Vähemmän tekstiä:** rivi "Varjokomento ehdottaa…" poistui päätöslaatikosta (vertailu näkyy Varjokomento-osiossa). Jos puhelimeen on lähtenyt toimenpideilmoitus ja sivun taso on eri, se kerrotaan päätöslaatikon Miksi?-kohdassa. Selitykset tekemättä jättämisestä (jäätävä sade, Digitraffic kuivalla tiellä, vain Digitraffic ennustaa jäätä) ovat kortin tai päätöslaatikon Miksi?-kohdassa. "Ei muita ehdotuksia" -teksti poistui.
- **Ruudut:** "Tie alin 10 h" (mitattu nyt tai ennuste, kumpi alempi), "Liukkausriski 10 h" ja "Sade 10 h" (lumi senttimetreinä, muuten millimetreinä).
- **Puhelin:** "Liukkausriski: toimenpide" lähtee vasta, kun aikaraja on 10 tunnin sisällä. Sama tilanne ei enää ilmoitu uudelleen saman yön aikana (ennen tila vanheni 6 tuntia aikarajan jälkeen, ja 23.–24.11. toimenpide ilmoitettiin klo 13.18, 22.18 ja 05.19). Ikkunan ulkopuolella jo olleet tiet eivät tee päivitystä, kun ne tulevat ikkunaan. Hiljaiset tunnit, "Asema mittaa liukasta" ja "Riski poistui" ennallaan.
- **Sivun päätös** (sivupaatos.json, klo 18 ja 22) lasketaan 10 tunnin ikkunalla ja merkitään win: 10.
- **Ei muuttunut:** varjokomento (ikkuna, yöehdotukset klo 18/22/00/02, aamuvertailu), Jälkiselvitys, Naapuriurakat, liukkausindeksi (sääntötesti 0 muutosta) ja "Asemat hälyttävät nyt".
- **Perutaan:** laskenta.html, tunnus tl2: `computeActions` takaisin yhdeksi 24 tunnin laskennaksi (`actionsFor`, `laterLine` ja `TL_WIN` pois), kortti G "Huono ajokeli ennusteessa" ja `OVERALL` takaisin, `renderSummary`, `renderActions`/`topCard`/`phoneLine`, `renderStatusLine` ja `pdDiff` edellisestä versiosta, kartan ajokelivalinta takaisin; collect.mjs `notifyPlan`: `NT_WIN`-rajaus, `allRoads` ja yön tarkistus (`P0.night`) pois.

## 24.11.2026: Asemat ilman vesianturia käyttävät lähintä vesianturia (dk2, säännöt v22)
Samulin päätös 24.11. Digitrafficin rajaus kuivalle tielle (dk1) ei toiminut asemilla, joilla ei ole vesianturia. Siksi esimerkiksi tie 103 (Vuosaari) jäi toimenpiteeseen pelkän Digitrafficin ennusteen takia, vaikka muut tiet laskivat seurantaan.

- **Uusi sääntö:** kun asemalla ei ole vesianturia, kuivuuden (vettä alle 0,1 mm, ei lunta eikä jäätä) ratkaisee lähin vesianturin asema enintään 10 km päässä. Muut dk1-ehdot pysyvät: ei sadetta Ilmatieteen laitoksen eikä Digitrafficin ennusteessa.
- **Vantaalla:** Porttipuisto → Jakomäki (2,9 km), Vuosaari → Itäsalmi (3,9 km), Brobölentie → Sipoonlahti (9,9 km). Koko Suomen jälkitarkistuksessa haetaan lähin vesianturi kaikista arkiston asemista, joten Brobölentien naapuri on siellä Box (Porvoo).
- **Ei muuttunut:** märkä tie jäätyy (vr1) lasketaan edelleen aseman omasta kelistä, joten vesianturiton asema voi yhä hälyttää märästä tiestä. Asemat, joilla on oma vesianturi, eivät muuttuneet.
- **Kortin rivi** kertoo, minkä aseman mukaan kuivuus on arvioitu, esim. "lähimmän vesianturin mukaan tie 103: Itäsalmi 3,9 km".
- **Vaikutus Vantaalla** (sääntötesti, 6 arkistopäivää): 74 Digitraffic-hälytystuntia jäi pois (Porttipuisto 41, Brobölentie 33), ei uusia. Näillä asemilla ei ole kitka-anturia, joten kitkavertailua ei voi tehdä.
- **Yöt:** 23.–24.11. Porttipuisto laskee seurantaan koko yön, Brobölentie klo 22 alkaen; Brobölentie pysyy klo 02 jälkeen toimenpiteessä märän tien takia. Lumiyönä 22.–23.11. mikään ei muuttunut. Tänään klo 13.16 ajettuna urakan taso laskee toimenpiteestä seurantaan (tie 103 Itäsalmen mukaan).
- **Perutaan:** saannot.js: `RULES_VERSION = 'v21'` ja `nearWater` palauttamaan oma `obsW` (tai kutsujat antamaan vain oman aseman lukemat: collect.mjs `obsW`, laskenta.html `stationSlipSeries`, Tiesää-arkiston retro.mjs `obsWAt`). Lopuksi `node testit/saannot.test.mjs --paivita`.

## 24.11.2026: Ohut vesikalvo ja Digitrafficin jääennuste kuivalle tielle eivät enää hälytä (vr1 ja dk1, säännöt v21)
Samulin päätökset 24.11. Tiesää-arkiston mukaan (1.10.–21.11., koko maa, liukas = kitka alle 0,6 ja tie enintään +1 °C) ohut vesikalvo ilman sadetta liukastui harvoin: alle 0,1 mm 1–2 %, 0,1–0,2 mm 5–9 % ja 0,2–0,5 mm 10–12 % tapauksista 6 tunnin sisällä. Kun Digitraffic ennusti liukasta kuivalle tielle ilman sadetta, tie liukastui 8 tunnin sisällä 2,5–5 %:ssa tapauksista (sade-ennusteen kanssa 51 %). Yönä 23.–24.11. tiellä oli vettä 0,07–0,12 mm, ei satanut ja kitka pysyi 0,77–0,81:ssä, mutta indeksi oli koko yön 85–93.

- **Märkä tie jäätyy (vr1):** kun asemalla on vesianturi, tien märkyys mittaushetkellä riippuu vesikalvon paksuudesta: alle 0,1 mm 0,2, 0,1–0,2 mm 0,5, vähintään 0,2 mm täysi (ennen täysi aina, kun vettä oli yli 0,03 mm tai keli märkä). Ennustettu sade kastelee tien edelleen kokonaan.
- **Digitraffic kuivalle tielle (dk1):** Digitrafficin syy (jää/kuura, lumi/sohjo, jäätävä sade) on enintään 30 eli seuranta, kun vesianturin mukaan tiellä on vettä alle 0,1 mm, anturilla ei ole lunta eikä jäätä, Ilmatieteen laitos ei ennusta sadetta nykyhetkestä kyseiseen tuntiin asti ja Digitrafficin oma sade-ennuste on poutaa. Jos sadetta ennustetaan, rajaus poistuu siitä tunnista alkaen.
- **Rivi kortissa:** kun rajaus laskee tason, Tilanne-välilehden korttiin (samaan kohtaan kuin "Vain Digitraffic ennustaa jäätä") tulee esim. "Digitraffic ennustaa liukasta teille 3, 4, 7, 45, 50, jotka ovat nyt kuivia (vettä alle 0,1 mm), eikä sadetta ennusteta – tällaisissa tilanteissa tie on liukastunut noin 3–5 %:ssa. Taso rajattu seurantaan; jos sadetta tulee, taso nousee."
- **Ei muuttunut:** asemat ilman vesianturia (esim. Porttipuisto ja Brobölentie), lumi tai jää anturilla, oma kuura-arvio, mitattu liukkaus ja "Asemat hälyttävät nyt", jäätävä sade (js1), lumisade (ls1) ja "Vain Digitraffic ennustaa jäätä" (dt-ero).
- **Vaikutus Vantaalla** (sääntötesti, 6 arkistopäivää, 12 asemaa): 439 hälytystuntia jäi pois (Digitraffic 385, märkä tie jäätyy 54), ei uusia. Yhdelläkään niistä kitka ei näyttänyt liukasta.
- **Vaikutus koko maassa** (12.10.–22.11., kitkatotuus, +6 h): turhat 40 334 → 36 370 (−10 %), osumat 10 911 → 10 854 (−0,5 %). +2 h turhat −20 %.
- **Yöt:** 23.–24.11. vesianturin asemat putoavat seurantaan (indeksi 30), mutta Porttipuisto ja Brobölentie (ei vesianturia) pitävät tason toimenpiteenä. Lumiyönä 22.–23.11. taso pysyy toimenpiteenä kaikilla asemilla, eikä mikään muutu klo 02 jälkeen (liukastui klo 03–05).
- **Perutaan:** saannot.js: `wetObs` palauttamaan 1 (`wGrade` pois), slipSeriesCoresta dk1-ehto pois (`DK_CAP`) ja `RULES_VERSION = 'v20'`; laskenta.html: `dk1Rivi` pois (tunnus dk1). Keruun ja jälkitarkistuksen `obsW`-syöte voi jäädä. Lopuksi `node testit/saannot.test.mjs --paivita`.

## 22.11.2026: Lumisateen vaikutus liukkausindeksiin tienpinnan mukaan (ls1, säännöt v20)
Samulin päätös 22.11. Ennen lumisade antoi täyden indeksin aina, kun tienpinta oli enintään +2 °C. Esimerkiksi 22.11. klo 23 tie oli noin 0 °C, märkä ja suolattu ja kitka 0,7–0,8, mutta indeksi oli 80–100. Tiesää-arkiston mukaan (1.10.–21.11., 14 625 lumi- tai räntätuntia 300 asemalta, ilma 0…+1 °C) tie oli liukas 2 tunnin sisällä tienpinnan yli +0,5 °C ollessa 6–12 %:ssa, 0…+0,5 °C noin 20 %:ssa, −0,5…0 °C noin 50 %:ssa ja alle −1 °C 60–90 %:ssa tunneista.

- **Uusi paino** lumisadeosalle saman tunnin tienpinnan mukaan: enintään −1 °C 1 (ennallaan), −1…0 °C 0,7, 0…+1 °C 0,3, yli +1 °C 0,1. Kaava muuten ennallaan (0,4 + lumisade / 0,6, enintään 1, kerrottuna painolla), syyn nimi ennallaan ("lumi / sohjo" tie yli +0,5 °C, muuten "lumisade").
- **Ei muuttunut:** mitattu liukkaus ja "Asemat hälyttävät nyt", jäätävä sade, märkä tie jäätyy, kuura, Digitrafficin lumi/sohjo, RoadSurfin lumivarasto, suolan käsittely (suola ei rajaa lumisadetta), lumikertymä, Lumityövalmius, 2 cm:n aurausraja ja Auraus-kortti.
- **Vaikutus Vantaalla** (sääntötesti, 6 arkistopäivää, 12 asemaa): 151 lumisadehälytystuntia jäi pois, kaikki 13.11. (eniten Jakomäki 25, Porttipuisto 24, Suutarila 21 + 21). Yhdelläkään niistä kitka ei näyttänyt liukasta. Uusia hälytyksiä ei tullut.
- **Vaikutus koko maassa** (12.10.–20.11., kitkatotuus, +6 h): turhat hälytykset 37 550 → 35 159 (−6 %), osumat 6 909 → 6 782 (−2 %). Lumisade syynä: ennen 1 952 osumaa ja 3 304 turhaa (lisäksi "lumi / sohjo" 106 ja 2 174), nyt 1 249 ja 947. Uusimaa: osumat 19 → 16, turhat 2 940 → 2 873.
- **Yö 22.–23.11. uusilla säännöillä** (jälkikäteen laskettuna, klo 23): lumisadeosa +2 h 24–63 (tie +0,1…−0,5 °C), +6 h 67–98 (tie −0,7…−1,3 °C). Indeksi jää silti monella asemalla 70:een tai yli, koska märkä tie jäätyy, Digitrafficin ennuste tai kuura nostaa sitä.
- **Perutaan:** saannot.js: `snowW = tr => tr <= 2 ? 1 : 0.6` ja `RULES_VERSION = 'v19'`; laskenta.html: indeksin selitysteksti (tunnus v20/ls1). Lopuksi `node testit/saannot.test.mjs --paivita`.

## 22.11.2026: Yön kelaus kattaa koko vuorokauden klo 08–08 (rp6, ei sääntömuutos)
Samulin päätös 22.11. Jälkiselvityksen Yön kelaus näyttää nyt koko vuorokauden klo 08 – seuraava klo 08 (Suomen aikaa, kesäaika huomioiden). Yö klo 18–08 on aikajanan loppuosa kuten ennen.

- **Valinta:** "Vuorokausi", 21 viimeisintä, esim. "pe 20.11. klo 08 – la 21.11. klo 08". Kesken olevan vuorokauden voi valita.
- **Aikajana:** 30 minuutin askelin, 49 kohtaa. Kellonajat näkyvät 2 tunnin välein, puhelimella 3 tunnin välein. Toisto, « » ja avainhetket toimivat kuten ennen.
- **Päivälläkin samat tiedot:** mittaukset, sivun indeksi ja syy, kartta, tehdyt työt, kamerakuvat ja asemakaavio. Tehdyt työt haetaan koko vuorokaudelta ja 6 tuntia sitä ennen.
- **Yöhön sidotut asiat ennallaan:** sivun ehdotukset (klo 18, 22, 00, 02), aikarajat, aamuvertailu ja "Ehdotus ja toteuma tie kerrallaan" koskevat yötä. Päivällä tehdyt suolaukset näkyvät töinä ja tiivistelmässä ilman ehdotusta.
- **Tiivistelmä ja yhteenveto** kattavat koko vuorokauden: suolaukset, auraukset ja hiekoitukset urakan teillä (ajojen määrä ja alku), kylmin tie, liukas keli ja puhelinilmoitukset.
- **Oletuskohta:** ensimmäinen liukas keli, muuten vuorokauden kylmin hetki. Kohta valitaan vasta, kun asemat ovat latautuneet (ennen kelaus saattoi avautua alkuun, jos asemat latautuivat hitaasti).
- **Huom:** Digitraffic säilyttää tehtyjä töitä vain noin kaksi vuorokautta, joten vanhemmille vuorokausille töitä ei näy (kuten ennenkin).
- **Perutaan:** laskenta.html, tunnus rp6: rpNights-funktiossa `from` takaisin klo 18 (`helMs(y, m, d, 18)`), toteumahaku yhdeksi hauksi `fetchRoutes(n.from - 6*36e5, …)`, rpPlanissa `n.yo` takaisin `n.from`, tiivistelmän työrivi pois, liukusäätimen `max` 28 ja otsikkotekstit "Yö".

## 20.11.2026: Sivu kertoo, kun vain Digitraffic ennustaa jäätä (dt-ero, ei sääntömuutos)
Samulin päätös 20.11. Vantaan asemilla 2.–20.11. Digitrafficin tienpintaennuste on öisin noin 0,8 °C muita kylmempi, ja lauhoina öinä se tekee turhia hälytyksiä (esim. 20.11.). Kylminä öinä se on kuitenkin löytänyt jäätymisen muita paremmin (96 % jäätymistunneista, oma tienpintamalli 65–74 %). Siksi hälytystasoa ei muuteta, vaan erimielisyys näytetään.

- **Milloin rivi tulee:** varjokomennon toimenpiteen tai seurannan syy on Digitrafficin ennuste (tiesääennuste tai Digitrafficin liukkausvaroitus), ja tien kaikilla toimenpiteen asemilla oma tienpintamalli ja RoadSurf ennustavat alimmaksi tienpinnaksi yli +1,0 °C samalla aikavälillä (nyt → aamu). Jos asemalta on vain toinen ennuste, käytetään sitä. Jos kumpaakaan ei ole, tie ei tule riville.
- **Missä:** Tilanne-välilehden toimenpidekortissa, jonka syy on Digitraffic (liukkaudentorjunnan kortti, tai "Jäätävä sade", kun se tulee Digitrafficin merkinnästä). Jos sellaista korttia ei ole, rivi näkyy tekstinä korttien alla.
- **Esimerkki 20.11. klo 18.17 (Suomen aikaa) tilanteesta:** "Vain Digitraffic ennustaa jäätä teillä 7, 45: oma tienpintamalli alin +1,5…+2,1 °C, RoadSurf +1,4…+2,4 °C." Tiet 3, 4, 50 ja 148 eivät tulleet riville, koska jollain niiden asemalla toinen ennuste oli enintään +1,0 °C (esim. Vantaankoski RoadSurf +0,9 °C).
- **Ei muuttunut:** toimenpidetaso, liukkausindeksi, varjokomento, puhelinilmoitukset ja jälkitarkistus. Sääntötesti: 0 muutosta (säännöt v19).
- **Perutaan:** laskenta.html: renderActions-rivillä `dtEroKorttiin(computeActions())` takaisin `computeActions()` ja lohko `// ===== dt-ero` … `// ===== /dt-ero` pois (tunnus dt-ero); `src`-merkinnät korteissa voivat jäädä.

## 20.11.2026: Jäätävä sade vasta, kun tienpinta on alle −1,0 °C (js1, säännöt v19)
Samulin päätös 20.11. Jäätävästä sateesta varoitetaan vain, kun tienpinta on alle −1,0 °C. Ennen raja oli liukkausindeksissä +0,5 °C ja toimenpidekortissa 0 °C, ja Digitrafficin jäätävän sateen merkintä teki kortin tienpinnasta riippumatta.

- **Toimenpidekortti "Jäätävä sade"** tulee vain, kun samalla ennustetunnilla on vesisade ja sivun tienpintaennuste on alle −1,0 °C.
- **Digitrafficin jäätävän sateen merkintä** tekee kortin vain, jos sivun korjattu tienpintaennuste on samalla tunnilla alle −1,0 °C. Muuten merkintä näkyy toimenpidekorttien alla tekstirivinä ilman korttia ja ilman toimenpidettä.
- **Liukkausindeksi** (säännöt v19): sama raja sekä Ilmatieteen laitoksen ennusteen jäätävälle sateelle että Digitrafficin merkinnälle. Indeksi, kortti, puhelinilmoitukset, varjokomento ja koko Suomen jälkitarkistus käyttävät samaa rajaa.
- **Tutkan kortti "Jäätävän sateen riski"** (tutkassa vesisadetta, asemat eivät vielä mittaa sadetta) tulee samoin vain, kun aseman tienpinta on alle −1,0 °C (lisätty samana päivänä, js1b). Ennen raja oli 0 °C.
- **Ei muuttunut:** asemien mittaama liukkaus (jää, kuura, lumi, kitka), "Asemat hälyttävät nyt" -kortti, "Vesisadetta jäiselle tielle" -kortti (asema mittaa vesisadetta, tienpinta enintään 0 °C), märkä tie jäätyy, kuura ja lumi.
- **Vaikutus Vantaalla** (sääntötesti, 6 arkistoitua päivää): 44 hälytystuntia jäi pois, kaikki yöltä 13.–14.11. (eniten Kerava 1005, 10 h). Sinä yönä tienpinta oli alimmillaan −0,2 °C, kitka ei näyttänyt liukasta ja kuittaus oli "kostea". Hälytyksiä ei tullut lisää.
- **Vaikutus koko maassa** (12.10.–18.11., +6 h, kitkatotuus): turhat hälytykset 33 835 → 33 477, osumat 6 095 → 6 069. Jäätävä sade hälytyksen syynä: ennen 145 osumaa ja 1 299 turhaa, nyt 51 ja 107.
- **Perutaan:** saannot.js: FRZ_TR = 0.5, vertailu `x.tr <= FRZ_TR` ja dtValue ilman FRZ-ehtoa (kolmas arvo p[2]), RULES_VERSION = 'v18'. laskenta.html: kortin C ehto takaisin `(r.road ?? r.Temperature) <= 0` ja Digitrafficin merkintä korttiin ilman tienpintaehtoa (tunnus js1); tutkakortissa `riskSt` pois ja `frzSt` takaisin korttiin (tunnus js1b). Lopuksi `node testit/saannot.test.mjs --paivita`.

## 20.11.2026: Tie alin 12 h ja meteogrammi korjatusta ennusteesta, pois käytöstä -asemat ja pienet korjaukset (rt1, rt2, po1, db1, ei sääntömuutos)
Samulin päätökset 20.11. sivun debuggauksen jälkeen. Säännöt (v18), ehdotukset ja puhelinilmoitukset eivät muuttuneet: sääntötestin kaikki 1 512 laskentaa ennallaan.

- **Tie alin 12 h (rt1):** Tilanteen ruutu ja kelikatsauksen "TIE 12 h" näyttävät nyt saman tienpinnan kuin liukkausindeksi ja asemien ennustetaulukko, eli asemiin kiinnitetyn ennusteen opitulla korjauksella. Ennen ruutu näytti korjaamattoman luvun, joten sama tunti saattoi olla ruudussa 0,4 °C ja taulukossa 0,8 °C. Toimenpidekorttien säännöt käyttävät edelleen korjaamatonta ennustetta.
- **Meteogrammi (rt2):** Tiesääasemat-välilehden meteogrammin "Tienpinnan ennuste 12 h" -viiva kulkee nyt samoja lukuja pitkin kuin liukkausindeksi ja ennustetaulukko. Ennen viiva kulki mittauksesta suoraan Digitrafficin raakoihin ennustepisteisiin. Raa'at pisteet näkyvät edelleen onttoina pisteinä, ja 12–48 h arvio malleista jatkuu korjatun viivan lopusta.
- **Pois käytöstä -asemat (po1):** asema, jolta ei ole tullut dataa yli 7 vuorokauteen, näkyy harmaana "pois käytöstä" eikä sitä lasketa viaksi lähdepalkissa, Tiesääasemat-osiossa eikä kelikatsauksessa. Nyt tämä koskee Vuosaaren asemia (tie 103, pohjoinen ja eteläinen): niiltä ei ole tullut yhtään mittausta keruun alun (1.9.) jälkeen, ja Vuosaaren maantietunneli on suljettu. Lähdepalkissa lukee nyt "Asemat 12/12 kunnossa · 2 pois käytöstä", kun ennen se oli aina oranssi "12/14", jolloin uusi vika ei näkynyt. Keruu kirjaa jokaisen aseman viimeisimmän mittauksen (data/index.json, seen). Asema palaa käyttöön heti, kun siltä tulee taas dataa.
- **Pienet korjaukset (db1):** Salon sivu ei enää hae tiedostoja, joita Salolle ei tehdä (RoadSurf ja sivun päätös, turhat 404-virheet). Toimenpidekortin kamerakuvarivin luettelomerkki poistettiin kuvatekstin vierestä. Liukkausennusteen selite kertoo, että raidoitus koskee myös asemia ilman tieennustetta. Ennustetaulukon sade alle 0,05 mm/h näkyy aina "0".
- Perutaan: palautetaan laskentasäilön `laskenta.html` ja `collector/collect.mjs` tätä merkintää edeltävään tilaan (tunnukset rt1, rt2, po1, db1). Kenttä `seen` voi jäädä data/index.json-tiedostoon.

## 17.11.2026: Keli- ja varoitustieto palasi Digitrafficiin (kl2, ei sääntömuutos)
Digitraffic alkoi 16.11. noin klo 11.30–12 lähettää taas vanhaa keli- ja varoitustietoa (KELI_1, KELI_2, VAROITUS_1, VAROITUS_2), joka oli poissa 6.11. alkaen. Kelikeskus käyttää vanhaa tietoa aina, kun sitä tulee, joten vaihto tapahtui itsestään: keli erottelee taas kuuran, lumen ja jään, ja kostea tie tunnistetaan.

- **Asemat-taulukon selitys** varatiedosta (tienpinnan tila, optinen varoitus) näkyy vain, kun jokin asema käyttää varatietoa, ja kertoo monellako.
- **Varatieto ja Ydintiedot-vahti jäävät käyttöön**, jos tieto katkeaa uudelleen. Keimolan ja Pirkkolan rajaus (v18) ja märän tien hälytys toisesta pakkaslukemasta ovat ennallaan.
- **Huom. vertailuihin:** kelitieto ei ole yhtenäinen. 6.–13.11. keruussa ei ollut keliä ja 13.–16.11. keli tuli tienpinnan tilasta (kuura, lumi ja jää yhtenä luokkana), joten näiden päivien mitattu liukkaus ei vertaudu muihin.

## 16.11.2026: Sivu yhdestä lähteestä ja sääntötesti (sj1, ei sääntömuutos)
Kelisivusta oli kaksi käsin ylläpidettyä kopiota: laskentasivu (yksityinen) ja tämä julkinen sivu. Ne olivat ajautuneet erilleen. Säännöt (v18), ehdotukset ja puhelinilmoitukset eivät muuttuneet: sama laskenta antoi vanhalla ja uudella rakenteella saman tuloksen.

- **Julkinen sivu tehdään laskentasivusta.** Keruu kokoaa `index.html`:n joka ajolla (30 min välein): laskenta ja kommentit jäävät pois, ja koonti pysähtyy, jos tulokseen jäisi sääntöjä. Tiedostoa `index.html` ei enää muokata käsin. Jos koonti epäonnistuu, edellinen sivu jää voimaan.
- **Julkiselle sivulle tuli samalla kolme asiaa, jotka olivat vain laskentasivulla:** kelin varatieto tienpinnan tilasta ja varoitus optisesta anturista (12.11. kelikorjaus; julkisella sivulla keli näkyi vain, kun Digitraffic lähetti vanhan kelitiedon), Asemat-taulukon merkintöjen selitys ja lähdepalkin Ydintiedot-rivi.
- **Säännöt omassa tiedostossaan** (yksityinen säilö, `saannot.js`). Sivu, keruu ja koko Suomen jälkitarkistus lukevat saman tiedoston.
- **Sääntötesti:** kuuden arkistoidun päivän (17.10., 3.11., 6.11., 8.11., 13.11., 15.11.) laskennat Vantaan asemille ajetaan uudelleen aina, kun yksityisen säilön koodia muutetaan. Testi kertoo, montako hälytystä tuli lisää tai jäi pois ja millä asemilla.
- Perutaan: palautetaan `index.html` ja työnkulun `keli-data.yml` vaihe "Julkinen sivu laskentasivusta" tätä merkintää edeltävään tilaan.

## 16.11.2026: Säätökierros 2 – säännöt v18 ja varjokomennon kokeilut (k2)
Samulin päätökset 16.11. ("Tehdään ehdottamasi mukaan", Liukkaussäännöt, kierros 2). Puhelinilmoitukset, sivun päätöslaatikko ja varjokomennon oma ehdotus toimivat kuten ennen; vain kohta 3 muuttaa liukkaussääntöjä.

- **Säännöt v18 (kohta 3):** Keimolan (1041) ja Pirkkolan (1034) tienpinnan tila (keli tilasta) ei enää hälytä liukasta eikä tee tiestä märkää. Keimolan mitattu tienpinta ei ankkuroi liukkausindeksiä eikä kerrytä kuuraa (indeksi lasketaan tiekohdan Digitraffic-havainnosta). Mittaukset näkyvät sivulla edelleen. Koko Suomen jälkitarkistus laskee 60 päivää uudelleen v18:lla.
- **Aamuvertailun totuus (kohta 2):** liukas yö = optinen kitka alle 0,6 kylmällä tiellä vähintään tunnin jollain urakan asemalla (sama kuin koko Suomen vertailussa). Kun Päivystyskirjan kuittaus on viety (viikoittain maanantaisin), kuittaus ratkaisee, myös jälkikäteen. Vanha "olosuhde toteutui" jää rinnalle. Päivystyskirjan "Järjestelmän arvio" käyttää samaa totuutta.
- **Varjot varjokomennossa (kohdat 1, 3c ja 3d):** näkyvät Varjokomento-osion avattavassa osassa, eivät muuta ehdotusta:
  - *Klo 22 rajaus:* toimenpide muuttuu seurannaksi, jos riskin alku on yli 5 h päässä tai alin ennustettu tienpinta yli +2 °C. Uusi tarkistus tallennetaan klo 00 ja 02; jos niissä on toimenpide, varjon lopullinen taso on toimenpide.
  - *Oma tienpintamalli:* sama indeksi Tiesää-arkiston oman tienpintamallin ennusteella (tm/latest.json) Digitraffic + v17 -ennusteen sijaan. v17-korjaus pysyy kelikeskuksessa toistaiseksi.
  - *Kuura opitusta erotuksesta:* kuurasta johtuva toimenpide jää voimaan vain, jos kuurapistemalli (km1, km/latest.json) näkee kuuraavan tilan (erotus tie − kastepiste ≤ +0,3 °C ja tie ≤ +0,5 °C) tarkastelujaksolla.
- **Tulokset:** data/komento.json (history[].tosi, history[].k2, nyt k2) ja data/komennot/YYYY-MM-DD.json (slots 18, 22, 00, 02 ja eval.tosi, eval.k2). Varjokomento-osiossa on taulukko "Totuus: kitka ja kuittaus (v18)" kaikista öistä.
- Ei toteutettu (päätös): tuki20, v16c, kuura ≥ 0,5 ja RoadSurfin kuuramäärä kuuran syyksi.
- Perutaan: säännöt palauttamalla SLIP_EXCL = {} ja RULES_VERSION = 'v17' (laskenta.html, lohko LIUKKAUSSÄÄNNÖT); varjot ja totuus poistamalla tunnuksen k2 muutokset (collect.mjs, index.html, kirja).

## 13.11.2026: Märkä tie hälyttää vasta toisesta pakkaslukemasta, räntä tutkakortissa (mr1, ei sääntömuutos)
Salossa sivu näytti iltapäivällä räntäsateessa "Asemat hälyttävät nyt" -kortin, koska Haukkalan tienpinta kävi yhden mittauksen ajan −0,1 °C:ssa. Seuraavassa mittauksessa tie oli taas +0,2 °C ja kitka hyvä (0,7). Kortti alkoi laueta herkemmin 12.11. kelikorjauksen jälkeen, kun märkä keli saadaan taas tienpinnan tilasta. Liukkausindeksin säännöt (v17) ennallaan.

- **Märkä tie pakkasella** hälyttää nyt, kun tienpinta on alle −0,3 °C tai enintään 0 °C kahdessa peräkkäisessä mittauksessa. Sama ehto on jo aamuvertailun "olosuhde toteutui" -säännössä, ja anturin tarkkuus on noin ±0,2 °C. Kuura-, lumi-, jää- ja varoitushälytykset eivät muuttuneet.
- **Keruu** muistaa jokaisen aseman 4 viimeistä tienpinnan lukemaa (data/index.json), jotta edellinen mittaus on käytettävissä.
- **Tutkan lumikortti:** jos useampi asema mittaa vesisadetta kuin lunta ja ilma on plussalla, kortti on "Räntäsadetta nyt (tutka ja asemat)" (SEURAA). Muuten kortti on ennallaan, mutta siinä näkyy nyt myös, mitä asemat mittaavat maassa. Tutka näki Salossa "kuivaa lunta 100 %", vaikka asemat mittasivat vesisadetta ja räntää.
- Ei muutettu: "Jäätävä sade" ja "Liukkaudentorjunta" tulevat edelleen Digitrafficin tiesääennusteesta sellaisenaan. Salossa ennuste oli 13.11. noin 0,5 °C mittausta kylmempi. Ennusteen korjaus mittauksen mukaan on kierroksen 2 ja tienpintamallin asia.

## 13.11.2026: Tilanne-välilehti tiiviimmäksi (tl1, ei sääntömuutos)
Ensimmäinen ruutu riittää päätökseen, kaikki muu avautuu napista. Mitään ei poistettu, laskentaan ja sääntöihin (v17) ei koskettu. Välilehden korkeus 800 px leveällä näytöllä: noin 2 800 px → 1 400 px (puhelimessa noin 2 000 → 1 600 px).

- **Kelikatsaus** on oletuksena kiinni. "Kopioi teksti" toimii myös kiinni olevasta.
- **Toimenpidekortissa kolme riviä:** merkki ja otsikko, missä · milloin · tarkista klo. Perusteet (ensimmäisenä pakkaselle, peruste, suolaukset, kuuran selitys, asemat ja kamerat) ovat "Miksi?"-napin takana. KIIREELLINEN ja asemien mittaama liukkaus näyttävät perusteet suoraan auki.
- **Ylin ehdotus** näkyy vain päätöslaatikossa, ja sen perusteet ovat siellä "Miksi?"-napin takana. Erillinen "Perustelut ylimpään ehdotukseen" -kortti poistui toistona.
- **Päätöslaatikon varjokomentorivi** lyhyemmäksi, esim. "Varjokomento ehdottaa: ennakkosuolaus ennen klo 15.00", ja Näytä-linkki Varjokomento-osioon. Tiet ja sivun oma taso näkyvät rivin vihjeessä.
- **Viime yö yhtenä yhteenvetona:** alin tienpinta, liukkaus, työt ja naapurit yhdellä rivillä. Liukkaiden asemien ja naapuriurakoiden taulukot (Samuli 9.11.: naapuriurakat pysyvät kelisivulla) ovat avattavina osioina.
- **Varjokomento yhdellä rivillä:** näkyvissä vain ehdotus. Muut urakat vastaavissa oloissa ja aamuvertailu ovat "Näytä ehdotus asemittain…" -osiossa.
- "Ei suolausta 4 h aikana" -listassa sama tie enää kerran, ja kelikatsauksesta jäi pois tyhjä "Keli: ." -osa.
- Avatut osiot pysyvät auki 5 minuutin päivityksissä. Seinänäytöllä kaikkien korttien perusteet ovat auki.
- Perutaan palauttamalla tämän merkinnän muutos (laskenta.html ja index.html, tunnus tl1).

## 12.11.2026: Keli ja varoitus korvaavista antureista (lähdetiedon korjaus, ei sääntömuutos)
Digitraffic lopetti 6.11. klo 12.47 UTC koko maassa anturit KELI_1, KELI_2, VAROITUS_1 ja VAROITUS_2. Sen jälkeen kelikeskuksen keli ja varoitus olivat tyhjiä kaikilla asemilla: liukas tunnistettiin vain kitkasta (Pirkkola, Porttipuisto ja Brobölentie jäivät ilman), märän tien tunnistus puuttui ja kelikatsauksessa luki "Keli: .". Sääntöihin (v17) ei tehty muutoksia.

- **Keli tienpinnan tilasta** (`TIENPINNAN_TILA`, kaikilla Vantaan asemilla): 1 → kuiva, 2/3/10 → märkä, 11 → "Liukas (kuura, lumi tai jää)" (vanha keli 7; kuuraa, lunta ja jäätä ei voi erottaa), 0 → ei tietoa. Kosteaa ei enää tunnisteta erikseen, vaan se näkyy märkänä. Vanha keli-anturi menee edelle, jos se palaa.
- **Varoitus optisesta anturista** (`OPTISEN_ANTURIN_VAROITUS1`: OK, Varo, Häly; noin 250 asemalla). Optisen anturin keliä ei käytetä, koska se poikkeaa usein tienpinnan anturista.
- **Keruu** tallentaa kelin lähteen uuteen sarakkeeseen `ksrc` (`keli` = vanha anturi, `tila` = tienpinnan tila).
- **Kelisivu:** sama muunnos Keli-sarakkeessa, asemakortissa, meteogrammin keliraidassa, kelikatsauksessa ja yön kelauksessa. Asemataulukon alla on selitys merkinnöille a3 ja a4: tienpinta mitataan kaista-anturilla 3 tai 4.
- **Kenttävahti:** puhelinilmoitus, jos tienpinta, kastepiste, keli tai kitka puuttuu kaikilta asemilta yli 2 h, ja toinen ilmoitus, kun tieto palaa. Kelisivun lähteissä on uusi rivi "Ydintiedot", ja se näyttää punaista, jos jokin näistä puuttuu kaikilta asemilta.
- **Koko Suomen jälkitarkistus:** Tiesää-arkisto täydentää kelin ja varoituksen 12.11. klo 14.41 UTC alkaen. Yöt 6.–10.11. lasketaan kerran uudelleen niin, että keli tulee tienpinnan tilasta (varoitusta ei tältä väliltä ole). Koska tila 11 lasketaan liukkaaksi kuten vanha "jää", mitattuja liukkaita tunteja on näinä öinä aiempaa enemmän (esim. 8.11. +6 h osumat 70 → 334). Seurataan, liioitteleeko tila 11 liukkautta kitkaan ja kuittauksiin verrattuna.

## 9.11.2026: Seuranta siirtyi Päivystyskirjaan
Samulin päätös: kelikeskukseen jäävät vain yön työkalut. Jälkiselvitys (yön kelaus) ja naapuriurakat samana yönä pysyvät kelikeskuksessa.

- **Kelikeskus:** Seuranta-välilehti poistettiin. Vanhat osoitteet `#seuranta` ja `#kokeilut` avaavat nyt Tilanteen. Laskenta ja ehdotukset eivät muuttuneet.
- **Päivystyskirja, uusi Seuranta-välilehti**, jossa samat tiedot:
  - *Osuiko tienpintaennuste?* Uusi tapa laskea:
    - mukana vain riskitunnit (mitattu tai ennustettu tienpinta enintään +2 °C)
    - uutena "jäätyminen ennustamatta" (tie mitattiin pakkaselle, ennuste oli plussalla) ja "turha jäätymisennuste"
    - kattavuus (kuinka suurelta osalta yötä on sekä ennuste että mittaus)
    - selkeämmät termit ("1,7 °C liian kylmä" eikä "harha −1,7")
    - asemakortit puhelimelle
  - Rinnalla kelikeskuksen aiempi yöarvio, oman tienpintamallin varjo (tv1), mallivertailu ja säämallien osuvuus.
  - *Osuiko liukkausennuste?* Viikoittainen tuloskortti, keruun koko aineisto ja koko Suomen jälkitarkistus.
  - *Mitä malli on oppinut:* asemakohtaiset tienpintakorjaukset, kylmien öiden korjauksen (v17) kuvaus ja suolauksen suojavaikutus.
- Tiedot tulevat aamun yöpaketin mukana (klo 8.27). Ensimmäinen paketti, jossa ne ovat, on yö 9.–10.11.2026.
