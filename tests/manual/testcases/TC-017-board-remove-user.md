# TC-017: Kasutaja eemaldamine tahvlilt
**Kriitilisus:** Medium  
**Eeltingimused:** Kasutaja on sisse logitud, tal on tahvel ja sellel on vähemalt kaks kasutajat.

| Samm | Tegevus | Oodatav tulemus |
|------|---------|-----------------|
| 1    | Ava tahvli detailvaade | Kuvatakse tahvli andmed ja kasutajate loend |
| 2    | Vali kasutaja ja vajuta "Eemalda" | Kuvatakse kinnitusdialoog |
| 3    | Kinnita eemaldamine | Kasutaja eemaldatakse tahvlilt |

**Testi andmed:**
- Eemaldatava kasutaja e-post: user2@example.com

**Märkused:**
- Kontrolli, et kasutaja eemaldatakse andmebaasist ja tal pole enam ligipääsu tahvlile 