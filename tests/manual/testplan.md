# Trello Klooni API Testplaan

**Versioon:** 1.0  
**Autorid:** [Teie Nimi]  
**Kuupäev:** 2024-03-19

---

## 1. Pealkiri, versioon, autorid

**Projekt:** Trello Klooni API  
**Versioon:** 1.0  
**Autorid:** [Teie Nimi]  
**Kuupäev:** 2024-03-19

---

## 2. Dokumendi ajalugu ja heakskiidud

| Versioon | Kuupäev     | Muudatused         | Autor        | Allkiri         |
|----------|-------------|--------------------|--------------|-----------------|
| 1.0      | 2024-03-19  | Esialgne versioon  | [Teie Nimi]  | [Allkiri]       |

---

## 3. Eesmärk ja ulatus

Testplaani eesmärk on tagada Trello Klooni API arenduse käigus loodud tarkvara kvaliteet, töökindlus ja vastavus nõuetele. Testimine hõlmab API otspunktide funktsionaalsuse, autentimise, autoriseerimise, andmete valideerimise, veatöötluse ning jõudluse kontrollimist. Testimise ulatus katab kõik peamised moodulid ja funktsionaalsused, mis on vajalikud API korrektseks toimimiseks.

---

## 4. Viited ja alusdokumendid

- OpenAPI spetsifikatsioonid: `docs/en/openapi.yaml`, `docs/et/openapi.yaml`
- Express.js dokumentatsioon
- JWT autentimise standard
- REST API parimad tavad ja standardid
- Projekti lähtekood ja arhitektuuridokumendid

---

## 5. Testitavad üksused

Testimisele kuuluvad järgmised moodulid ja build’id:
- Kasutajate haldus (registreerimine, sisselogimine, profiili muutmine)
- Tahvlite haldus (loomine, muutmine, kustutamine)
- Nimekirjade haldus (loomine, muutmine, kustutamine)
- Kaartide haldus (loomine, muutmine, kustutamine)
- Kommentaaride haldus
- Autentimise ja autoriseerimise süsteem
- API üldine veatöötlus ja valideerimine

---

## 6. Testitavad ja mittetestitavad omadused

### Testitavad omadused:
- Kõik API otspunktid (funktsionaalsus)
- Autentimise ja autoriseerimise loogika
- Andmete valideerimine (sisendite kontroll)
- Veatöötlus (veateadete ja -koodide korrektsus)
- Jõudlus (põhilised mõõdikud, nt vastuseaeg, koormustaluvus)

### Mittetestitavad omadused:
- Andmebaasi sisemine loogika (kasutatakse mälupõhist lahendust)
- Kolmandate osapoolte süsteemide integratsioonid (puuduvad)
- Klientrakenduse kasutajaliides (UI testimine ei kuulu selle plaani alla)

---

## 7. Testimise lähenemine

Testimisel kasutatakse nii manuaalseid kui automaatseid meetodeid:

- **Manuaalne testimine:** API otspunktide funktsionaalsuse kontroll käsitsi Postmani või sarnase tööriistaga.
- **Automaattestimine:**  
  - Ühiktestid (Jest)
  - Lõpust-lõpuni (E2E) testid (Postman/Newman)
  - Jõudlustestid (k6)

Testide disain põhineb OpenAPI spetsifikatsioonil ja ärinõuetel.

---

## 8. Sisenemis-, väljumis- ja peatamiskriteeriumid

**Sisenemiskriteeriumid:**
- Testkeskkond on üles seatud ja ligipääsetav
- Testandmed on ette valmistatud
- Testimise tööriistad (Jest, Postman, k6) on paigaldatud ja seadistatud

**Väljumiskriteeriumid:**
- Kõik kriitilised ja kõrge prioriteediga testid on edukalt läbitud
- Avatud defektid on dokumenteeritud ja prioriteeritud
- Testraportid on koostatud ja üle vaadatud

**Peatamiskriteeriumid:**
- Kriitiliste defektide avastamine, mis takistavad testimise jätkamist
- Testkeskkonna või testandmete olulised probleemid
- Ressursside (aeg, inimesed) puudus

---

## 9. Ressursid ja rollid

**Inimesed:**
- Testijuht: [Nimi]
- Testija: [Nimi]
- Arendaja: [Nimi]

**Tarkvara ja riistvara:**
- Node.js (arendus- ja testkeskkond)
- Jest (ühiktestid)
- Postman/Newman (E2E testid)
- k6 (jõudlustestid)
- Docker (testkeskkonna konteinerid)
- Arvutid/virtuaalmasinad testimiseks

---

## 10. Ajakava ja verstapostid

- **Sprint 1:** Põhiliste API otspunktide testimine (2024-03-20 – 2024-03-27)
- **Sprint 2:** Autentimise ja autoriseerimise testimine (2024-03-28 – 2024-04-03)
- **Sprint 3:** Jõudluse testimine (2024-04-04 – 2024-04-10)
- **Sprint 4:** Regressioonitestimine ja lõppülevaatus (2024-04-11 – 2024-04-17)
- **Release:** 2024-04-18

---

## 11. Keskkond ja infrastruktuur

- **Arenduskeskkond:** Localhost (arendajate masinad)
- **Testkeskkond:** Docker konteinerid (isoleeritud testkeskkond)
- **Staging:** Virtuaalmasin või pilvekeskkond (TBD)
- **Andmebaas:** Mälupõhine (in-memory) lahendus

---

## 12. Testide disaini viited

- Manuaalsed testid: [`tests/manual/testcases/`](../manual/testcases/)
- Automaattestid: [`tests/automation/`](../automation/)

---

## 13. Riskid ja leevendused

| Risk                | Tõenäosus | Mõju   | Leevendus                    |
|---------------------|-----------|--------|------------------------------|
| Andmete kaotus      | Madal     | Kõrge  | Regulaarsed varukoopiad      |
| Jõudlusprobleemid   | Keskmine  | Keskmine| Jõudluse pidev jälgimine     |
| Turvariskid         | Madal     | Kõrge  | Turvaauditid, logimine       |
| Testkeskkonna tõrked| Madal     | Kõrge  | Keskkonna automaatne taastamine |
| Ressursside puudus  | Madal     | Keskmine| Varuplaanid, prioriseerimine |

---

## 14. Luba- ja auditeerimisnõuded

- GDPR nõuetele vastavus (isikuandmete kaitse)
- Andmete krüpteerimine (vajadusel)
- Juurdepääsu logimine ja jälgitavus
- ISO 27001 standardi põhimõtted (vajadusel)
- N/A: Spetsiifilisi tööstusstandardeid peale GDPR ja üldiste turvanõuete ei rakendata

---

## 15. Testi töövoo protseduurid

1. Defekti avastamine (testija või automaatne test)
2. Defekti dokumenteerimine (defektiregistrisse, nt GitHub Issues)
3. Defekti prioriteerimine (testijuht ja arendaja koostöös)
4. Defekti parandamine (arendaja)
5. Paranduse valideerimine (testija)
6. Regressioonitestimine (kõik seotud testid uuesti)
7. Defekti sulgemine (testijuht kinnitab)

---

## 16. Mõõdikud ja raportid

- Testide katvus (protsentuaalne, Jest coverage report)
- Defektide statistika (avastatud, parandatud, avatud defektid)
- Jõudlusmõõdikud (vastuseaeg, läbilaskevõime, k6 raportid)
- Testide läbimise aeg (keskmine, maksimaalne)
- Raportite koostamise sagedus: pärast iga sprinti ja lõpp-release

---

## 17. Lõpuleviimise kriteerium ja hooldus

**Lõpuleviimise kriteeriumid:**
- Kõik kriitilised ja kõrge prioriteediga testid on edukalt läbitud
- Avatud defektid on prioriteeritud ja dokumenteeritud
- Testraportid on koostatud ja üle vaadatud

**Hooldus:**
- Testide regulaarne uuendamine vastavalt muudatustele lähtekoodis ja nõuetes
- Testandmete haldus (andmete värskendamine, puhastamine)
- Testkeskkonna hooldus ja uuendamine

---

## 18. Testjuhtumite loetelu

Testjuhtumid asuvad kaustas [`tests/manual/testcases/`](../manual/testcases/):

| Kood    | Kirjeldus                |
|---------|--------------------------|
| TC-001  | Kasutaja registreerimine |
| TC-002  | Kasutaja sisselogimine   |
| TC-003  | Tahvli loomine           |
| ...     | [Järgmised testjuhtumid] |

Täielik loetelu: vt kausta [`tests/manual/testcases/`](../manual/testcases/)

---

## 19. Test-run’i raportid

Test-run’i raportid asuvad kaustas [`reports/`](../reports/):

- `testrun_2024-03-19.md`
- [Järgmised raportid...]

Täielik raportite loetelu: vt kausta [`reports/`](../reports/)

---