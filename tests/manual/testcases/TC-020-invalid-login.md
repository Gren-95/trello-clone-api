# TC-020: Ebaõnnestunud sisselogimine vale parooliga
**Kriitilisus:** High  
**Eeltingimused:** Kasutaja `user@example.com` eksisteerib ja on välja logitud.

| Samm | Tegevus | Oodatav tulemus |
|------|---------|-----------------|
| 1    | Ava `/login` leht | Login-vorm on kuvatud |
| 2    | Sisesta e-post `user@example.com` | Väli „Email” sisaldab sisestust |
| 3    | Sisesta vale parool `ValeParool!` | Väli „Password” sisaldab sisestust |
| 4    | Vajuta **Login** | Kuvatakse veateade: "Vale e-post või parool" |

**Testi andmed:**
- E-post: user@example.com
- Parool: ValeParool!

**Märkused:**
- Kontrolli, et kasutaja ei pääse süsteemi 