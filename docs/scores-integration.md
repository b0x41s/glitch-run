# Geverifieerde highscore-integratie

## Bestaande dienst

De FastAPI/PostgreSQL-dienst in `~/highscore-api/` op OpenClaw is op 16 oktober 2026 rechtstreeks via SSH geïnspecteerd. De bestaande Docker Compose-services `api`, `db` en `cloudflared` zijn hergebruikt. Er is geen productie-API, accountdatabase of tunnel naast gezet. Publieke frontendconfiguratie staat in `public/shared/arcade-config.js`.

Alle functionele API-paden beginnen met `/v1`:

| Methode | Pad | Werkelijk contract |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | `{username,password}` → `{token,user:{id,username}}` |
| POST | `/auth/logout` | Bearer-sessie intrekken |
| GET | `/me` | Huidige accountidentiteit |
| GET | `/games` | Gamecatalogus |
| POST | `/games/{game}/runs` | Bearer + `{character}` → `{run_id,secret,started_at,expires_in}` |
| POST | `/runs/{run_id}/finish` | Bearer + `{score,proof}` → `{status:'accepted',score,game,character}` |
| GET | `/games/{game}/leaderboard` | `period=all|week|month`, `character`, `limit` (max. 100) |
| GET | `/games/{game}/records` | Beste bevestigde score per character voor elk van de drie periodes |
| GET | `/me/scores` | Bearer; optioneel `game` en `period`; `{game_id,character,best,runs}[]` |

Proof is de lowercase hex-HMAC-SHA256 van `run_id + ':' + score`, met de door de server uitgegeven eenmalige run-secret als UTF-8 sleutel. Geen gedeelde statische sleutel in frontendcode. Gebruikersnaam: 3–20 letters/cijfers/_/-. Wachtwoord: 10–128 tekens. Bestaande sessieduur, password hashing, rate limits, eigendomscontroles en scorevalidatie blijven behouden.

## Beperkte backendaanpassingen

De patch in deze repository is toegepast op de bestaande dienst, na vergelijking van de bronchecksums en een backup van de drie gewijzigde bronbestanden. Geen schema- of credentialwijziging en geen dataverwijdering.

- Game `biomes` toegevoegd aan de bestaande catalogus; geen dubbele game-implementatie.
- Optionele UTC-periode op persoonlijke records, met dezelfde gewhiteliste kalendergrenzen als het publieke leaderboard. Bestaande requests zonder `period` blijven all-time.
- Hetzelfde reeds geaccepteerde run-id, dezelfde score, juiste eigenaar en hetzelfde geldige bewijs geven bij herhaling dezelfde bevestiging. Er wordt geen extra score opgeslagen. Afwijkende herhalingen en andere gebruikers blijven geweigerd.
- Een volgende ronde maakt alleen verlopen oude starts ongeldig. Geldige rondes vanaf een ander apparaat en pending finishes worden niet door een nieuwe start weggegooid. De bestaande start/finish-rate limits blijven gelden.
- Contraption Lab kan legitiem direct het doel bereiken in de bestaande vrije bouwwijze. Daarom is alleen voor die game de minimumduur nul en de toegestane eenmalige burst 1.000 punten. Overige bestaande gamelimieten zijn behouden. Het nieuwe clientscorebereik voor deze game is 0–1.000.

Alleen de `api`-container is opnieuw opgebouwd met `docker compose up -d --no-deps --build api`. De container-ID's van PostgreSQL en cloudflared zijn vóór/na gelijk gebleven. De API is gezond en `/v1/games` bevat vijf games. CORS voor `https://b0x41s.github.io`, inclusief Authorization en Content-Type op POST, is rechtstreeks gecontroleerd. De nieuw ingezette `main.py` en `games.json` komen overeen met de geteste bestanden.

## Verificatie

- 12 tests van de echte backend met echte PostgreSQL slagen, uitsluitend op een lokale wegwerp-database. Inclusief auth, eigendom, replay, HMAC-afwijzingen, kalenderfilters, rate limits, accountverwijdering, Biomes en gelijktijdige/pending rondes.
- 11 frontend-regeltests slagen: HMAC-contract, accountbinding van pending scores, hervatten met oorspronkelijke run, geen upload van oude records, UTC-periodes, offline/kapotte opslag en audiofade bij een oudere RAF-timestamp.
- De bestaande Biomes-suite slaagt voor 63 regeltests en de DOM-integratietests. De zeven biomen, varianten, perks, medailles en saves blijven behouden.
- De echte Chrome-test tegen de echte lokale API en PostgreSQL slaagt voor alle vijf spelrondes, permanente opslag, een tweede browsercontext zonder gekopieerde sessie of lokale records, alle periode-/variantfilters en offline spelen zonder verzonnen leaderboardgegevens. Een verloren succesvol API-antwoord wordt op hetzelfde run-id opnieuw bevestigd; er staan precies twee echte puzzelrondes, geen dubbele derde. Rapport: `tests/artifacts/browser-report.json` (lokaal gegenereerd).
- Een bestaand foutief modelpad in de Vite-productiebuild is gecorrigeerd, met behoud van de source-hostingroute. Een bestaande muziekfade kon negatief volume instellen; een reproducerende test en begrenzing corrigeren dit zonder muziekfuncties te verwijderen.
- `npm ci`, productiebuild en `npm audit` zijn uitgevoerd; drie indirecte builddependencies zijn binnen de bestaande toegestane versies bijgewerkt en de audit meldt nul kwetsbaarheden.

Testaccounts en testscores bestaan alleen in de tijdelijke lokale database; er zijn geen testscores naar OpenClaw gestuurd. De openbare scorekamer toont alleen echte geaccepteerde servergegevens of een eerlijke lege/offline status. De publieke DNS-/tunnelbereikbaarheid van `scores.b0x41s.nl` wordt los van het werken van de bestaande backend gecontroleerd; een nog niet bereikbaar domein blokkeert lokaal spelen niet.

Bij de eindcontrole leveren zowel Cloudflare DNS-over-HTTPS als Google DNS nog geen A-adres voor `scores.b0x41s.nl`; rechtstreeks HTTPS verbinden kan daardoor nog niet. De server op OpenClaw is wel gezond. De nog door de beheerder te activeren publieke DNS-/tunnelroute staat los van de geteste applicatie-integratie en wordt niet als geslaagde publieke accounttest gepresenteerd. Bronhosting is aanvullend met echte Chrome gecontroleerd: één Biomes-tegel, de scorepagina en het laden/starten van de echte Glitch Run-modellen. De mobiele scorepagina is op 390 en 320 pixels beoordeeld.

De eerste Actions-build vond een ontbrekende optionele peerdependency in het lockbestand die lokaal met npm 11 niet werd gemeld. Het volledige lockbestand is in een lege werkmap aangevuld met de werkelijk door GitHub gebruikte npm 10.9.9. Zowel `npm 10.9.9 ci` als `npm 11.6.2 ci`, de 11 regeltests, productiebuild en audit slagen daarmee. De root- en public-runtimekopieën zijn vergeleken met de productie-output. De oorspronkelijke mislukte CI-uitvoering wordt niet als geslaagde build geteld.

## Invitation-only registration
The account form has a required **Aanmeldcode** field only in registration mode.
The shared client sends it as `registration_code` to `POST /v1/auth/register`.
The backend validates its SHA-256 digest against private server configuration
`REGISTRATION_CODE_SHA256`; absent configuration closes registration.
The actual invitation and digest must never be committed to this repository.
The invitation is cleared after every attempt and is not stored in browser storage.
Login requires only the existing username/password.

The production backend source is maintained separately in `~/code/highscore-api`
and `/home/b0x41s/highscore-api` on OpenClaw. `highscore-backend.patch` describes
the initial arcade integration, not the complete invitation/runtime hardening
added later. The current backend also separates administrative schema setup from
the restricted API database role and keeps API networks internal.
