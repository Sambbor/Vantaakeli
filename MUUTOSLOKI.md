# Muutosloki

Kelikeskuksen (tämä sivu) ja Päivystyskirjan muutokset selkokielellä, uusin ensin.

## 20.11.2026: Jäätävä sade vasta, kun tienpinta on alle −1,0 °C (js1, säännöt v19)
Samulin päätös 20.11. Jäätävästä sateesta varoitetaan vain, kun tienpinta on alle −1,0 °C. Ennen raja oli liukkausindeksissä +0,5 °C ja toimenpidekortissa 0 °C, ja Digitrafficin jäätävän sateen merkintä teki kortin tienpinnasta riippumatta.

- **Toimenpidekortti "Jäätävä sade"** tulee vain, kun samalla ennustetunnilla on vesisade ja sivun tienpintaennuste on alle −1,0 °C.
- **Digitrafficin jäätävän sateen merkintä** tekee kortin vain, jos sivun korjattu tienpintaennuste on samalla tunnilla alle −1,0 °C. Muuten merkintä näkyy toimenpidekorttien alla tekstirivinä ilman korttia ja ilman toimenpidettä.
- **Liukkausindeksi** (säännöt v19): sama raja sekä Ilmatieteen laitoksen ennusteen jäätävälle sateelle että Digitrafficin merkinnälle. Indeksi, kortti, puhelinilmoitukset, varjokomento ja koko Suomen jälkitarkistus käyttävät samaa rajaa.
- **Ei muuttunut:** asemien mittaama liukkaus (jää, kuura, lumi, kitka), "Asemat hälyttävät nyt" -kortti, tutkan "Vesisadetta jäiselle tielle" -kortti, märkä tie jäätyy, kuura ja lumi.
- **Vaikutus Vantaalla** (sääntötesti, 6 arkistoitua päivää): 44 hälytystuntia jäi pois, kaikki yöltä 13.–14.11. (eniten Kerava 1005, 10 h). Sinä yönä tienpinta oli alimmillaan −0,2 °C, kitka ei näyttänyt liukasta ja kuittaus oli "kostea". Hälytyksiä ei tullut lisää.
- **Vaikutus koko maassa** (12.10.–18.11., +6 h, kitkatotuus): turhat hälytykset 33 835 → 33 477, osumat 6 095 → 6 069. Jäätävä sade hälytyksen syynä: ennen 145 osumaa ja 1 299 turhaa, nyt 51 ja 107.
- **Perutaan:** saannot.js: FRZ_TR = 0.5, vertailu `x.tr <= FRZ_TR` ja dtValue ilman FRZ-ehtoa (kolmas arvo p[2]), RULES_VERSION = 'v18'. laskenta.html: kortin C ehto takaisin `(r.road ?? r.Temperature) <= 0` ja Digitrafficin merkintä korttiin ilman tienpintaehtoa (tunnus js1). Lopuksi `node testit/saannot.test.mjs --paivita`.

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
