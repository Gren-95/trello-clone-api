# TC-001: Kasutaja registreerimine
**Kriitilisus:** High  
**Eeltingimused:** API server on käivitatud ja kättesaadav  

| Samm | Tegevus | Oodatav tulemus |
|------|---------|-----------------|
| 1    | Saada POST päring otspunktile `/users` koos kehtivate andmetega | HTTP 201 Created |
| 2    | Kontrolli vastuse sisu | Vastus sisaldab kasutaja ID-d ja loomise aega, aga mitte parooli |
| 3    | Proovi registreerida sama kasutajanimega | HTTP 409 Conflict |
| 4    | Proovi registreerida ilma kasutajanime või paroolita | HTTP 400 Bad Request |

**Testi andmed:**
- Kehtiv kasutaja:
  - Kasutajanimi: "testuser"
  - Parool: "Test123!"
- Olemasolev kasutaja:
  - Kasutajanimi: "existinguser"
  - Parool: "Test123!"

**Märkused:**
- Testi andmed tuleks enne testi läbiviimist puhastada
- Parool peab vastama minimaalsetele nõuetele (vähemalt 8 tähemärki, suur- ja väiketähed, numbrid) 