# TC-019: Kasutaja eemaldamine kaardilt
**Kriitilisus:** Low  
**Eeltingimused:** Kasutaja on sisse logitud, tal on tahvel, sellel vähemalt üks nimekiri ja kaart, millele on määratud vähemalt kaks kasutajat.

| Samm | Tegevus | Oodatav tulemus |
|------|---------|-----------------|
| 1    | Ava tahvli detailvaade | Kuvatakse tahvli ja nimekirjade andmed |
| 2    | Vali kaart ja ava kasutajate loend | Kuvatakse kaardile määratud kasutajad |
| 3    | Vali kasutaja ja vajuta "Eemalda" | Kasutaja eemaldatakse kaardilt |

**Testi andmed:**
- Kaardi nimi: Testkaart
- Eemaldatav kasutaja: user2@example.com

**Märkused:**
- Kontrolli, et kasutaja eemaldatakse andmebaasist ja tal pole enam ligipääsu kaardile 