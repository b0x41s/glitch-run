# Glitch Run

![Glitch Run hero artwork](docs/glitch-run-hero.jpg)

Een speelbare Three.js endless runner met Casper, Bas, Tamara, Lisette en Laurens.

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
