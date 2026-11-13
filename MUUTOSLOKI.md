# Muutosloki

Kelikeskuksen (tämä sivu) ja Päivystyskirjan muutokset selkokielellä, uusin ensin.

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
