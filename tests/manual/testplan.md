# Trello Klooni API Testplaan
**Versioon:** 1.0  
**Autorid:** [Teie Nimi]  
**Kuupäev:** 2024-03-19

## 1. Pealkiri, versioon, autorid
- **Projekt:** Trello Klooni API
- **Versioon:** 1.0
- **Autorid:** [Teie Nimi]
- **Kuupäev:** 2024-03-19

## 2. Dokumendi ajalugu ja heakskiidud
| Versioon | Kuupäev | Muudatused | Autor |
|----------|---------|------------|-------|
| 1.0 | 2024-03-19 | Esialgne versioon | [Teie Nimi] |

## 3. Eesmärk ja ulatus
Testplaani eesmärk on tagada Trello Klooni API kvaliteet ja funktsionaalsus. Testimine hõlmab:
- API otspunktide funktsionaalsuse kontrollimist
- Autentimise ja autoriseerimise testimist
- Andmete valideerimise kontrollimist
- Veatöötluse testimist
- Jõudluse testimist

## 4. Viited ja alusdokumendid
- OpenAPI spetsifikatsioon (`docs/en/openapi.yaml`, `docs/et/openapi.yaml`)
- Express.js dokumentatsioon
- JWT autentimise standard
- REST API parimad tavad

## 5. Testitavad üksused
- Kasutajate haldus (registreerimine, sisselogimine, profiili muutmine)
- Tahvlite haldus (loomine, muutmine, kustutamine)
- Nimekirjade haldus
- Kaartide haldus
- Kommentaaride haldus
- Autentimise ja autoriseerimise süsteem

## 6. Testitavad ja mittetestitavad omadused
### Testitavad omadused:
- Kõik API otspunktid
- Autentimise ja autoriseerimise loogika
- Andmete valideerimine
- Veatöötlus
- Jõudlus (põhilised mõõdikud)

### Mittetestitavad omadused:
- Andmebaasi sisemine loogika (kuna kasutame mälupõhist lahendust)
- Kolmandate osapoolte süsteemide integratsioonid
- Klientrakenduse kasutajaliides

## 7. Testimise lähenemine
- **Manuaalne testimine:** API otspunktide funktsionaalsuse kontrollimine
- **Automaattestimine:** 
  - Ühiktestid (Jest)
  - E2E testid (Postman/Newman)
  - Jõudlustestid (k6)

## 8. Sisenemis-, väljumis- ja peatamiskriteeriumid
### Sisenemiskriteeriumid:
- Testkeskkond on valmis
- Testandmed on ette valmistatud
- Testimise tööriistad on paigaldatud

### Väljumiskriteeriumid:
- Kõik kriitilised testid on läbitud
- Avatud defektid on dokumenteeritud
- Testraportid on koostatud

### Peatamiskriteeriumid:
- Kriitiliste defektide avastamine
- Testkeskkonna probleemid
- Testandmete probleemid

## 9. Ressursid ja rollid
### Inimesed:
- Testijuht: [Nimi]
- Testija: [Nimi]
- Arendaja: [Nimi]

### Tarkvara:
- Node.js
- Jest
- Postman/Newman
- k6

## 10. Ajakava ja verstapostid
- **Sprint 1:** Põhiliste API otspunktide testimine
- **Sprint 2:** Autentimise ja autoriseerimise testimine
- **Sprint 3:** Jõudluse testimine
- **Sprint 4:** Regressioonitestimine

## 11. Keskkond ja infrastruktuur
- **Arenduskeskkond:** Localhost
- **Testkeskkond:** Docker konteiner
- **Staging:** TBD

## 12. Testide disaini viited
- Manuaalsed testid: `tests/manual/testcases/`
- Automaattestid: `tests/automation/`

## 13. Riskid ja leevendused
| Risk | Tõenäosus | Mõju | Leevendus |
|------|-----------|------|-----------|
| Andmete kaotus | Madal | Kõrge | Regulaarsed varukoopiad |
| Jõudlusprobleemid | Keskmine | Keskmine | Jõudluse pidev jälgimine |
| Turvariskid | Madal | Kõrge | Turvaauditid |

## 14. Luba- ja auditeerimisnõuded
- GDPR nõuetele vastavus
- Andmete krüpteerimine
- Juurdepääsu logimine

## 15. Testi töövoo protseduurid
1. Defekti avastamine
2. Defekti dokumenteerimine
3. Defekti prioriteerimine
4. Defekti parandamine
5. Regressioonitestimine

## 16. Mõõdikud ja raportid
- Testide katvus
- Defektide statistika
- Jõudlusmõõdikud
- Testide läbimise aeg

## 17. Lõpuleviimise kriteerium ja hooldus
### Lõpuleviimise kriteeriumid:
- Kõik kriitilised testid on läbitud
- Avatud defektid on prioriteeritud
- Testraportid on koostatud

### Hooldus:
- Testide regulaarne uuendamine
- Testandmete haldus
- Testkeskkonna hooldus

## 18. Testjuhtumite loetelu
Testjuhtumid asuvad kaustas `tests/manual/testcases/`:
- TC-001: Kasutaja registreerimine
- TC-002: Kasutaja sisselogimine
- TC-003: Tahvli loomine
- [Järgmised testjuhtumid...]

## 19. Test-run'i raportid
Test-run'i raportid asuvad kaustas `reports/`:
- `testrun_2024-03-19.md`
- [Järgmised raportid...] 