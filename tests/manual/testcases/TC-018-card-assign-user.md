# TC-018: Kasutaja määramine kaardile
**Kriitilisus:** Medium  
**Eeltingimused:** Kasutaja on sisse logitud, tal on tahvel, sellel vähemalt üks nimekiri ja kaart ning vähemalt kaks kasutajat tahvlil.

| Samm | Tegevus | Oodatav tulemus |
|------|---------|-----------------|
| 1    | Ava tahvli detailvaade | Kuvatakse tahvli ja nimekirjade andmed |
| 2    | Vali kaart ja vajuta "Määra kasutaja" | Kuvatakse kasutajate valik |
| 3    | Vali kasutaja | Kasutaja on valitud |
| 4    | Salvesta määramine | Kasutaja on määratud kaardile ja kuvatakse kaardi detailvaates |

**Testi andmed:**
- Kaardi nimi: Testkaart
- Kasutaja: user2@example.com

**Märkused:**
- Kontrolli, et määramine salvestub andmebaasi 