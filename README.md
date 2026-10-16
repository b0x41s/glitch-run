# Tex Arcade

![Glitch Run hero artwork](docs/cover.png)

Vijf speelbare browsergames: Glitch Run, Bomber Tribe, Metro Vice 96, Contraption Lab en Biomes (World Debugger). De bestaande games en hun lokale voortgang blijven behouden.

## Live spelen

<https://b0x41s.github.io/glitch-run/>

## Gameplay

- Automatisch vooruit rennen door een procedureel opgebouwde cyberwereld
- Hoge firewalls ontwijken en lage barrières overspringen
- Gouden coins verzamelen voor score, combo en sprintenergie
- Tijdelijk sprinten met `Shift`, daarna moet het character op adem komen
- Drie integriteitspunten en een zichtbare glitchmuur die steeds dichterbij komt
- Korte zones, hogere snelheid en snel oplopende obstakeldichtheid
- Waarschuwingen, schermdruk en sterkere effecten wanneer de glitch dichtbij komt
- Afzonderlijke lokale highscores voor Casper, Bas, Tamara, Lisette en Laurens
- Characterselectie met buiganimatie, pauzescherm, game-over en opnieuw spelen
- Wisselbare volgcamera en frontale Crash-camera
- Procedurele muziek en geluidseffecten via de Web Audio API
- Desktop en mobiele besturing

## Besturing

- `A` en `D`, of de pijltjestoetsen, sturen naar links en rechts
- `Spatie`, springen
- `Shift`, enkele seconden sprinten, loslaten om te herstellen
- `W`, lichte versnelling
- `S`, afremmen
- `C`, wisselen tussen de volgcamera en de frontale Crash-camera
- `M`, geluid aan of uit
- `Esc`, pauzeren
- `R`, opnieuw starten na game-over

## Lokaal starten

```bash
npm install
npm run dev
```

Open de URL die Vite toont, normaal `http://localhost:5173`.

## Productiebuild maken

```bash
npm run build
npm run preview
```

## GitHub Pages

De workflow in `.github/workflows/deploy-pages.yml` bouwt en publiceert de game automatisch na iedere push naar `main`.

Activeer dit eenmalig via:

```text
Repository → Settings → Pages → Build and deployment → Source → GitHub Actions
```

## Techniek

- Three.js
- Vite
- glTF/GLB characters met skelet en animaties
- Web Audio API
- Lokale opslag voor highscores per character
- GitHub Actions en GitHub Pages


## Biomes / World Debugger

Kies **Biomes** in de arcade of open <https://b0x41s.github.io/glitch-run/world-debugger/>. Dit is de bestaande World Debugger-game, geen tweede implementatie. Verken zeven dioramabiomen, vind vreemde objecten op wisselende plekken en verdien medailles. De game heeft zes spelmodi, perks, lokaal hervatten, een 3–2–1–GO-start en een overslaande levelovergang. Geluid bevat alleen korte effecten; er is geen achtergrondmuziek.

`public/` is de bron voor zelfstandige games, de gedeelde score-client en de scorepagina. `npm run build` synchroniseert `world-debugger/`, `shared/` en `scores/` via `tools/sync-static.mjs`, zodat ook de bestaande rechtstreeks gehoste Pages-versie werkt. Bewerk deze gegenereerde rootkopieën niet afzonderlijk. De knop **Alle spellen** leidt terug naar de arcade.

## Scores en accounts

Open <https://b0x41s.github.io/glitch-run/scores/> of kies **Scores & account** in het arcade-menu. De pagina toont serverbevestigde leaderboards voor alle vijf games, records per character of spelvariant, accountrecords en afzonderlijke lokale apparaatrecords. Filters: All-time, deze kalenderweek en deze kalendermaand, in UTC. Met hetzelfde account op een ander apparaat verschijnen dezelfde online records. Accounts gebruiken de bestaande FastAPI-authenticatie; er is geen tweede accountdatabase.

De gedeelde client staat in `public/shared/score-client.js`. Alle games starten een server-run wanneer een ronde begint en sluiten die bij winst of verlies af met het voorgeschreven HMAC-SHA256-bewijs. Biomes bewaart zijn oorspronkelijke online run bij pauzeren en hervatten. Wisselen naar Vrij verkennen na game-over blijft lokaal, zodat eerder verdiende punten niet als een nieuwe server-run worden voorgesteld.

API-URL configureren: bewerk `scoreApiUrl` in **`public/shared/arcade-config.js`** en bouw opnieuw. Standaard: `https://scores.b0x41s.nl`. Het bestand is publieke configuratie en bevat nooit credentials of API-keys. Bearer-sessies worden na inloggen door de server uitgegeven; wachtwoorden worden niet in browseropslag bewaard. Gebruik HTTPS, behalve voor een expliciete lokale test-API op localhost.

Als de API of het toekomstige domein niet bereikbaar is, blijven de games lokaal speelbaar. De scorepagina toont dan een offline melding, geen fictieve scores. Een offline gestarte ronde blijft lokaal: de client maakt achteraf geen kunstmatige serverstart. Als alleen het afsluiten van een reeds gestarte online ronde mislukt, bewaart hij het bewijs voor dezelfde run. Bij terugkeer van de verbinding, openen van de arcade/scorepagina of **Opnieuw synchroniseren** volgt een herpoging, zolang de oorspronkelijke run nog geldig is. Pending scores zijn gebonden aan account én API-URL. Ze worden niet onder een ander account ingediend. Historische lokale highscores worden niet als nieuwe online rondes geüpload.

Biomes-records zijn gescheiden per modus, perk en weergave; de dagmissie ook per datum. Bomber Tribe gebruikt character en moeilijkheid. Metro Vice scheidt de standaardkaart en eigen kaarten. Contraption Lab krijgt een score bij het voor het eerst bereiken van het doel: `max(0, 1000 − 50 × aantal niet-balonderdelen − floor(10 × simulatieseconden))`. Het blijft de bestaande vrije bouwpuzzel; dit voegt geen nieuwe game of vast level toe.

Het gecontroleerde backendcontract, de beperkte aanpassingen op OpenClaw en verificatie staan in [docs/scores-integration.md](docs/scores-integration.md). De codewijziging van de bestaande API is vastgelegd in [docs/highscore-backend.patch](docs/highscore-backend.patch).

## Integratie testen

```bash
npm ci
npm test
npm run build
npm audit
```

De echte browsertest `tests/arcade-browser.cjs` gebruikt Playwright en een afzonderlijke lokale kopie van de echte FastAPI-app met een **wegwerp-PostgreSQL-database**. Hij speelt alle vijf games, controleert een tweede browsersessie, filters, hervatten, een verloren scorebevestiging en offline spelen. Installeer Playwright in je testomgeving en geef desgewenst `WD_PLAYWRIGHT` en `WD_BROWSER_EXECUTABLE` mee. Start de gebouwde site op poort 18770 en de test-API op 18993, of geef `ARCADE_TEST_URL` en `ARCADE_TEST_API` mee. Configureer CORS op de test-API voor de gebruikte lokale origin.

```bash
npm run preview -- --port 18770
# In een tweede terminal, met de wegwerp-API gestart:
npm run test:browser
```

**Voer de backend-pytests nooit op de productiedatabase uit:** de bestaande fixture gebruikt `TRUNCATE`. In deze integratie zijn ze uitsluitend op een aparte lokale database uitgevoerd. Testspelers en testscores zijn niet naar de productie-API gestuurd.
