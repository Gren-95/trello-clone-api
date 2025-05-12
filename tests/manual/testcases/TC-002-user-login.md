# TC-002: Kasutaja sisselogimine
**Kriitilisus:** High  
**Eeltingimused:** 
- API server on käivitatud ja kättesaadav
- Kasutaja on registreeritud (kasuta TC-001 testandmeid)

| Samm | Tegevus | Oodatav tulemus |
|------|---------|-----------------|
| 1    | Saada POST päring otspunktile `/login` koos kehtivate andmetega | HTTP 200 OK ja JWT token |
| 2    | Kontrolli JWT tokeni kehtivust | Token on kehtiv ja sisaldab õigeid andmeid |
| 3    | Proovi sisse logida vale paroliga | HTTP 401 Unauthorized |
| 4    | Proovi sisse logida olematu kasutajaga | HTTP 401 Unauthorized |
| 5    | Proovi sisse logida ilma andmeteta | HTTP 400 Bad Request |

**Testi andmed:**
- Kehtiv kasutaja:
  - Kasutajanimi: "testuser"
  - Parool: "Test123!"
- Vale parool:
  - Kasutajanimi: "testuser"
  - Parool: "WrongPass123!"

**Märkused:**
- JWT token peab sisaldama kasutaja ID-d ja aegumisajat
- Token peab olema kasutatav järgmiste päringute autentimiseks 