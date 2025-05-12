# TC-003: Tahvli loomine
**Kriitilisus:** High  
**Eeltingimused:** 
- API server on käivitatud ja kättesaadav
- Kasutaja on sisse logitud (kasuta TC-002 testandmeid)
- JWT token on saadud ja kehtiv

| Samm | Tegevus | Oodatav tulemus |
|------|---------|-----------------|
| 1    | Saada POST päring otspunktile `/boards` koos kehtivate andmetega ja JWT tokeniga | HTTP 201 Created |
| 2    | Kontrolli vastuse sisu | Vastus sisaldab tahvli ID-d, nime ja loomise aega |
| 3    | Proovi luua tahvel ilma nimeta | HTTP 400 Bad Request |
| 4    | Proovi luua tahvel ilma autentimiseta | HTTP 401 Unauthorized |
| 5    | Saada GET päring otspunktile `/boards` | HTTP 200 OK ja loetelu loodud tahvlitest |

**Testi andmed:**
- Kehtiv tahvel:
  - Nimi: "Test Tahvel"
  - Kirjeldus: "See on test tahvel"
- Vale tahvel:
  - Nimi: ""

**Märkused:**
- Tahvli loomisel peab olema kehtiv JWT token
- Tahvli nimi peab olema unikaalne kasutaja jaoks
- Tahvli loomisel luuakse automaatselt kolm vaikenimekirja: "Tehtud", "Tegemisel" ja "Plaanitud" 